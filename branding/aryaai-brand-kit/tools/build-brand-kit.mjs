import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { companionStates, generateCompanionAssets, loadCompanionSources, mascotImageElement } from './companion-assets.mjs';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const opentype = require('opentype.js');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const kitRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(kitRoot, '..', '..');

const palette = Object.freeze({
	primaryBlue: '#2B6CFF',
	accentTeal: '#00E0D2',
	accentPurple: '#8A5CFF',
	darkBackground: '#0F141B',
	surface: '#171D26',
	textLight: '#E6E8EB',
	error: '#FF3B30',
	warning: '#FFB020',
	success: '#30D158'
});

const generatedDirectories = [
	'logos',
	'header',
	'app-icons',
	'companion',
	'desktop-icons',
	'splash',
	'tray',
	'file-icons',
	'preview'
];

const manifest = {
	schemaVersion: 2,
	brand: 'AryaAI',
	tagline: 'Your AI engineering pal',
	sourceReference: 'sources/mascot/aryaai-approved-portrait-reference.png',
	generatedBy: 'tools/build-brand-kit.mjs',
	palette,
	typography: {
		primary: { family: 'Sora', source: 'sources/fonts/Sora-Variable.ttf' },
		secondary: { family: 'JetBrains Mono', source: 'sources/fonts/JetBrainsMono-Variable.ttf' }
	},
	companion: {
		states: companionStates.map(state => ({ ...state })),
		staticSizes: [16, 20, 24, 32, 48, 64, 128, 256, 512, 1024],
		animation: { formats: ['apng', 'webp'], size: 256, loop: 0, reducedMotion: 'reduced-motion.png' },
		spriteSheets: { columns: 4, rows: 3, cellSizes: [64, 128, 256] }
	},
	assets: []
};

function assertInsideKit(candidate) {
	const resolved = path.resolve(candidate);
	const relative = path.relative(kitRoot, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		throw new Error(`Refusing to write outside brand kit: ${resolved}`);
	}
	return resolved;
}

function resetGeneratedDirectories() {
	for (const relative of generatedDirectories) {
		const target = assertInsideKit(path.join(kitRoot, relative));
		fs.rmSync(target, { recursive: true, force: true });
		fs.mkdirSync(target, { recursive: true });
	}
}

function ensureParent(relativePath) {
	const absolute = assertInsideKit(path.join(kitRoot, relativePath));
	fs.mkdirSync(path.dirname(absolute), { recursive: true });
	return absolute;
}

function registerAsset(relativePath, family, name, variant, format, dimensions = undefined, extra = undefined) {
	const asset = { path: relativePath.replaceAll('\\', '/'), family, name, variant, format };
	if (dimensions) {
		asset.dimensions = dimensions;
	}
	if (extra) {
		Object.assign(asset, extra);
	}
	manifest.assets.push(asset);
}

