# AryaAI Production Branding Kit

AryaAI is **your AI engineering pal**: a friendly Vietnamese–Filipino female engineer with glasses. The mascot is the primary identity. The geometric A remains a secondary technical seal for tiny, monochrome, tray, file, and system contexts.

## Contents

- `logos/`: primary, horizontal, stacked, light-background, monochrome, and standalone variants.
- `header/`: full responsive wordmark and compact title-bar mark.
- `app-icons/`: Windows ICO, macOS ICNS, Linux hicolor PNGs, web favicons, PWA icons, and visual variants.
- `companion/`: twelve static and animated task expressions, reduced-motion stills, and sprite fallbacks.
- `desktop-icons/`: Project, PLC Program, HMI/SCADA, Library, Template, and Script folders.
- `tray/`: active, idle, busy, error, notification, update, sync, settings, and exit icons for dark and light surfaces.
- `file-icons/`: Logic, Config, Tag, Function, Alarm, and Report document icons.
- `splash/`: scalable and raster startup artwork.
- `preview/`: contact sheet assembled from the generated assets.

Every family includes SVG masters and raster exports. Windows and macOS container files include multiple resolutions. The 16px, 20px, and 32px exports use simplified source drawings with heavier strokes and fewer details.

## Companion states

The canonical state IDs are `idle`, `greeting`, `thinking`, `researching`, `creating`, `running-testing`, `writing`, `explaining`, `waiting`, `success-celebrating`, `warning`, and `error`. Each state provides transparent PNG sizes, a 256px APNG, a 256px animated WebP, and a reduced-motion PNG. Prefer WebP in the application, APNG as the animated fallback, and `reduced-motion.png` when the user requests reduced motion.

## Responsive header

Use `header/header-wordmark.svg` when at least 520px is available. Below that width, use `header/header-mark.svg`. These are assets only; the application title bar is intentionally unchanged.

## Tray animation

The busy animation is a 12-frame clockwise sequence under `tray/png/<theme>/busy-frames/<size>/`. Play at 12 frames per second. Static busy SVG and PNG files are also provided.

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

```powershell
& 'C:\dev\node-v20.18.2-win-x64\node.exe' .\branding\aryaai-brand-kit\tools\build-brand-kit.mjs
& 'C:\dev\node-v20.18.2-win-x64\node.exe' .\branding\aryaai-brand-kit\tools\validate-brand-kit.mjs
```

The exporter uses the approved mascot sources under `sources/mascot/` and the official Sora and JetBrains Mono files under `sources/fonts/`. Their SIL Open Font License files are stored beside them.
