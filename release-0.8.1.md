# AryaAI 0.8.1

AryaAI 0.8.1 is a maintenance release on DeepSeek Harness 0.2.0-rc.2.

- Refreshes the included MotionWorks IEC plugin from upstream Git: compiler-artifact timing, protected function-block reviews, guarded library reads, native variable-group edits, IDE diagnostics, and equivalent Windows checkpoint paths.
- Verifies that all 62 MotionWorks tools register through the current Harness, including their parameter and response schemas.
- Removes the MCP token-efficiency plugin, settings page, and conversation controls. The regular context meter remains; existing sessions containing the plugin's recorded state remain readable.
- Custom profiles referencing the removed packages must remove those entries before restarting. See the [token-efficiency removal upgrade guide](https://github.com/KonnectSuite/AryaAI/blob/804ae6ef4952c3495788b0b0e2286fab7147d883/docs/upgrade-guide/v0.2.0-rc.2/token-efficiency-removal/guide.md).

Installer version: `0.2.0-rc.2.AryaAI.0.8.1`.
Source: [804ae6ef49](https://github.com/KonnectSuite/AryaAI/commit/804ae6ef4952c3495788b0b0e2286fab7147d883).
MotionWorks revision: `33d1e0dc5fa22bb57685c0c9acf3ae04b7d60543`; upstream manifest version remains 0.5.5.

The Windows x64 installer is unsigned. Source checks, packaging, bundled-tool compatibility, and published asset/feed integrity are verified by the release agent. Installed-app and upgrade acceptance are owned by the user; live MotionWorks IDE operation is not claimed from automated checks.