function escapeXml(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function svgDocument(width, height, title, body, defs = '') {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">AryaAI production brand asset. Vector artwork contains no external resources.</desc>
  ${defs ? `<defs>${defs}</defs>` : ''}
  ${body}
</svg>
`.replaceAll(/^[\t ]+$/gm, '');
}

const sora = opentype.loadSync(path.join(kitRoot, 'sources', 'fonts', 'Sora-Variable.ttf'));
const jetBrains = opentype.loadSync(path.join(kitRoot, 'sources', 'fonts', 'JetBrainsMono-Variable.ttf'));

function textWidth(font, text, fontSize, tracking = 0) {
	const scale = fontSize / font.unitsPerEm;
	const glyphs = font.stringToGlyphs(text);
	let width = 0;
	for (let index = 0; index < glyphs.length; index++) {
		const glyph = glyphs[index];
		width += (glyph.advanceWidth || font.unitsPerEm) * scale;
		if (index < glyphs.length - 1) {
			width += font.getKerningValue(glyph, glyphs[index + 1]) * scale + tracking;
		}
	}
	return width;
}

function vectorText(font, text, x, baseline, fontSize, fill, options = {}) {
	const tracking = options.tracking || 0;
	const totalWidth = textWidth(font, text, fontSize, tracking);
	let cursor = options.anchor === 'middle' ? x - totalWidth / 2 : options.anchor === 'end' ? x - totalWidth : x;
	const glyphs = font.stringToGlyphs(text);
	const scale = fontSize / font.unitsPerEm;
	let pathData = '';
	for (let index = 0; index < glyphs.length; index++) {
		const glyph = glyphs[index];
		pathData += glyph.getPath(cursor, baseline, fontSize).toPathData(2);
		cursor += (glyph.advanceWidth || font.unitsPerEm) * scale;
		if (index < glyphs.length - 1) {
			cursor += font.getKerningValue(glyph, glyphs[index + 1]) * scale + tracking;
		}
	}
	return `<path d="${pathData}" fill="${fill}"/>`;
}

function gradients(prefix) {
	return `
    <linearGradient id="${prefix}-frame" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.accentPurple}"/>
      <stop offset="0.32" stop-color="${palette.primaryBlue}"/>
      <stop offset="1" stop-color="${palette.accentTeal}"/>
    </linearGradient>
    <linearGradient id="${prefix}-letter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${palette.textLight}"/>
      <stop offset="1" stop-color="${palette.textLight}" stop-opacity="0.72"/>
    </linearGradient>
    <linearGradient id="${prefix}-word" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${palette.primaryBlue}"/>
      <stop offset="1" stop-color="${palette.accentTeal}"/>
    </linearGradient>
  `;
}

function circuitArtwork(color = palette.primaryBlue, tiny = false) {
	if (tiny) {
		return '';
	}
	return `
    <g fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M106 164H66L50 148H30"/>
      <path d="M106 212H50"/>
      <path d="M106 260H28"/>
      <path d="M106 308H60L44 324H24"/>
      <path d="M406 164H446L462 148H482"/>
      <path d="M406 212H462"/>
      <path d="M406 260H484"/>
      <path d="M406 308H452L468 324H488"/>
    </g>
    <g fill="${palette.darkBackground}" stroke="${color}" stroke-width="8">
      <circle cx="28" cy="148" r="9"/><circle cx="50" cy="212" r="9"/>
      <circle cx="28" cy="260" r="9"/><circle cx="22" cy="324" r="9"/>
      <circle cx="484" cy="148" r="9"/><circle cx="462" cy="212" r="9"/>
      <circle cx="484" cy="260" r="9"/><circle cx="490" cy="324" r="9"/>
    </g>`;
}

function markFragment(prefix, options = {}) {
	const mode = options.mode || 'full';
	const tiny = Boolean(options.tiny);
	const circuits = Boolean(options.circuits);
	const onLight = mode === 'light-background';
	const monochrome = mode.startsWith('monochrome');
	const monoColor = mode === 'monochrome-dark' ? palette.surface : palette.textLight;
	const frameStroke = monochrome ? monoColor : `url(#${prefix}-frame)`;
	const letterFill = monochrome ? monoColor : onLight ? palette.surface : `url(#${prefix}-letter)`;
	const innerFill = monochrome || onLight ? 'none' : palette.darkBackground;
	const circuitColor = monochrome ? monoColor : onLight ? palette.primaryBlue : palette.primaryBlue;
	const strokeWidth = tiny ? 54 : 40;
	const details = circuits ? circuitArtwork(circuitColor, tiny) : '';
	return {
		defs: gradients(prefix),
		body: `
      ${details}
      <path d="M188 446V392L90 336V144L256 48L422 144V336L324 392V446" fill="none" stroke="${frameStroke}" stroke-width="${strokeWidth}" stroke-linejoin="miter"/>
      ${innerFill === 'none' ? '' : `<path d="M256 104L366 168V304L256 368L146 304V168Z" fill="${innerFill}"/>`}
      <path d="M256 120L358 348H304L282 296H230L208 348H154ZM256 204L233 260H279Z" fill="${letterFill}" fill-rule="evenodd"/>`
	};
}

function markSvg(mode = 'full', circuits = true, tiny = false) {
	const prefix = `mark-${mode.replaceAll(/[^a-z]/g, '')}-${tiny ? 'tiny' : 'full'}-${circuits ? 'circuit' : 'plain'}`;
	const mark = markFragment(prefix, { mode, circuits, tiny });
	return svgDocument(512, 512, `AryaAI ${mode} mark`, mark.body, mark.defs);
}

function wordmarkPaths(prefix, x, baseline, size, options = {}) {
	const monochrome = options.monochrome;
	const onLight = options.onLight;
	const aryColor = monochrome || (onLight ? palette.surface : palette.textLight);
	const aiColor = monochrome || `url(#${prefix}-word)`;
	const aryWidth = textWidth(sora, 'Arya', size, 0);
	const aiWidth = textWidth(sora, 'AI', size, 0);
	const totalWidth = aryWidth + aiWidth;
	const start = options.anchor === 'middle' ? x - totalWidth / 2 : x;
	return `
    ${vectorText(sora, 'Arya', start, baseline, size, aryColor)}
    ${vectorText(sora, 'AI', start + aryWidth, baseline, size, aiColor)}`;
}

function primaryLockupSvg() {
	const prefix = 'primary-lockup';
	return svgDocument(840, 900, 'AryaAI primary logo', `
		<rect x="170" y="38" width="500" height="500" rx="118" fill="${palette.darkBackground}" stroke="url(#${prefix}-frame)" stroke-width="10"/>
		${mascotImageElement('idle', 170, 38, 500, 500)}
		${wordmarkPaths(prefix, 420, 690, 132, { anchor: 'middle' })}
		${vectorText(jetBrains, 'YOUR AI ENGINEERING PAL', 420, 752, 25, palette.accentTeal, { anchor: 'middle', tracking: 5 })}
	`, gradients(prefix));
}

function stackedLockupSvg() {
	const prefix = 'stacked-lockup';
	return svgDocument(760, 860, 'AryaAI stacked logo', `
		<rect x="145" y="32" width="470" height="470" rx="108" fill="${palette.darkBackground}" stroke="url(#${prefix}-frame)" stroke-width="9"/>
		${mascotImageElement('idle', 145, 32, 470, 470)}
		${wordmarkPaths(prefix, 380, 650, 118, { anchor: 'middle' })}
		${vectorText(jetBrains, 'YOUR AI ENGINEERING PAL', 380, 708, 23, palette.accentTeal, { anchor: 'middle', tracking: 4 })}
	`, gradients(prefix));
}

function horizontalLockupSvg(options = {}) {
	const mode = options.mode || 'full';
	const prefix = `horizontal-${mode}`;
	const monochrome = mode === 'monochrome-light' ? palette.textLight : mode === 'monochrome-dark' ? palette.surface : undefined;
	const onLight = mode === 'light-background';
	const taglineColor = monochrome || (onLight ? palette.surface : palette.primaryBlue);
	const identity = monochrome
		? (() => { const mark = markFragment(prefix, { mode, circuits: false, tiny: true }); return { body: `<g transform="translate(44 18) scale(.71)">${mark.body}</g>`, defs: mark.defs }; })()
		: { body: `<rect x="42" y="26" width="340" height="340" rx="78" fill="${onLight ? palette.textLight : palette.darkBackground}" stroke="url(#${prefix}-frame)" stroke-width="7"/>${mascotImageElement('idle', 42, 26, 340, 340)}`, defs: gradients(prefix) };
	return svgDocument(1400, 400, `AryaAI horizontal ${mode} logo`, `
		${identity.body}
		${wordmarkPaths(prefix, 420, 222, 150, { monochrome, onLight })}
		${vectorText(jetBrains, 'YOUR AI ENGINEERING PAL', 424, 292, 26, taglineColor, { tracking: 5 })}
	`, identity.defs);
}

function headerWordmarkSvg() {
	const prefix = 'header-wordmark';
	return svgDocument(1200, 160, 'AryaAI responsive header wordmark', `
		<rect x="12" y="8" width="144" height="144" rx="34" fill="${palette.darkBackground}" stroke="url(#${prefix}-frame)" stroke-width="4"/>
		${mascotImageElement('idle', 12, 8, 144, 144)}
		${wordmarkPaths(prefix, 180, 102, 92)}
		${vectorText(jetBrains, 'YOUR AI ENGINEERING PAL', 184, 137, 19, palette.accentTeal, { tracking: 3 })}
	`, gradients(prefix));
}

function headerMarkSvg() {
	const prefix = 'header-mark';
	return svgDocument(160, 160, 'AryaAI compact mascot mark', `<rect x="8" y="8" width="144" height="144" rx="34" fill="${palette.darkBackground}" stroke="url(#${prefix}-frame)" stroke-width="4"/>${mascotImageElement('idle', 8, 8, 144, 144)}`, gradients(prefix));
}

function appIconSvg(variant = 'primary') {
	const prefix = `app-${variant}`;
	const isLight = variant === 'light';
	const isMono = variant === 'monochrome';
	const isSmall = variant === 'small';
	const mode = isLight ? 'light-background' : isMono ? 'monochrome-light' : 'full';
	const mark = markFragment(prefix, { mode, circuits: !isSmall && !isMono, tiny: isSmall });
	const background = isLight ? palette.textLight : variant === 'dark' ? palette.surface : palette.darkBackground;
	const border = isMono ? palette.textLight : palette.primaryBlue;
	const scale = isSmall ? 0.72 : 0.78;
	const offset = isSmall ? 72 : 56;
	const identity = isMono || isSmall
		? `<g transform="translate(${offset} ${offset}) scale(${scale})">${mark.body}</g>`
		: mascotImageElement('idle', 30, 30, 452, 452);
	return svgDocument(512, 512, `AryaAI ${variant} software icon`, `
		<rect x="22" y="22" width="468" height="468" rx="106" fill="${background}" stroke="${border}" stroke-width="6"/>
		${identity}
	`, mark.defs);
}

function projectGlyph(prefix, tiny = false) {
	const mark = markFragment(prefix, { mode: 'full', circuits: false, tiny: true });
	return { defs: mark.defs, body: `<g transform="translate(166 174) scale(.35)">${mark.body}</g>` };
}

function plcGlyph(tiny = false) {
	const stroke = tiny ? 16 : 11;
	return { defs: '', body: `
    <rect x="146" y="214" width="220" height="108" rx="22" fill="${palette.accentTeal}" stroke="${palette.textLight}" stroke-width="${tiny ? 8 : 5}"/>
    <g fill="none" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M190 286V244H214Q232 244 232 259Q232 274 214 274H190"/>
      <path d="M258 244V286H294"/>
      <path d="M342 252Q334 243 319 243Q299 243 299 265Q299 287 319 287Q334 287 342 278"/>
    </g>` };
}

function hmiGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	return { defs: '', body: `
    <rect x="145" y="176" width="222" height="150" rx="12" fill="${palette.darkBackground}" stroke="${palette.textLight}" stroke-width="${stroke}"/>
    <path d="M178 286L222 248L256 266L318 208L340 226" fill="none" stroke="${palette.primaryBlue}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M256 326V366M205 366H307" fill="none" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linecap="round"/>` };
}

function libraryGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	return { defs: '', body: `
    <ellipse cx="256" cy="202" rx="86" ry="34" fill="${palette.surface}" stroke="${palette.textLight}" stroke-width="${stroke}"/>
    <path d="M170 202V310Q170 344 256 344Q342 344 342 310V202" fill="${palette.surface}" stroke="${palette.textLight}" stroke-width="${stroke}"/>
    <path d="M170 254Q170 288 256 288Q342 288 342 254M170 306Q170 340 256 340Q342 340 342 306" fill="none" stroke="${palette.primaryBlue}" stroke-width="${stroke}"/>` };
}

function templateGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	return { defs: '', body: `
    <path d="M184 164H292L340 212V354H184Z" fill="${palette.surface}" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linejoin="round"/>
    <path d="M292 164V212H340" fill="none" stroke="${palette.primaryBlue}" stroke-width="${stroke}" stroke-linejoin="round"/>` };
}

function scriptGlyph(tiny = false) {
	const stroke = tiny ? 19 : 14;
	return { defs: '', body: `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${stroke}">
      <path d="M222 198L158 256L222 314" stroke="${palette.primaryBlue}"/>
      <path d="M290 198L354 256L290 314" stroke="${palette.accentTeal}"/>
      <path d="M276 172L236 340" stroke="${palette.textLight}"/>
    </g>` };
}

function alarmGlyph(tiny = false) {
	const stroke = tiny ? 18 : 13;
	return { defs: '', body: `
    <path d="M188 314H324L304 286V236Q304 196 256 190Q208 196 208 236V286Z" fill="none" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linejoin="round"/>
    <path d="M236 332Q256 354 276 332" fill="none" stroke="${palette.primaryBlue}" stroke-width="${stroke}" stroke-linecap="round"/>` };
}

function reportGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	return { defs: '', body: `
    <g fill="none" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M172 338H344"/>
      <path d="M196 320V270H226V320"/>
      <path d="M242 320V222H272V320"/>
      <path d="M288 320V186H318V320"/>
    </g>
    <path d="M188 240L238 206L276 218L326 168" fill="none" stroke="${palette.primaryBlue}" stroke-width="${stroke}" stroke-linecap="round"/>` };
}

function configGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	const spokes = Array.from({ length: 8 }, (_, index) => {
		const angle = index * Math.PI / 4;
		const x1 = 256 + Math.cos(angle) * 67;
		const y1 = 256 + Math.sin(angle) * 67;
		const x2 = 256 + Math.cos(angle) * 92;
		const y2 = 256 + Math.sin(angle) * 92;
		return `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}"/>`;
	}).join('');
	return { defs: '', body: `
    <g fill="none" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linecap="round">
      <circle cx="256" cy="256" r="66"/><circle cx="256" cy="256" r="25"/>${spokes}
    </g>` };
}

function tagGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	return { defs: '', body: `
    <path d="M164 222L238 162H340V264L266 338L164 236Z" fill="none" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linejoin="round"/>
    <circle cx="302" cy="202" r="18" fill="none" stroke="${palette.accentTeal}" stroke-width="${stroke}"/>
    <path d="M214 266L262 218M238 290L286 242" stroke="${palette.primaryBlue}" stroke-width="${stroke}" stroke-linecap="round"/>` };
}

function functionGlyph(tiny = false) {
	const stroke = tiny ? 17 : 12;
	return { defs: '', body: `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${stroke}">
      <path d="M214 174Q178 174 184 218L202 338M172 246H228" stroke="${palette.textLight}"/>
      <path d="M258 214Q238 256 258 298M326 214Q346 256 326 298" stroke="${palette.textLight}"/>
      <path d="M278 230L310 282M310 230L278 282" stroke="${palette.primaryBlue}"/>
    </g>` };
}

function glyphFor(kind, prefix, tiny = false) {
	switch (kind) {
		case 'project': return projectGlyph(prefix, tiny);
		case 'plc-program': return plcGlyph(tiny);
		case 'hmi-scada': return hmiGlyph(tiny);
		case 'library': return libraryGlyph(tiny);
		case 'template': return templateGlyph(tiny);
		case 'script':
		case 'logic': return scriptGlyph(tiny);
		case 'config': return configGlyph(tiny);
		case 'tag': return tagGlyph(tiny);
		case 'function': return functionGlyph(tiny);
		case 'alarm': return alarmGlyph(tiny);
		case 'report': return reportGlyph(tiny);
		default: throw new Error(`Unknown glyph: ${kind}`);
	}
}

function folderIconSvg(kind, tiny = false) {
	const prefix = `folder-${kind}-${tiny ? 'tiny' : 'full'}`;
	const glyph = glyphFor(kind, prefix, tiny);
	const stroke = tiny ? 14 : 8;
	const body = `
    <path d="M62 148Q62 116 94 116H196L230 150H418Q450 150 450 182V394Q450 426 418 426H94Q62 426 62 394Z" fill="${palette.surface}" stroke="${palette.textLight}" stroke-opacity="0.45" stroke-width="${stroke}" stroke-linejoin="round"/>
    <path d="M72 176H440" stroke="${palette.primaryBlue}" stroke-opacity="0.42" stroke-width="${stroke}"/>
    ${glyph.body}`;
	return svgDocument(512, 512, `AryaAI ${kind} desktop icon`, body, glyph.defs);
}

function documentIconSvg(kind, tiny = false) {
	const prefix = `document-${kind}-${tiny ? 'tiny' : 'full'}`;
	const glyph = glyphFor(kind, prefix, tiny);
	const stroke = tiny ? 15 : 10;
	const fold = tiny ? 66 : 82;
	return svgDocument(512, 512, `AryaAI ${kind} file icon`, `
    <path d="M122 58H310L390 138V454H122Z" fill="${palette.surface}" stroke="${palette.textLight}" stroke-width="${stroke}" stroke-linejoin="round"/>
    <path d="M310 58V138H390" fill="none" stroke="${palette.primaryBlue}" stroke-width="${stroke}" stroke-linejoin="round"/>
    <g transform="translate(0 ${fold}) scale(1 .78)">${glyph.body}</g>
  `, glyph.defs);
}

