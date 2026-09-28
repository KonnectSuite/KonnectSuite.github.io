import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(scriptDir, '..');
const manifestPath = path.join(kitRoot, 'brand-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const failures = [];
const results = { assetsChecked: 0, pngsChecked: 0, apngsChecked: 0, webpsChecked: 0, svgsChecked: 0, icosChecked: 0, icnsChecked: 0 };

function fail(relativePath, message) {
	failures.push({ path: relativePath, message });
}

function validateIco(relativePath, buffer, expectedSizes) {
	if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
		fail(relativePath, 'Invalid ICO header.');
		return;
	}
	const count = buffer.readUInt16LE(4);
	const sizes = [];
	for (let index = 0; index < count; index++) {
		const base = 6 + index * 16;
		if (base + 16 > buffer.length) {
			fail(relativePath, 'Truncated ICO directory.');
			return;
		}
		sizes.push(buffer[base] === 0 ? 256 : buffer[base]);
	}
	if (JSON.stringify(sizes) !== JSON.stringify(expectedSizes)) {
		fail(relativePath, `ICO sizes ${sizes.join(', ')} do not match manifest ${expectedSizes.join(', ')}.`);
	}
	results.icosChecked++;
}

function validateIcns(relativePath, buffer) {
	if (buffer.length < 8 || buffer.toString('ascii', 0, 4) !== 'icns' || buffer.readUInt32BE(4) !== buffer.length) {
		fail(relativePath, 'Invalid ICNS header or length.');
		return;
	}
	const chunks = new Set();
	let offset = 8;
	while (offset < buffer.length) {
		if (offset + 8 > buffer.length) {
			fail(relativePath, 'Truncated ICNS chunk header.');
			break;
		}
		const type = buffer.toString('ascii', offset, offset + 4);
		const length = buffer.readUInt32BE(offset + 4);
		if (length < 8 || offset + length > buffer.length) {
			fail(relativePath, `Invalid ICNS chunk ${type}.`);
			break;
		}
		chunks.add(type);
		offset += length;
	}
	for (const required of ['icp4', 'ic07', 'ic08', 'ic09', 'ic10']) {
		if (!chunks.has(required)) {
			fail(relativePath, `Missing ICNS representation ${required}.`);
		}
	}
	results.icnsChecked++;
}

function validateApng(relativePath, buffer, asset) {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	if (!buffer.subarray(0, 8).equals(signature)) {
		fail(relativePath, 'Invalid APNG signature.');
		return;
	}
	let offset = 8;
	let ihdr;
	let declaredFrames;
	let frameControls = 0;
	while (offset + 12 <= buffer.length) {
		const length = buffer.readUInt32BE(offset);
		const type = buffer.toString('ascii', offset + 4, offset + 8);
		const data = buffer.subarray(offset + 8, offset + 8 + length);
		if (type === 'IHDR') ihdr = data;
		if (type === 'acTL') declaredFrames = data.readUInt32BE(0);
		if (type === 'fcTL') frameControls++;
		offset += 12 + length;
	}
	if (!ihdr) {
		fail(relativePath, 'APNG is missing IHDR.');
		return;
	}
	const width = ihdr.readUInt32BE(0);
	const height = ihdr.readUInt32BE(4);
	const hasAlpha = ihdr[9] === 4 || ihdr[9] === 6;
	if (!hasAlpha) fail(relativePath, 'APNG does not use an alpha-capable color type.');
	if (width !== asset.dimensions.width || height !== asset.dimensions.height) fail(relativePath, `APNG frame is ${width}x${height}; expected ${asset.dimensions.width}x${asset.dimensions.height}.`);
	if (declaredFrames !== asset.frames || frameControls !== asset.frames) fail(relativePath, `APNG declares ${declaredFrames || 0} frame(s) with ${frameControls} controls; expected ${asset.frames}.`);
	results.apngsChecked++;
}

