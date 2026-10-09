# AryaAI 0.10.0

AryaAI 0.10.0 adds an Arya plugin catalog and docked-application awareness and control on DeepSeek Harness 0.2.0-rc.2.

- Adds Arya Plugin Market with public packaged releases, plugin updates, release selection, and restoration of retained versions.
- Groups FactoryTalk View Use and Native Window with Arya built-in plugins.
- Includes Native Window 0.2.2: inspect docked applications, accessible controls, text, dialogs and screenshots; edit or invoke observed controls and inspect the result after each action.
- Screenshot reasoning requires an image-capable model; text-only models use accessible controls and text. Foreground input depends on Windows focus and access permissions.
- Preserves sessions, personal plugins, and removal of optional built-in bundles during upgrades.

Installer version: `0.2.0-rc.2.AryaAI.0.10.0`.
Source: [b4f0b84fc5](https://github.com/KonnectSuite/AryaAI/commit/b4f0b84fc540d834265a9d7ccdc715bbfc5781fd).
Native Window revision: `aae7ef5f02a56c3a8dc4a429dee84509ea517bf4`.
Plugin Market version: `1.66.14-arya.0.4`.

The Windows x64 installer is unsigned. Installation and upgrade acceptance are owned by the user. Native Window automation was tested with owned Notepad windows; foreground input and live FactoryTalk Studio or Studio 5000 operation remain unverified.
