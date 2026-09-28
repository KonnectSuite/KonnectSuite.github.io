import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

export const companionStates = Object.freeze([
	{ id: 'idle', label: 'Idle', cue: 'calm smile' },
	{ id: 'greeting', label: 'Greeting', cue: 'friendly wave' },
	{ id: 'thinking', label: 'Thinking', cue: 'thought spark' },
	{ id: 'researching', label: 'Researching', cue: 'scanner' },
	{ id: 'creating', label: 'Creating', cue: 'idea light' },
	{ id: 'running-testing', label: 'Running / testing', cue: 'check panel' },
	{ id: 'writing', label: 'Writing', cue: 'notebook' },
	{ id: 'explaining', label: 'Explaining', cue: 'raised finger' },
	{ id: 'waiting', label: 'Waiting', cue: 'hourglass' },
	{ id: 'success-celebrating', label: 'Success / celebrating', cue: 'confetti' },
	{ id: 'warning', label: 'Warning', cue: 'amber alert' },
	{ id: 'error', label: 'Error', cue: 'red error' }
]);

const sourceCellSize = 362;
const sourceColumns = 4;
let openStateBuffers;
let blinkStateBuffers;

async function removeSmallBottomEdgeComponents(buffer) {
	const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const seen = new Uint8Array(info.width * info.height);
	for (let start = 0; start < seen.length; start++) {
		if (seen[start] || data[start * 4 + 3] < 8) continue;
		const stack = [start];
		const pixels = [];
		let touchesBottom = false;
		seen[start] = 1;
		while (stack.length > 0) {
			const current = stack.pop();
			pixels.push(current);
			const x = current % info.width;
			const y = Math.floor(current / info.width);
			if (y === info.height - 1) touchesBottom = true;
			for (const neighbor of [current - 1, current + 1, current - info.width, current + info.width]) {
				if (neighbor < 0 || neighbor >= seen.length || seen[neighbor] || data[neighbor * 4 + 3] < 8) continue;
				if (Math.abs((neighbor % info.width) - x) > 1) continue;
				seen[neighbor] = 1;
				stack.push(neighbor);
			}
		}
		if (touchesBottom && pixels.length < 2000) {
			for (const pixel of pixels) {
				data[pixel * 4] = 0;
				data[pixel * 4 + 1] = 0;
				data[pixel * 4 + 2] = 0;
				data[pixel * 4 + 3] = 0;
			}
		}
	}
	return sharp(data, { raw: info }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

export async function loadCompanionSources(kitRoot) {
	const sourceRoot = path.join(kitRoot, 'sources', 'mascot');
	const openPath = path.join(sourceRoot, 'aryaai-companion-open-master.png');
	const blinkPath = path.join(sourceRoot, 'aryaai-companion-blink-master.png');
	for (const sourcePath of [openPath, blinkPath]) {
		if (!fs.existsSync(sourcePath)) {
			throw new Error(`Missing mascot source: ${sourcePath}`);
		}
		const metadata = await sharp(sourcePath).metadata();
		if (metadata.width !== 1448 || metadata.height !== 1086 || !metadata.hasAlpha) {
			throw new Error(`Mascot source must be a transparent 1448x1086 PNG: ${sourcePath}`);
		}
	}
	openStateBuffers = new Map();
	blinkStateBuffers = new Map();
	for (let index = 0; index < companionStates.length; index++) {
		const state = companionStates[index];
		const region = {
			left: (index % sourceColumns) * sourceCellSize,
			top: Math.floor(index / sourceColumns) * sourceCellSize,
			width: sourceCellSize,
			height: sourceCellSize
		};
		const openCrop = await sharp(openPath).extract(region).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
		const blinkCrop = await sharp(blinkPath).extract(region).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
		openStateBuffers.set(state.id, await removeSmallBottomEdgeComponents(openCrop));
		blinkStateBuffers.set(state.id, await removeSmallBottomEdgeComponents(blinkCrop));
	}
}

function stateBuffer(stateId, blink = false) {
	const collection = blink ? blinkStateBuffers : openStateBuffers;
	const buffer = collection?.get(stateId);
	if (!buffer) {
		throw new Error(`Companion source state was not loaded: ${stateId}`);
	}
	return buffer;
}

export function mascotImageElement(stateId, x, y, width, height, opacity = 1) {
	const data = stateBuffer(stateId).toString('base64');
	return `<image x="${x}" y="${y}" width="${width}" height="${height}" opacity="${opacity}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${data}"/>`;
}

function crc32(buffer) {
	let crc = 0xffffffff;
	for (const byte of buffer) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) {
			crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
	const typeBuffer = Buffer.from(type, 'ascii');
	const output = Buffer.alloc(12 + data.length);
	output.writeUInt32BE(data.length, 0);
	typeBuffer.copy(output, 4);
	data.copy(output, 8);
	output.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length);
	return output;
}

function parsePng(buffer) {
	const chunks = [];
	let offset = 8;
	while (offset < buffer.length) {
		const length = buffer.readUInt32BE(offset);
		const type = buffer.toString('ascii', offset + 4, offset + 8);
		chunks.push({ type, data: buffer.subarray(offset + 8, offset + 8 + length) });
		offset += 12 + length;
	}
	return chunks;
}

function encodeApng(frames, delays) {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const parsed = frames.map(parsePng);
	const ihdr = parsed[0].find(chunk => chunk.type === 'IHDR').data;
	const animationControl = Buffer.alloc(8);
	animationControl.writeUInt32BE(frames.length, 0);
	animationControl.writeUInt32BE(0, 4);
	const parts = [signature, pngChunk('IHDR', ihdr), pngChunk('acTL', animationControl)];
	let sequence = 0;
	for (let index = 0; index < frames.length; index++) {
		const frameControl = Buffer.alloc(26);
		frameControl.writeUInt32BE(sequence++, 0);
		frameControl.writeUInt32BE(ihdr.readUInt32BE(0), 4);
		frameControl.writeUInt32BE(ihdr.readUInt32BE(4), 8);
		frameControl.writeUInt32BE(0, 12);
		frameControl.writeUInt32BE(0, 16);
		frameControl.writeUInt16BE(delays[index], 20);
		frameControl.writeUInt16BE(1000, 22);
		frameControl[24] = 0;
		frameControl[25] = 0;
		parts.push(pngChunk('fcTL', frameControl));
		for (const chunk of parsed[index].filter(item => item.type === 'IDAT')) {
			if (index === 0) {
				parts.push(pngChunk('IDAT', chunk.data));
			} else {
				const frameData = Buffer.alloc(4 + chunk.data.length);
				frameData.writeUInt32BE(sequence++, 0);
				chunk.data.copy(frameData, 4);
				parts.push(pngChunk('fdAT', frameData));
			}
		}
	}
	parts.push(pngChunk('IEND', Buffer.alloc(0)));
	return Buffer.concat(parts);
}

function riffChunk(type, data) {
	const padding = data.length % 2 === 1 ? Buffer.from([0]) : Buffer.alloc(0);
	const header = Buffer.alloc(8);
	header.write(type, 0, 4, 'ascii');
	header.writeUInt32LE(data.length, 4);
	return Buffer.concat([header, data, padding]);
}

function webpImagePayload(buffer) {
	if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
		throw new Error('Invalid static WebP frame.');
	}
	const chunks = [];
	let offset = 12;
	while (offset + 8 <= buffer.length) {
		const type = buffer.toString('ascii', offset, offset + 4);
		const length = buffer.readUInt32LE(offset + 4);
		const end = offset + 8 + length + (length % 2);
		if (['ALPH', 'VP8 ', 'VP8L'].includes(type)) {
			chunks.push(buffer.subarray(offset, end));
		}
		offset = end;
	}
	if (!chunks.some(chunk => ['VP8 ', 'VP8L'].includes(chunk.toString('ascii', 0, 4)))) {
		throw new Error('Static WebP frame contains no image payload.');
	}
	return Buffer.concat(chunks);
}

