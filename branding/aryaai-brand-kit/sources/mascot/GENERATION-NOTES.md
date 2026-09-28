# AryaAI Mascot Source Notes

The mascot sources were produced with the built-in image-generation workflow on 2026-08-27. The approved portrait was the identity reference.

## Open-eye expression sheet prompt

Create one transparent 4×3 production sprite sheet containing the same Vietnamese–Filipino female software engineer in twelve states: idle, greeting, thinking, researching, creating, running/testing, writing, explaining, waiting, success/celebrating, warning, and error. Preserve her warm medium complexion, dark wavy hair with violet streak, rectangular glasses, cyan circuit hair clip, navy engineer jacket, and cyan-lit headset. Use centered head-and-shoulders framing, identical scale, the AryaAI blue/teal/violet palette, no flags or stereotypes, no text, no watermark, and genuine alpha transparency.

## Blink expression sheet prompt

Using the open-eye sheet as the edit target, change only the eyelids to create a brief natural blink while preserving the exact identity, canvas, grid, glasses, hair, headset, outfit, hands, props, lighting, colors, spacing, and alpha transparency.

## Production correction

The initial expression result rendered a checkerboard rather than alpha. A background-extraction edit produced the approved open-eye transparent master. The blink master uses the approved open-eye alpha mask to guarantee identical transparent edges. Generated runtime assets are derived deterministically from these two source sheets.
