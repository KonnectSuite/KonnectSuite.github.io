# AryaAI 0.10.1

AryaAI 0.10.1 repairs Native Window loading after the 0.10.0 update.

- Includes Native Window 0.2.3 with corrected bundle configuration. This fixes the YAML indentation error that prevented the built-in plugin from loading.
- Installer checks now reject shipped bundles that Arya skips during profile configuration composition.
- Retains Arya Plugin Market and the application observation and control tools introduced in 0.10.0.

Installer version: `0.2.0-rc.2.AryaAI.0.10.1`.
Source: [6dda40fe7c](https://github.com/KonnectSuite/AryaAI/commit/6dda40fe7cee10186030c716dd97fee7b186e187).
Native Window revision: `81f6a6302edbbd854bdca61657a4d0a943225678`.

Validated the packed plugin configuration, actual Arya profile composition and Native Window server routes, packaging regression tests, recorded Native Window tool session, release notes, type checks and documentation checks. The finished runtime is checked during packaging.

The Windows x64 installer is unsigned. Installed upgrade acceptance is owned by the user.