function validateAnimatedWebp(relativePath, buffer, asset) {
	if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
		fail(relativePath, 'Invalid animated WebP header.');
		return;
	}
	let offset = 12;
	let canvas;
	let hasAnimationFlag = false;
	let hasAlphaFlag = false;
	let frames = 0;
	let hasAnimationControl = false;
	while (offset + 8 <= buffer.length) {
		const type = buffer.toString('ascii', offset, offset + 4);
		const length = buffer.readUInt32LE(offset + 4);
		const data = buffer.subarray(offset + 8, offset + 8 + length);
		if (type === 'VP8X' && data.length >= 10) {
			hasAnimationFlag = (data[0] & 0x02) !== 0;
			hasAlphaFlag = (data[0] & 0x10) !== 0;
			canvas = { width: data.readUIntLE(4, 3) + 1, height: data.readUIntLE(7, 3) + 1 };
		}
		if (type === 'ANIM') hasAnimationControl = true;
		if (type === 'ANMF') frames++;
		offset += 8 + length + (length % 2);
	}
	if (!hasAnimationFlag || !hasAnimationControl) fail(relativePath, 'WebP is missing animation flags or control data.');
	if (!hasAlphaFlag) fail(relativePath, 'Animated WebP is missing the alpha flag.');
	if (!canvas || canvas.width !== asset.dimensions.width || canvas.height !== asset.dimensions.height) fail(relativePath, `Animated WebP canvas is ${canvas ? `${canvas.width}x${canvas.height}` : 'missing'}; expected ${asset.dimensions.width}x${asset.dimensions.height}.`);
	if (frames !== asset.frames) fail(relativePath, `Animated WebP contains ${frames} frame(s); expected ${asset.frames}.`);
	results.webpsChecked++;
}

for (const asset of manifest.assets) {
	const absolute = path.join(kitRoot, asset.path);
	results.assetsChecked++;
	if (!fs.existsSync(absolute)) {
		fail(asset.path, 'File is missing.');
		continue;
	}
	const buffer = fs.readFileSync(absolute);
	if (asset.format === 'svg') {
		const content = buffer.toString('utf8');
		if (!content.includes('<svg') || !/viewBox="0 0 [\d.]+ [\d.]+"/.test(content)) {
			fail(asset.path, 'SVG is missing its root or viewBox.');
		}
		if (/<text\b/i.test(content) || /font-family=/i.test(content)) {
			fail(asset.path, 'SVG contains font-dependent text instead of vector paths.');
		}
		if (/href="https?:/i.test(content)) {
			fail(asset.path, 'SVG references an external network resource.');
		}
		results.svgsChecked++;
	} else if (asset.format === 'png') {
		try {
			const metadata = await sharp(buffer).metadata();
			if (asset.alphaRequired !== false && !metadata.hasAlpha) {
				fail(asset.path, 'PNG does not contain an alpha channel.');
			}
			if (asset.dimensions && (metadata.width !== asset.dimensions.width || metadata.height !== asset.dimensions.height)) {
				fail(asset.path, `PNG is ${metadata.width}x${metadata.height}; expected ${asset.dimensions.width}x${asset.dimensions.height}.`);
			}
			results.pngsChecked++;
		} catch (error) {
			fail(asset.path, `PNG could not be decoded: ${error.message}`);
		}
	} else if (asset.format === 'apng') {
		validateApng(asset.path, buffer, asset);
	} else if (asset.format === 'webp') {
		validateAnimatedWebp(asset.path, buffer, asset);
	} else if (asset.format === 'ico') {
		validateIco(asset.path, buffer, asset.sizes);
	} else if (asset.format === 'icns') {
		validateIcns(asset.path, buffer);
	}
}

if (manifest.schemaVersion !== 2) fail('brand-manifest.json', 'Expected schemaVersion 2.');
if (manifest.brand !== 'AryaAI') fail('brand-manifest.json', 'Canonical brand must be AryaAI.');
if (manifest.tagline !== 'Your AI engineering pal') fail('brand-manifest.json', 'Canonical tagline is incorrect.');
if (!manifest.companion || manifest.companion.states?.length !== 12) fail('brand-manifest.json', 'Companion manifest must define exactly 12 states.');

for (const relativePath of ['README.md', 'BRAND-GUIDE.md', 'aryaai-tokens.json', 'aryaai-tokens.css', 'brand-manifest.json']) {
	const content = fs.readFileSync(path.join(kitRoot, relativePath), 'utf8');
	if (/ArayAI|AryaAIA/i.test(content)) fail(relativePath, 'Contains a misspelled AryaAI brand name.');
	if (/INDUSTRIAL CODING AGENT/i.test(content)) fail(relativePath, 'Contains the retired primary tagline.');
}

const report = {
	status: failures.length === 0 ? 'passed' : 'failed',
	...results,
	failures
};

fs.writeFileSync(path.join(kitRoot, 'validation-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
if (failures.length > 0) {
	console.error(`Brand kit validation failed with ${failures.length} issue(s).`);
	for (const failure of failures.slice(0, 20)) {
		console.error(`- ${failure.path}: ${failure.message}`);
	}
	process.exitCode = 1;
} else {
	console.log(`Brand kit validation passed: ${results.assetsChecked} assets checked.`);
}