function utilityGlyph(kind, color, frame = 0) {
	const stroke = 10;
	switch (kind) {
		case 'notification':
			return `<path d="M38 78H90L82 68V48Q82 27 64 24Q46 27 46 48V68ZM55 88Q64 98 73 88" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="round" stroke-linecap="round"/>`;
		case 'update':
			return `<path d="M92 44A35 35 0 1 0 96 76" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"/><path d="M88 24L94 46L72 42" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="round"/>`;
		case 'sync':
			return `<path d="M24 48Q38 24 68 28H94M94 28L82 16M94 28L82 40M104 80Q90 104 60 100H34M34 100L46 88M34 100L46 112" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
		case 'settings': {
			const spokes = Array.from({ length: 8 }, (_, index) => {
				const angle = index * Math.PI / 4;
				const x1 = 64 + Math.cos(angle) * 35;
				const y1 = 64 + Math.sin(angle) * 35;
				const x2 = 64 + Math.cos(angle) * 51;
				const y2 = 64 + Math.sin(angle) * 51;
				return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
			}).join('');
			return `<g fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"><circle cx="64" cy="64" r="34"/><circle cx="64" cy="64" r="13"/>${spokes}</g>`;
		}
		case 'exit':
			return `<path d="M30 30L98 98M98 30L30 98" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"/>`;
		case 'busy':
			return `<g transform="rotate(${frame * 30} 64 64)"><circle cx="64" cy="64" r="40" fill="none" stroke="${color}" stroke-opacity="0.24" stroke-width="13"/><path d="M64 24A40 40 0 0 1 101 49" fill="none" stroke="${palette.accentTeal}" stroke-width="13" stroke-linecap="round"/></g>`;
		case 'error':
			return `<circle cx="64" cy="64" r="40" fill="none" stroke="${palette.error}" stroke-width="13"/><circle cx="64" cy="64" r="22" fill="${palette.error}" fill-opacity="0.22"/>`;
		default:
			throw new Error(`Unknown utility glyph: ${kind}`);
	}
}

function trayIconSvg(kind, theme = 'dark', frame = 0) {
	const foreground = theme === 'dark' ? palette.textLight : palette.surface;
	if (kind === 'active' || kind === 'idle') {
		const prefix = `tray-${kind}-${theme}`;
		const mode = kind === 'active' ? 'full' : theme === 'dark' ? 'monochrome-light' : 'monochrome-dark';
		const mark = markFragment(prefix, { mode, circuits: false, tiny: true });
		return svgDocument(128, 128, `AryaAI tray ${kind} ${theme}`, `<g transform="translate(7 7) scale(.223)">${mark.body}</g>`, mark.defs);
	}
	return svgDocument(128, 128, `AryaAI ${kind} ${theme} system icon`, utilityGlyph(kind, foreground, frame));
}

async function writeSvg(relativePath, content, family, name, variant) {
	fs.writeFileSync(ensureParent(relativePath), content, 'utf8');
	const match = content.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
	const dimensions = match ? { width: Number(match[1]), height: Number(match[2]) } : undefined;
	registerAsset(relativePath, family, name, variant, 'svg', dimensions);
}