async function encodeAnimatedWebp(frames, delays, size) {
	const extended = Buffer.alloc(10);
	extended[0] = 0x12;
	extended.writeUIntLE(size - 1, 4, 3);
	extended.writeUIntLE(size - 1, 7, 3);
	const animation = Buffer.alloc(6);
	animation.writeUInt32LE(0, 0);
	animation.writeUInt16LE(0, 4);
	const parts = [riffChunk('VP8X', extended), riffChunk('ANIM', animation)];
	for (let index = 0; index < frames.length; index++) {
		const staticWebp = await sharp(frames[index]).webp({ lossless: true, alphaQuality: 100, effort: 6 }).toBuffer();
		const frameHeader = Buffer.alloc(16);
		frameHeader.writeUIntLE(0, 0, 3);
		frameHeader.writeUIntLE(0, 3, 3);
		frameHeader.writeUIntLE(size - 1, 6, 3);
		frameHeader.writeUIntLE(size - 1, 9, 3);
		frameHeader.writeUIntLE(delays[index], 12, 3);
		frameHeader[15] = 0;
		parts.push(riffChunk('ANMF', Buffer.concat([frameHeader, webpImagePayload(staticWebp)])));
	}
	const body = Buffer.concat([Buffer.from('WEBP', 'ascii'), ...parts]);
	const header = Buffer.alloc(8);
	header.write('RIFF', 0, 4, 'ascii');
	header.writeUInt32LE(body.length, 4);
	return Buffer.concat([header, body]);
}