async function renderPng(content, relativePath, width, family, name, variant) {
	const buffer = await sharp(Buffer.from(content)).resize({ width, fit: 'contain' }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
	fs.writeFileSync(ensureParent(relativePath), buffer);
	const metadata = await sharp(buffer).metadata();
	registerAsset(relativePath, family, name, variant, 'png', { width: metadata.width, height: metadata.height });
	return buffer;
}

async function iconFrame(content, size, dib = false) {
	if (!dib) {
		return sharp(Buffer.from(content)).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toBuffer();
	}
	const { data } = await sharp(Buffer.from(content)).resize(size, size, { fit: 'contain' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const rowBytes = size * 4;
	const maskRowBytes = Math.ceil(size / 32) * 4;
	const maskBytes = maskRowBytes * size;
	const dibBuffer = Buffer.alloc(40 + rowBytes * size + maskBytes);
	dibBuffer.writeUInt32LE(40, 0);
	dibBuffer.writeInt32LE(size, 4);
	dibBuffer.writeInt32LE(size * 2, 8);
	dibBuffer.writeUInt16LE(1, 12);
	dibBuffer.writeUInt16LE(32, 14);
	dibBuffer.writeUInt32LE(0, 16);
	dibBuffer.writeUInt32LE(rowBytes * size + maskBytes, 20);
	for (let y = 0; y < size; y++) {
		const sourceY = size - 1 - y;
		for (let x = 0; x < size; x++) {
			const sourceOffset = (sourceY * size + x) * 4;
			const targetOffset = 40 + y * rowBytes + x * 4;
			dibBuffer[targetOffset] = data[sourceOffset + 2];
			dibBuffer[targetOffset + 1] = data[sourceOffset + 1];
			dibBuffer[targetOffset + 2] = data[sourceOffset];
			dibBuffer[targetOffset + 3] = data[sourceOffset + 3];
		}
	}
	return dibBuffer;
}

async function writeIco(relativePath, contentForSize, sizes, family, name, variant) {
	const frames = [];
	for (const size of sizes) {
		const content = typeof contentForSize === 'function' ? contentForSize(size) : contentForSize;
		frames.push(await iconFrame(content, size, size < 128));
	}
	const directorySize = 6 + sizes.length * 16;
	const totalSize = directorySize + frames.reduce((sum, frame) => sum + frame.length, 0);
	const output = Buffer.alloc(totalSize);
	output.writeUInt16LE(0, 0);
	output.writeUInt16LE(1, 2);
	output.writeUInt16LE(sizes.length, 4);
	let offset = directorySize;
	for (let index = 0; index < sizes.length; index++) {
		const size = sizes[index];
		const frame = frames[index];
		const base = 6 + index * 16;
		output[base] = size >= 256 ? 0 : size;
		output[base + 1] = size >= 256 ? 0 : size;
		output[base + 2] = 0;
		output[base + 3] = 0;
		output.writeUInt16LE(1, base + 4);
		output.writeUInt16LE(32, base + 6);
		output.writeUInt32LE(frame.length, base + 8);
		output.writeUInt32LE(offset, base + 12);
		frame.copy(output, offset);
		offset += frame.length;
	}
	fs.writeFileSync(ensureParent(relativePath), output);
	registerAsset(relativePath, family, name, variant, 'ico', undefined, { sizes });
}

async function writeIcns(relativePath, contentForSize, family, name, variant) {
	const chunks = [
		['icp4', 16], ['ic11', 32], ['icp5', 32], ['ic12', 64], ['icp6', 64],
		['ic07', 128], ['ic13', 256], ['ic08', 256], ['ic14', 512], ['ic09', 512], ['ic10', 1024]
	];
	const parts = [];
	for (const [type, size] of chunks) {
		const content = typeof contentForSize === 'function' ? contentForSize(size) : contentForSize;
		const png = await iconFrame(content, size, false);
		const header = Buffer.alloc(8);
		header.write(type, 0, 4, 'ascii');
		header.writeUInt32BE(png.length + 8, 4);
		parts.push(header, png);
	}
	const body = Buffer.concat(parts);
	const header = Buffer.alloc(8);
	header.write('icns', 0, 4, 'ascii');
	header.writeUInt32BE(body.length + 8, 4);
	fs.writeFileSync(ensureParent(relativePath), Buffer.concat([header, body]));
	registerAsset(relativePath, family, name, variant, 'icns', undefined, { sizes: [16, 32, 64, 128, 256, 512, 1024] });
}

function embeddedSvg(relativePath, x, y, width, height) {
	const svg = fs.readFileSync(path.join(kitRoot, relativePath), 'utf8');
	const data = Buffer.from(svg).toString('base64');
	return `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${data}"/>`;
}

function embeddedPng(relativePath, x, y, width, height) {
	const data = fs.readFileSync(path.join(kitRoot, relativePath)).toString('base64');
	return `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${data}"/>`;
}

function panel(x, y, width, height, title, index) {
	return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${palette.darkBackground}" stroke="${palette.textLight}" stroke-opacity="0.18" stroke-width="2"/>
    ${vectorText(jetBrains, `${String(index).padStart(2, '0')}. ${title.toUpperCase()}`, x + 24, y + 42, 22, palette.primaryBlue, { tracking: 1.8 })}`;
}

function contactSheetSvg() {
	const label = (text, x, y, anchor = 'middle') => vectorText(jetBrains, text.toUpperCase(), x, y, 16, palette.textLight, { anchor, tracking: 1 });
	const compactLabel = (text, x, y) => vectorText(jetBrains, text.toUpperCase(), x, y, 12, palette.textLight, { anchor: 'middle', tracking: 0.2 });
	let body = `<rect width="1920" height="1400" fill="${palette.darkBackground}"/>`;
	body += vectorText(sora, 'ARYAAI', 42, 58, 34, palette.primaryBlue, { tracking: 1 });
	body += vectorText(jetBrains, 'PRODUCTION BRANDING KIT', 190, 58, 23, palette.textLight, { tracking: 2 });
	body += panel(36, 88, 900, 430, 'Logo Suite', 1);
	body += embeddedSvg('logos/primary-lockup.svg', 60, 145, 300, 320);
	body += embeddedSvg('logos/horizontal-lockup.svg', 360, 150, 540, 165);
	body += embeddedSvg('logos/stacked-lockup.svg', 410, 305, 210, 180);
	body += embeddedSvg('logos/single-color-light.svg', 620, 325, 280, 120);
	body += label('Primary', 210, 490) + label('Horizontal / stacked / mono', 635, 490);
	body += panel(960, 88, 924, 430, 'App and Software Icons', 2);
	const appVariants = ['primary', 'dark', 'light', 'monochrome', 'small'];
	appVariants.forEach((variant, index) => {
		const x = 994 + index * 174;
		body += embeddedSvg(`app-icons/svg/${variant}.svg`, x, 168, 142, 142);
		body += label(variant, x + 71, 344);
	});
	body += embeddedSvg('app-icons/web/favicon.svg', 1070, 375, 86, 86);
	body += embeddedSvg('logos/standalone-mark.svg', 1240, 365, 110, 110);
	body += label('Favicon', 1113, 488) + label('Standalone mark', 1295, 488);
	body += panel(36, 540, 900, 335, 'Desktop / Shortcut Icons', 3);
	const desktopKinds = ['project', 'plc-program', 'hmi-scada', 'library', 'template', 'script'];
	desktopKinds.forEach((kind, index) => {
		const x = 66 + index * 143;
		body += embeddedSvg(`desktop-icons/${kind}/icon.svg`, x, 600, 118, 118);
		body += label(kind.replaceAll('-', ' '), x + 59, 750);
	});
	body += panel(960, 540, 924, 335, 'Tray / System Icons', 4);
	const trayKinds = ['active', 'idle', 'busy', 'error', 'notification', 'update', 'sync', 'settings', 'exit'];
	trayKinds.forEach((kind, index) => {
		const x = 992 + index * 96;
		body += embeddedSvg(`tray/svg/dark/${kind}.svg`, x, 620, 70, 70);
		body += compactLabel(kind, x + 35, 724);
	});
	body += label('Dark and light themes · 12-frame busy animation', 1422, 824);
	body += panel(36, 897, 900, 360, 'File Type / Document Icons', 5);
	const fileKinds = ['logic', 'config', 'tag', 'function', 'alarm', 'report'];
	fileKinds.forEach((kind, index) => {
		const x = 66 + index * 143;
		body += embeddedSvg(`file-icons/${kind}/icon.svg`, x, 958, 118, 146);
		body += label(kind, x + 59, 1140);
	});
	body += panel(960, 897, 924, 360, 'Header, Palette and Type', 6);
	body += `<rect x="992" y="958" width="852" height="116" rx="14" fill="${palette.surface}" stroke="${palette.textLight}" stroke-opacity="0.2"/>`;
	body += embeddedSvg('header/header-wordmark.svg', 1018, 976, 510, 68);
	body += embeddedSvg('header/header-mark.svg', 1580, 970, 82, 82);
	const swatches = [palette.primaryBlue, palette.accentTeal, palette.accentPurple, palette.darkBackground, palette.surface, palette.textLight];
	swatches.forEach((color, index) => {
		const x = 992 + index * 142;
		body += `<rect x="${x}" y="1110" width="118" height="58" rx="10" fill="${color}" stroke="${palette.textLight}" stroke-opacity="0.22"/>`;
		body += label(color.replace('#', ''), x + 59, 1198);
	});
	body += vectorText(sora, 'Sora', 1010, 1234, 24, palette.textLight);
	body += vectorText(jetBrains, 'JetBrains Mono', 1150, 1234, 20, palette.textLight);
	body += vectorText(jetBrains, 'VECTOR MASTERS · SVG · PNG · ICO · ICNS', 960, 1353, 18, palette.textLight, { anchor: 'middle', tracking: 2 });
	return svgDocument(1920, 1400, 'AryaAI production branding kit contact sheet', body);
}

function companionContactSheetSvg() {
	const cellWidth = 444;
	const cellHeight = 376;
	const gap = 20;
	const startX = 42;
	const startY = 132;
	let body = `<rect width="1920" height="1400" fill="${palette.darkBackground}"/>`;
	body += vectorText(sora, 'ARYAAI', 42, 58, 34, palette.primaryBlue, { tracking: 1 });
	body += vectorText(jetBrains, 'YOUR AI ENGINEERING PAL · COMPANION STATES', 190, 58, 23, palette.textLight, { tracking: 2 });
	body += vectorText(jetBrains, 'STATIC PNG · ANIMATED WEBP / APNG · REDUCED MOTION · 4×3 SPRITE FALLBACK', 42, 98, 16, palette.accentTeal, { tracking: 1.4 });
	companionStates.forEach((state, index) => {
		const column = index % 4;
		const row = Math.floor(index / 4);
		const x = startX + column * (cellWidth + gap);
		const y = startY + row * (cellHeight + gap);
		body += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="22" fill="${palette.surface}" stroke="${state.id === 'warning' ? palette.warning : state.id === 'error' ? palette.error : palette.primaryBlue}" stroke-opacity="0.48" stroke-width="2"/>`;
		body += embeddedPng(`companion/${state.id}/static/256.png`, x + 86, y + 20, 272, 272);
		body += vectorText(sora, state.label, x + cellWidth / 2, y + 320, 24, palette.textLight, { anchor: 'middle' });
		body += vectorText(jetBrains, state.cue.toUpperCase(), x + cellWidth / 2, y + 350, 13, palette.accentTeal, { anchor: 'middle', tracking: 1 });
	});
	body += vectorText(jetBrains, 'CONSISTENT IDENTITY · READABLE GLASSES · TRUE ALPHA · RESPECT REDUCED-MOTION SETTINGS', 960, 1362, 17, palette.textLight, { anchor: 'middle', tracking: 2 });
	return svgDocument(1920, 1400, 'AryaAI companion expression contact sheet', body);
}

function companionSizeQaSvg() {
	const sizes = [128, 64, 48, 32, 24, 16];
	const cellWidth = 142;
	const rowHeight = 188;
	const startX = 162;
	const startY = 150;
	let body = `<rect width="1920" height="1400" fill="${palette.darkBackground}"/>`;
	body += vectorText(sora, 'ARYAAI', 42, 58, 34, palette.primaryBlue, { tracking: 1 });
	body += vectorText(jetBrains, 'COMPANION SMALL-SIZE QA · DISPLAYED AT NATIVE PIXEL SIZE', 190, 58, 22, palette.textLight, { tracking: 1.7 });
	companionStates.forEach((state, index) => {
		body += vectorText(jetBrains, state.label.toUpperCase(), startX + index * cellWidth + cellWidth / 2, 116, 10, palette.accentTeal, { anchor: 'middle', tracking: 0.2 });
	});
	sizes.forEach((size, row) => {
		const y = startY + row * rowHeight;
		body += vectorText(jetBrains, `${size} PX`, 116, y + 88, 18, palette.primaryBlue, { anchor: 'middle', tracking: 1 });
		companionStates.forEach((state, column) => {
			const x = startX + column * cellWidth;
			body += `<rect x="${x + 4}" y="${y}" width="${cellWidth - 8}" height="${rowHeight - 18}" rx="14" fill="${palette.surface}" stroke="${palette.textLight}" stroke-opacity="0.12"/>`;
			body += embeddedPng(`companion/${state.id}/static/${size}.png`, x + (cellWidth - size) / 2, y + (rowHeight - 18 - size) / 2, size, size);
		});
	});
	body += vectorText(jetBrains, 'MASCOT PRIMARY AT 32 PX AND ABOVE · USE THE SECONDARY A FOR TINY SYSTEM AND MONOCHROME SURFACES', 960, 1352, 16, palette.textLight, { anchor: 'middle', tracking: 1.6 });
	return svgDocument(1920, 1400, 'AryaAI companion small-size quality assurance sheet', body);
}

function splashSvg() {
	const prefix = 'splash';
	return svgDocument(1600, 900, 'AryaAI splash artwork', `
		<rect width="1600" height="900" fill="${palette.darkBackground}"/>
		<circle cx="1260" cy="440" r="410" fill="${palette.primaryBlue}" fill-opacity="0.12"/>
		<circle cx="1310" cy="390" r="300" fill="${palette.accentPurple}" fill-opacity="0.10"/>
		<path d="M0 760Q360 650 710 760T1600 710V900H0Z" fill="${palette.primaryBlue}" fill-opacity="0.12"/>
		${wordmarkPaths(prefix, 120, 390, 178)}
		${vectorText(jetBrains, 'YOUR AI ENGINEERING PAL', 126, 470, 31, palette.accentTeal, { tracking: 5 })}
		${vectorText(jetBrains, 'CODE · AUTOMATE · VISUALIZE · DEPLOY', 126, 535, 22, palette.textLight, { tracking: 3 })}
		<rect x="995" y="125" width="510" height="650" rx="128" fill="${palette.surface}" stroke="url(#${prefix}-frame)" stroke-width="10"/>
		${mascotImageElement('greeting', 935, 125, 630, 650)}
	`, gradients(prefix));
}

async function generateLogoSuite() {
	const logoSvgs = [
		['logos/primary-lockup.svg', primaryLockupSvg(), 'primary-lockup', 'full-color'],
		['logos/horizontal-lockup.svg', horizontalLockupSvg(), 'horizontal-lockup', 'full-color'],
		['logos/stacked-lockup.svg', stackedLockupSvg(), 'stacked-lockup', 'full-color'],
		['logos/single-color-light.svg', horizontalLockupSvg({ mode: 'monochrome-light' }), 'horizontal-lockup', 'monochrome-light'],
		['logos/single-color-dark.svg', horizontalLockupSvg({ mode: 'monochrome-dark' }), 'horizontal-lockup', 'monochrome-dark'],
		['logos/light-background.svg', horizontalLockupSvg({ mode: 'light-background' }), 'horizontal-lockup', 'light-background'],
		['logos/dark-background.svg', horizontalLockupSvg(), 'horizontal-lockup', 'dark-background'],
		['logos/standalone-mark.svg', markSvg('full', true), 'standalone-mark', 'full-color'],
		['logos/mark-full-color.svg', markSvg('full', false), 'mark', 'full-color'],
		['logos/mark-light-background.svg', markSvg('light-background', false), 'mark', 'light-background'],
		['logos/mark-monochrome-light.svg', markSvg('monochrome-light', false), 'mark', 'monochrome-light'],
		['logos/mark-monochrome-dark.svg', markSvg('monochrome-dark', false), 'mark', 'monochrome-dark']
	];
	for (const [relative, content, name, variant] of logoSvgs) {
		await writeSvg(relative, content, 'logo', name, variant);
		const width = name === 'horizontal-lockup' ? 1400 : name.includes('mark') ? 512 : 840;
		await renderPng(content, relative.replace('.svg', `-${width}.png`), width, 'logo', name, `${variant}-1x`);
		await renderPng(content, relative.replace('.svg', `-${width * 2}.png`), width * 2, 'logo', name, `${variant}-2x`);
	}

	const headerFull = headerWordmarkSvg();
	const headerCompact = headerMarkSvg();
	await writeSvg('header/header-wordmark.svg', headerFull, 'header', 'responsive-wordmark', 'full');
	await writeSvg('header/header-mark.svg', headerCompact, 'header', 'responsive-wordmark', 'compact');
	await renderPng(headerFull, 'header/header-wordmark-1200.png', 1200, 'header', 'responsive-wordmark', 'full-1x');
	await renderPng(headerFull, 'header/header-wordmark-2400.png', 2400, 'header', 'responsive-wordmark', 'full-2x');
	for (const size of [16, 20, 24, 32, 48, 64, 128]) {
		await renderPng(headerCompact, `header/compact/${size}.png`, size, 'header', 'responsive-wordmark', `compact-${size}`);
	}
}

async function generateAppIcons() {
	const variants = ['primary', 'dark', 'light', 'monochrome', 'small'];
	const sizeSet = [16, 20, 24, 32, 48, 64, 128, 256, 512, 1024];
	const svgByVariant = new Map();
	for (const variant of variants) {
		const content = appIconSvg(variant);
		svgByVariant.set(variant, content);
		await writeSvg(`app-icons/svg/${variant}.svg`, content, 'app-icon', 'software-icon', variant);
		for (const size of sizeSet) {
			const source = size <= 32 ? appIconSvg(variant === 'primary' ? 'small' : variant) : content;
			await renderPng(source, `app-icons/png/${variant}/${size}.png`, size, 'app-icon', 'software-icon', variant);
		}
	}

	const primaryForSize = size => size <= 32 ? svgByVariant.get('small') : svgByVariant.get('primary');
	await writeIco('app-icons/windows/aryaai.ico', primaryForSize, [16, 20, 24, 32, 40, 48, 64, 128, 256], 'app-icon', 'software-icon', 'windows');
	await writeIcns('app-icons/macos/AryaAI.icns', primaryForSize, 'app-icon', 'software-icon', 'macos');
	for (const size of [16, 24, 32, 48, 64, 128, 256, 512]) {
		await renderPng(primaryForSize(size), `app-icons/linux/hicolor/${size}x${size}/apps/aryaai.png`, size, 'app-icon', 'software-icon', 'linux');
	}

	const favicon = markSvg('full', false, true);
	await writeSvg('app-icons/web/favicon.svg', favicon, 'favicon', 'favicon', 'vector');
	await writeIco('app-icons/web/favicon.ico', () => favicon, [16, 20, 24, 32, 48, 64, 128, 256], 'favicon', 'favicon', 'windows-web');
	await renderPng(favicon, 'app-icons/web/favicon-16.png', 16, 'favicon', 'favicon', '16');
	await renderPng(favicon, 'app-icons/web/favicon-20.png', 20, 'favicon', 'favicon', '20');
	await renderPng(favicon, 'app-icons/web/favicon-32.png', 32, 'favicon', 'favicon', '32');
	await renderPng(svgByVariant.get('primary'), 'app-icons/web/apple-touch-icon.png', 180, 'favicon', 'apple-touch-icon', '180');
	await renderPng(svgByVariant.get('primary'), 'app-icons/web/pwa-192.png', 192, 'favicon', 'pwa-icon', '192');
	await renderPng(svgByVariant.get('primary'), 'app-icons/web/pwa-512.png', 512, 'favicon', 'pwa-icon', '512');
	await renderPng(svgByVariant.get('primary'), 'app-icons/store/aryaai-store-icon-1024.png', 1024, 'app-icon', 'store-icon', '1024');
}

async function generateSplashAssets() {
	const content = splashSvg();
	await writeSvg('splash/aryaai-splash.svg', content, 'splash', 'startup', 'vector');
	await renderPng(content, 'splash/aryaai-splash-1600x900.png', 1600, 'splash', 'startup', '1600x900');
	await renderPng(content, 'splash/aryaai-splash-3200x1800.png', 3200, 'splash', 'startup', '3200x1800');
}

async function generateDesktopIcons() {
	const kinds = ['project', 'plc-program', 'hmi-scada', 'library', 'template', 'script'];
	const sizes = [16, 20, 24, 32, 48, 64, 128, 256, 512];
	for (const kind of kinds) {
		const full = folderIconSvg(kind, false);
		const small = folderIconSvg(kind, true);
		await writeSvg(`desktop-icons/${kind}/icon.svg`, full, 'desktop-icon', kind, 'full');
		await writeSvg(`desktop-icons/${kind}/icon-small.svg`, small, 'desktop-icon', kind, 'small');
		for (const size of sizes) {
			await renderPng(size <= 32 ? small : full, `desktop-icons/${kind}/png/${size}.png`, size, 'desktop-icon', kind, size <= 32 ? 'small' : 'full');
		}
		const forSize = size => size <= 32 ? small : full;
		await writeIco(`desktop-icons/${kind}/${kind}.ico`, forSize, [16, 20, 24, 32, 48, 64, 128, 256], 'desktop-icon', kind, 'windows');
		await writeIcns(`desktop-icons/${kind}/${kind}.icns`, forSize, 'desktop-icon', kind, 'macos');
	}
}

async function generateTrayIcons() {
	const themes = ['dark', 'light'];
	const kinds = ['active', 'idle', 'busy', 'error', 'notification', 'update', 'sync', 'settings', 'exit'];
	const sizes = [16, 20, 24, 32, 48, 64];
	for (const theme of themes) {
		for (const kind of kinds) {
			const content = trayIconSvg(kind, theme, 0);
			await writeSvg(`tray/svg/${theme}/${kind}.svg`, content, 'tray-icon', kind, theme);
			for (const size of sizes) {
				await renderPng(content, `tray/png/${theme}/${kind}/${size}.png`, size, 'tray-icon', kind, `${theme}-${size}`);
			}
		}
		for (let frame = 0; frame < 12; frame++) {
			for (const size of [16, 20, 24, 32]) {
				const content = trayIconSvg('busy', theme, frame);
				await renderPng(content, `tray/png/${theme}/busy-frames/${size}/frame-${String(frame).padStart(2, '0')}.png`, size, 'tray-icon', 'busy-frame', `${theme}-${size}-${frame}`);
			}
		}
	}
}

async function generateFileIcons() {
	const kinds = ['logic', 'config', 'tag', 'function', 'alarm', 'report'];
	const sizes = [16, 20, 24, 32, 48, 64, 128, 256, 512];
	for (const kind of kinds) {
		const full = documentIconSvg(kind, false);
		const small = documentIconSvg(kind, true);
		await writeSvg(`file-icons/${kind}/icon.svg`, full, 'file-icon', kind, 'full');
		await writeSvg(`file-icons/${kind}/icon-small.svg`, small, 'file-icon', kind, 'small');
		for (const size of sizes) {
			await renderPng(size <= 32 ? small : full, `file-icons/${kind}/png/${size}.png`, size, 'file-icon', kind, size <= 32 ? 'small' : 'full');
		}
		const forSize = size => size <= 32 ? small : full;
		await writeIco(`file-icons/${kind}/${kind}.ico`, forSize, [16, 20, 24, 32, 48, 64, 128, 256], 'file-icon', kind, 'windows');
		await writeIcns(`file-icons/${kind}/${kind}.icns`, forSize, 'file-icon', kind, 'macos');
	}
}

function writeTokensAndDocumentation() {
	const tokens = {
		brand: 'AryaAI',
		tagline: 'Your AI engineering pal',
		colors: {
			primaryBlue: palette.primaryBlue,
			accentTeal: palette.accentTeal,
			accentPurple: palette.accentPurple,
			darkBackground: palette.darkBackground,
			surface: palette.surface,
			textLight: palette.textLight,
			statusSuccess: palette.success,
			statusWarning: palette.warning,
			statusError: palette.error
		},
		typography: {
			primary: { family: 'Sora', weights: [300, 400, 500, 600, 700] },
			secondary: { family: 'JetBrains Mono', weights: [400, 500, 700] }
		},
		spacing: { clearSpace: '1x, where x is the height of the mascot glasses' },
		header: { fullMinWidthPx: 520, compactBelowWidthPx: 520 },
		tray: { busyFrames: 12, recommendedFramesPerSecond: 12 },
		companion: {
			states: companionStates.map(state => state.id),
			staticSizes: [16, 20, 24, 32, 48, 64, 128, 256, 512, 1024],
			animatedSize: 256,
			formats: ['apng', 'webp'],
			reducedMotion: true
		}
	};
	fs.writeFileSync(path.join(kitRoot, 'aryaai-tokens.json'), `${JSON.stringify(tokens, null, 2)}\n`, 'utf8');
	fs.writeFileSync(path.join(kitRoot, 'aryaai-tokens.css'), `@font-face {
  font-family: "Sora";
  src: url("./sources/fonts/Sora-Variable.ttf") format("truetype");
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("./sources/fonts/JetBrainsMono-Variable.ttf") format("truetype");
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}

:root {
  --arya-color-primary-blue: ${palette.primaryBlue};
  --arya-color-accent-teal: ${palette.accentTeal};
  --arya-color-accent-purple: ${palette.accentPurple};
  --arya-color-dark-background: ${palette.darkBackground};
  --arya-color-surface: ${palette.surface};
  --arya-color-text-light: ${palette.textLight};
  --arya-color-status-success: ${palette.success};
  --arya-color-status-warning: ${palette.warning};
  --arya-color-status-error: ${palette.error};
  --arya-font-primary: "Sora", sans-serif;
  --arya-font-secondary: "JetBrains Mono", monospace;
}
`, 'utf8');

	fs.writeFileSync(path.join(kitRoot, 'README.md'), `# AryaAI Production Branding Kit

AryaAI is **your AI engineering pal**: a friendly Vietnamese–Filipino female engineer with glasses. The mascot is the primary identity. The geometric A remains a secondary technical seal for tiny, monochrome, tray, file, and system contexts.

## Contents

- \`logos/\`: primary, horizontal, stacked, light-background, monochrome, and standalone variants.
- \`header/\`: full responsive wordmark and compact title-bar mark.
- \`app-icons/\`: Windows ICO, macOS ICNS, Linux hicolor PNGs, web favicons, PWA icons, and visual variants.
- \`companion/\`: twelve static and animated task expressions, reduced-motion stills, and sprite fallbacks.
- \`desktop-icons/\`: Project, PLC Program, HMI/SCADA, Library, Template, and Script folders.
- \`tray/\`: active, idle, busy, error, notification, update, sync, settings, and exit icons for dark and light surfaces.
- \`file-icons/\`: Logic, Config, Tag, Function, Alarm, and Report document icons.
- \`splash/\`: scalable and raster startup artwork.
- \`preview/\`: contact sheet assembled from the generated assets.

Every family includes SVG masters and raster exports. Windows and macOS container files include multiple resolutions. The 16px, 20px, and 32px exports use simplified source drawings with heavier strokes and fewer details.

## Companion states

The canonical state IDs are \`idle\`, \`greeting\`, \`thinking\`, \`researching\`, \`creating\`, \`running-testing\`, \`writing\`, \`explaining\`, \`waiting\`, \`success-celebrating\`, \`warning\`, and \`error\`. Each state provides transparent PNG sizes, a 256px APNG, a 256px animated WebP, and a reduced-motion PNG. Prefer WebP in the application, APNG as the animated fallback, and \`reduced-motion.png\` when the user requests reduced motion.

## Responsive header

Use \`header/header-wordmark.svg\` when at least 520px is available. Below that width, use \`header/header-mark.svg\`. These are assets only; the application title bar is intentionally unchanged.

## Tray animation

The busy animation is a 12-frame clockwise sequence under \`tray/png/<theme>/busy-frames/<size>/\`. Play at 12 frames per second. Static busy SVG and PNG files are also provided.

## Usage rules

- Preserve the supplied colors and proportions.
- Keep clear space equal to the height of the mascot's glasses.
- Do not alter her facial identity, glasses, hair streak, headset side, complexion, or engineer jacket.
- Do not use flags, costumes, or stereotypes to communicate Vietnamese–Filipino heritage.
- Do not stretch, recolor, rotate, bevel, or add unapproved effects to the mascot.
- Use the light-background variant on pale surfaces and the full-color variant on dark surfaces.
- Use the secondary A mark for tray, file, monochrome, and sub-32px contexts where the face is not legible.

## Rebuild and validate

From the repository root, using the Node 20.18.2 runtime required by this project:

\`\`\`powershell
& 'C:\\dev\\node-v20.18.2-win-x64\\node.exe' .\\branding\\aryaai-brand-kit\\tools\\build-brand-kit.mjs
& 'C:\\dev\\node-v20.18.2-win-x64\\node.exe' .\\branding\\aryaai-brand-kit\\tools\\validate-brand-kit.mjs
\`\`\`

The exporter uses the approved mascot sources under \`sources/mascot/\` and the official Sora and JetBrains Mono files under \`sources/fonts/\`. Their SIL Open Font License files are stored beside them.
`, 'utf8');

	fs.writeFileSync(path.join(kitRoot, 'BRAND-GUIDE.md'), `# AryaAI Brand Guide

## Brand idea

AryaAI is **your AI engineering pal**: capable, warm, technically fluent, and present without becoming distracting. Her Vietnamese–Filipino identity is expressed through the approved character design, never through caricature or costume.

## Identity hierarchy

1. Use the mascot badge for the app icon, product logo, splash, marketing, and Chat companion.
2. Use the geometric A as a secondary technical seal for tray icons, file associations, monochrome surfaces, and very small marks.
3. Keep the wordmark spelling exactly **AryaAI**.

## Motion

Use short, seamless loops with natural blinking, a two-pixel breathing/head bob, and a subtle cyan headset pulse. Never animate all interface instances simultaneously. Respect \`prefers-reduced-motion\` and substitute the supplied reduced-motion PNG.

## Clear space and minimum size

Keep clear space around mascot lockups equal to the rendered height of her glasses. Use mascot artwork at 32px or larger. Below 32px, use the supplied simplified A mark.

## Positioning

Core message: **Your AI engineering pal**. PLC, HMI/SCADA, automation, visualization, and deployment remain supported specialties rather than the primary tagline.
`, 'utf8');
}

async function main() {
	await loadCompanionSources(kitRoot);
	resetGeneratedDirectories();
	await generateCompanionAssets({ ensureParent, registerAsset });
	await generateLogoSuite();
	await generateAppIcons();
	await generateSplashAssets();
	await generateDesktopIcons();
	await generateTrayIcons();
	await generateFileIcons();
	writeTokensAndDocumentation();

	const contactSheet = contactSheetSvg();
	await writeSvg('preview/aryaai-brand-kit-contact-sheet.svg', contactSheet, 'preview', 'contact-sheet', 'vector');
	await renderPng(contactSheet, 'preview/aryaai-brand-kit-contact-sheet.png', 1920, 'preview', 'contact-sheet', 'raster');
	const companionSheet = companionContactSheetSvg();
	await writeSvg('preview/aryaai-companion-contact-sheet.svg', companionSheet, 'preview', 'companion-contact-sheet', 'vector');
	await renderPng(companionSheet, 'preview/aryaai-companion-contact-sheet.png', 1920, 'preview', 'companion-contact-sheet', 'raster');
	const sizeQaSheet = companionSizeQaSvg();
	await writeSvg('preview/aryaai-companion-size-qa.svg', sizeQaSheet, 'preview', 'companion-size-qa', 'vector');
	await renderPng(sizeQaSheet, 'preview/aryaai-companion-size-qa.png', 1920, 'preview', 'companion-size-qa', 'raster');

	manifest.assets.push(
		{ path: 'sources/fonts/Sora-Variable.ttf', family: 'typography', name: 'Sora', variant: 'variable', format: 'ttf' },
		{ path: 'sources/fonts/Sora-OFL.txt', family: 'license', name: 'Sora OFL', variant: 'license', format: 'txt' },
		{ path: 'sources/fonts/JetBrainsMono-Variable.ttf', family: 'typography', name: 'JetBrains Mono', variant: 'variable', format: 'ttf' },
		{ path: 'sources/fonts/JetBrainsMono-OFL.txt', family: 'license', name: 'JetBrains Mono OFL', variant: 'license', format: 'txt' },
		{ path: 'sources/mascot/aryaai-approved-portrait-reference.png', family: 'source', name: 'approved-portrait', variant: 'reference', format: 'png', dimensions: { width: 1315, height: 1196 }, alphaRequired: false },
		{ path: 'sources/mascot/aryaai-companion-open-master.png', family: 'source', name: 'companion-sheet', variant: 'open', format: 'png', dimensions: { width: 1448, height: 1086 }, alphaRequired: true },
		{ path: 'sources/mascot/aryaai-companion-blink-master.png', family: 'source', name: 'companion-sheet', variant: 'blink', format: 'png', dimensions: { width: 1448, height: 1086 }, alphaRequired: true },
		{ path: 'sources/mascot/GENERATION-NOTES.md', family: 'source', name: 'generation-notes', variant: 'documentation', format: 'md' }
	);
	manifest.assets.sort((a, b) => a.path.localeCompare(b.path));
	fs.writeFileSync(path.join(kitRoot, 'brand-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
	console.log(`AryaAI brand kit generated: ${manifest.assets.length} assets`);
}

await main();