async function motionFrame(source, size, offsetY, glowOpacity) {
	const portraitSize = size - 8;
	const portrait = await sharp(source).resize(portraitSize, portraitSize, { fit: 'contain' }).png().toBuffer();
	const glow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${Math.round(size * 0.79)}" cy="${Math.round(size * 0.32)}" r="${Math.round(size * 0.11)}" fill="none" stroke="#00E0D2" stroke-width="${Math.max(3, Math.round(size * 0.018))}" opacity="${glowOpacity}"/></svg>`);
	return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite([
			{ input: glow, left: 0, top: 0 },
			{ input: portrait, left: 4, top: 4 + offsetY }
		])
		.png({ compressionLevel: 9, adaptiveFiltering: true })
		.toBuffer();
}

async function buildAnimation(stateId, size = 256) {
	const open = stateBuffer(stateId);
	const blink = stateBuffer(stateId, true);
	const sources = [open, open, open, blink, blink, open, open, open];
	const offsets = [2, 1, 0, 0, 0, 0, 1, 2];
	const glow = [0.18, 0.28, 0.42, 0.56, 0.48, 0.36, 0.25, 0.18];
	const delays = [180, 180, 1200, 90, 90, 900, 180, 180];
	const frames = [];
	for (let index = 0; index < sources.length; index++) {
		frames.push(await motionFrame(sources[index], size, offsets[index], glow[index]));
	}
	const apng = encodeApng(frames, delays);
	const webp = await encodeAnimatedWebp(frames, delays, size);
	return { apng, webp, frames: frames.length, delays };
}

async function spriteSheet(size) {
	const composites = [];
	for (let index = 0; index < companionStates.length; index++) {
		const state = companionStates[index];
		const image = await sharp(stateBuffer(state.id)).resize(size, size, { fit: 'contain' }).png().toBuffer();
		composites.push({ input: image, left: (index % 4) * size, top: Math.floor(index / 4) * size });
	}
	return sharp({ create: { width: size * 4, height: size * 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
		.composite(composites)
		.png({ compressionLevel: 9, adaptiveFiltering: true })
		.toBuffer();
}

export async function generateCompanionAssets({ ensureParent, registerAsset }) {
	const sizes = [16, 20, 24, 32, 48, 64, 128, 256, 512, 1024];
	for (const state of companionStates) {
		const master = stateBuffer(state.id);
		const masterPath = `companion/${state.id}/master.png`;
		fs.writeFileSync(ensureParent(masterPath), master);
		registerAsset(masterPath, 'companion', state.id, 'master', 'png', { width: sourceCellSize, height: sourceCellSize }, { alphaRequired: true });
		for (const size of sizes) {
			const output = await sharp(master).resize(size, size, { fit: 'contain', kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
			const relative = `companion/${state.id}/static/${size}.png`;
			fs.writeFileSync(ensureParent(relative), output);
			registerAsset(relative, 'companion', state.id, `static-${size}`, 'png', { width: size, height: size }, { alphaRequired: true });
		}
		const reduced = await sharp(master).resize(256, 256, { fit: 'contain' }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
		const reducedPath = `companion/${state.id}/reduced-motion.png`;
		fs.writeFileSync(ensureParent(reducedPath), reduced);
		registerAsset(reducedPath, 'companion', state.id, 'reduced-motion', 'png', { width: 256, height: 256 }, { alphaRequired: true });

		const animation = await buildAnimation(state.id);
		const apngPath = `companion/${state.id}/animated/256.apng`;
		const webpPath = `companion/${state.id}/animated/256.webp`;
		fs.writeFileSync(ensureParent(apngPath), animation.apng);
		fs.writeFileSync(ensureParent(webpPath), animation.webp);
		const animationMeta = { width: 256, height: 256, frames: animation.frames, loop: 0, delaysMs: animation.delays, alphaRequired: true };
		registerAsset(apngPath, 'companion-animation', state.id, 'apng', 'apng', { width: 256, height: 256 }, animationMeta);
		registerAsset(webpPath, 'companion-animation', state.id, 'webp', 'webp', { width: 256, height: 256 }, animationMeta);
	}
	for (const size of [64, 128, 256]) {
		const sprite = await spriteSheet(size);
		const relative = `companion/sprites/aryaai-companion-12-state-${size}.png`;
		fs.writeFileSync(ensureParent(relative), sprite);
		registerAsset(relative, 'companion-sprite', 'all-states', `4x3-${size}`, 'png', { width: size * 4, height: size * 3 }, { cellSize: size, columns: 4, rows: 3, alphaRequired: true });
	}
}
