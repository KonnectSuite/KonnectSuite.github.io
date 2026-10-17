# AryaAI website update — gameplan

Status: draft for review. Nothing on the site has been changed yet.
Prepared against: website repo `main` @ `7aea011` ("Publish AryaAI 0.6.7 Windows update feed"),
AryaAI checkout `aryaai-rebrand` @ `66a3f9e586`.

---

## 1. The headline

**The site describes the 0.4.0-era product. The product is 0.6.7 — and two of the site's
most prominent claims are now false, not merely stale.**

The site's own repository already knows the current version: its most recent commit is
*"Publish AryaAI 0.6.7 Windows update feed."* Only the six HTML pages were never brought
forward.

Three claims must be corrected before any new content is written, because they are
accuracy and liability problems rather than marketing problems:

| # | Where | The site says | The product does |
|---|---|---|---|
| 1 | `index.html`, `docs.html`, `engineering.html` | "It will **never** be given the ability to download, force, toggle, write, or change data on a live PLC." Studio 5000 "does not open Studio 5000, **go online, or download**." | Ships `capture_controller_snapshot` (upload), `change_controller_mode` and `download_project`, each behind a **per-call human approval**. |
| 2 | `index.html`, `engineering.html`, `docs.html` | "**Dry run by default** on the desktop"; "The dry run is the default, not a setting buried three menus deep." | Ships **dry run off** (`DRY_RUN: '0'`, `BYPASS_HITL: '1'`). The protection that is actually on is the **kill switch** (`KILL_SWITCH: '1'`). |
| 3 | `index.html`, `engineering.html` | "Seven tools — six of them inside the installer"; only Windows Computer Use "starts with the application." | **Eight** MCP rows, **seven** bundled, and **two** start enabled (Windows Computer Use **and** ComfyUI MCP). |

Claim 2 is the sharpest, because the shipped configuration's own comment says why the
dry run was walked back: it "only [covers] `automation_mouse`, `automation_keyboard`,
`automation_elements` and `automation_shortcut`… `automation_dialog`, `automation_mission`,
`automation_task`, `automation_macro`, `automation_smart` and `automation_system` carry no
check at all… and the gate fails open." The site is currently advertising a coverage
guarantee the product deliberately withdrew. The kill switch is the honest, and stronger,
claim — and 0.6.6 added user-facing kill-switch and dry-run settings, which is a genuine
new story.

None of the three are wording fixes. Each needs a decision (§5) and then a rewrite.

---

## 2. What shipped since the site was written (0.4.0 → 0.6.7)

From `packages/client/ui-release-notes/src/catalog.ts`:

| Version | What the site never mentions |
|---|---|
| 0.5.0 | MotionWorks IEC plugin reliability: variable adds that previously failed, Make/Build reporting what the compiler actually did, the IDE bridge waiting for a starting window. |
| **0.6.0** | **Remote access / pairing.** **Studio 5000 L5X tools + the Logix project viewer.** Redesigned Skills & MCP manager. Images multi-select. |
| **0.6.1** | L5X large draft proposals; new tag descriptions in export order; **offline build failure stage + diagnostics**; SDK service check before open/build; **"Controller upload, mode change, and download require an Ask approval session."** |
| 0.6.2 | Creator mode fix; GitHub account action in the sidebar; workspace menu → open in Explorer. |
| **0.6.3** | **Typed live tag reads and bounded sampling**; controller IP checked against the saved Linx route; downloads require a reviewed offline build from an approved upload in the same session. |
| **0.6.4** | **MotionWorks IEC 0.5.1** engineering guides + fresh Build/Make verification after reopening; latest pinned Studio 5000 L5X bundled; Images dictation and reference-image editing; **ComfyUI MCP enabled by default for new profiles.** |
| 0.6.5 | Startup hotfix. |
| **0.6.6** | **Images becomes a conversation room** where Arya drives enabled ComfyUI MCP tools to choose image **and video** workflows. **Skills & MCP exposes the Windows Computer Use kill switch and dry-run settings.** |
| 0.6.7 | Images chat-style with persistent composer; reference photos; **ComfyUI local *or remote* endpoints with connection testing**; saved image conversations. |

The two capabilities you named map onto 0.6.0–0.6.4, and neither has a page of its own.

---

## 3. Drift inventory, claim by claim

Severity: **BLOCKER** = factually false or liability-bearing · **MAJOR** = materially
understates · **MINOR** = stale detail.

| Page | Current claim | Reality | Sev |
|---|---|---|---|
| `index.html` | "While online with a controller, AryaAI is read only… never… download, force, toggle, write, or change data on a live PLC." | Read-only is the **default**; three named controller actions exist behind per-call human approval. | **BLOCKER** |
| `docs.html` | "While online with a controller, AryaAI is read only… Every edit happens in offline files — Studio 5000 work against an exported `.l5x`." | Offline editing is still the norm, but ACD editing through the SDK is now supported. | **BLOCKER** |
| `engineering.html` | Studio 5000 Projects "Reaches: an exported `.l5x`… **Deliberately stops at:** No controller. Does not open Studio 5000, go online, or download." | The capability is now 23 engineering tools incl. upload, mode change, download, `go_online`, live tag reads. | **BLOCKER** |
| `index.html` | Terminal mock: "**No download performed.** This tool reads an export only." | Not true as a blanket statement. | **BLOCKER** |
| `index.html`, `engineering.html`, `docs.html` | "Dry run by default on the desktop." | Dry run ships **off**; kill switch ships **on**. | **BLOCKER** |
| `index.html`, `engineering.html` | "Seven automation servers, six of them inside the installer." | 8 rows / 7 bundled / FT Optix is the only non-bundled one. | MAJOR |
| `index.html`, `engineering.html` | Only Windows Computer Use starts with the app. | ComfyUI MCP also starts enabled. | MAJOR |
| `engineering.html` | "The MotionWorks path, and why it is a skill" — one paragraph, framed around a withdrawn file-format writer. | A bundled plugin that stages a copy, drives the running IDE and verifies through the compiler: 45–49 tools across discovery, staging, IDE control, project reading, task/POU assignment, variables (plan-and-verify only), Build/Make, compiler diagnostics, and versioned reference search. No file writer ships. | **MAJOR** |
| whole site | No mention of the **L5X viewer**. | Shipped, enabled built-in plugin (`ui-logix-project-viewer`) — the strongest visual asset in the product. | **MAJOR** |
| whole site | No mention of **browser use**. | Two composed-and-enabled rows: `dsh-browser-use` plus the Playwright MCP provider, giving the agent Playwright's browser-control tools against a **bundled Chromium**, one profile per live session, headless by default. Plus a right-sidebar **Browser panel** (`ui-sidebar-browser`) with an Electron `<webview>` on Desktop and a sandboxed iframe on Web. | **MAJOR** |
| whole site | No mention of **Remote access / pairing** (0.6.0). | Shipped feature; the underlying relay plugin's scope is still open per `ARYAAI-STATUS.md`. | **MAJOR** |
| `index.html`, `features.html` | ComfyUI: "one endpoint is configured per install — switching means changing `ARYAAI_COMFYUI_URL` and restarting." | 0.6.7 adds in-app local/remote addresses, connection testing, Save and reconnect. | MAJOR |
| `index.html`, `features.html` | Images presented as a form-driven generator. | It is a **conversation room** driving image *and video* workflows, with reference photos, follow-ups, saved rooms, media library. | MAJOR |
| `index.html` | 12-state companion gallery presented as product behaviour. | Those states are **brand-kit art**. What ships is a sprite-atlas pet (drag, pin, scale, mouse tracking, bubbles, sounds, first-person summaries). `ARYAAI-REBRAND-BULLETIN.md` calls nine of the states "unused… none has an honest signal yet." | MAJOR |
| `docs.html` | "Current line… see the releases page"; "The first milestone is Version 1.0." | Version is never stated anywhere on the site; the number is **0.6.7**. Milestones 1 and 2 are recorded as not achieved. | MAJOR |
| whole site | "The engineering desk: Seven automation servers." | The wider surface is ~**91 model-visible tools across 33 tool packages** (`docs/tool-catalog.md`, gate-verified). | MINOR |

**Not wrong, keep:** "beta / preview / unsigned installer"; "none of its automation tools
have been field tested"; MIT; not affiliated with DeepSeek; Windows-only.

---

## 4. The two flagship stories

These are the two pages the product is missing.

### 4.1 MotionWorks IEC — "a Yaskawa motion support engineer at the desk"

**What it actually is.** A bundled Cordis plugin (`dsh-motionworks-iec-use`) that works on a
**staged copy** of a project (`<workspace>/.motionworks/stage/`) and drives the **running
MotionWorks IEC 3 Pro IDE**. The plugin is the reasoning, guard and verification half; the
**hands are a separately connected desktop-control MCP** (the bundled Windows Computer Use).
That dependency is an explicit, separate install with its own permissions, and the plugin
does not pretend its checklists execute UI actions.

**The positioning, and it is a strong one.** The **disk writer is retired permanently** —
the offline file-format writer that could empty a program body and report success. What
replaces it is not caution, it is a better mechanism: **Arya edits through the IDE's own
native APIs**, with an exact precondition before the write and a read-back verification
after it, and a fresh compile as the evidence. The honest one-line claim for the site:

> **The disk writer is gone. Edits go through the vendor IDE's own APIs, every write states
> what it expects to find first, and every write reports what it actually found afterwards.**

**Generation matters — get this right before writing copy.** Four surfaces disagree:

| Surface | Plugin | Notes |
|---|---|---|
| AryaAI 0.6.7 shipped installer | 0.5.1 | 45 tools, no native code writer |
| Working tree (uncommitted) | 0.5.5 | 49 tools + native COM declaration changes |
| `KonnectSuite/dsh-motionworks-iec-use` `main` | 0.5.5 + **Unreleased** | **Native editing returns — this is the update to publish against** |
| HEAD commit's vendored copy | 0.4.0 | 50 tools, includes the retired file writers |

**v0.5 retired nine offline editor tools outright** — "removed, not hidden by a runtime
flag" (`docs/TOOL_RETIREMENT.md`): `mw_code_write_st`, `mw_code_var_add`,
`mw_code_var_add_many`, `mw_code_var_edit`, `mw_code_var_delete`, `mw_code_pou_create`,
`mw_code_pou_delete`, `mw_code_restore_pou`, `mw_ide_rebuild`. **None of those names comes
back.** Native replacements take their place.

> **Correction.** An earlier draft of this gameplan listed the retired writers as shipped,
> because the agent session that produced it is running a stale 0.4.x plugin. Authoritative
> check: the `defineTools()` catalog in the installed package — 45 tools in 0.6.7, every
> retired name absent.

**The upcoming release restores editing through native IDE APIs** (from the upstream
`SKILL.md`, `README.md` and `CHANGELOG.md`):

| New tool | What it does |
|---|---|
| `mw_ide_code_change` | Replaces an ST body through the native DDE `ChangeCodeWS` API — "not keyboard input or a disk-source writer". Requires the current body as an exact `expected_body` precondition, returns full code **and comment** read-back plus collateral source checks |
| `mw_ide_variable_change` | Native local/global/external add/edit/delete with complete saved/native read-back |
| `mw_ide_open_worksheet` | Opens code or variables by exact saved tree identity; requires `accepted:true` and verifies two responsive editor frames |
| `mw_ide_pou_change` | Create blank PROGRAM / FUNCTION_BLOCK / FUNCTION (ST, FBD or LD), copy, rename, delete |
| `mw_ide_pou_convert` | Native `Pou.Convert` source-language conversion to FBD/LD, with `expected_body_sha256` |
| `mw_ide_pou_package` | Export/import an exact writable POU under a session-bound, single-use token |
| `mw_ide_task_change` | Task create / edit / delete / assign / unassign |
| `mw_ide_fb_insert` | Declares an ST function-block instance and inserts its call with explicit pin bindings |
| `mw_code_block_interface` | Reads installed FB pin **types and directions** from live-bound library declarations and firmware parameter tables |
| `mw_ide_graphical_listing` | LD/FBD compiler-network diagnosis after a fresh Build, without desktop input |
| `mw_code_installed_help` | Searches the actually-installed CHM editor/programming help, including shortcut and toolbox workflows |

**Verified-only shipped surface (0.5.x):**

- *Discover & stage*: `mw_project_find`, `mw_ide_stage`, `mw_workflow_check`, `mw_code_wrapper_binding`, `mw_code_rebind_wrapper`, `mw_code_sync_back`
- *IDE lifecycle*: `mw_ide_status`, `mw_ide_state`, `mw_ide_dialog`, `mw_ide_start`, `mw_ide_trial`, `mw_ide_open`, `mw_ide_close`, `mw_ide_save`, `mw_ide_screenshot`
- *Read the project*: `mw_ide_pous`, `mw_ide_variables`, `mw_code_pous`, `mw_code_read_st`, `mw_code_globals`, `mw_code_types`, `mw_code_library`, `mw_code_tasks`, `mw_code_task_model`, `mw_code_unsupported`, `mw_code_export_pou`, `mw_code_source_manifest`, `mw_code_validate`, `mw_code_eip_map`
- *Build & accept*: `mw_ide_build`, `mw_ide_make`, `mw_ide_compile_state`, `mw_ide_errors`, `mw_ide_verify`
- *Understand & reference*: `mw_code_check_program`, `mw_code_diagnose`, `mw_code_pattern`, `mw_code_reference`, `mw_code_reference_sync`, `mw_code_manual`, `mw_ide_edit_guide`
- *Reference material*: 22 reviewed topics, six historical function-block interfaces, four
  original ST patterns, optional indexing of 1,530 PDF pages.

**Boundary:** never downloads to a controller, never commands motion, never touches I/O. The
staged copy is the only thing it edits; promotion back to the real project is a separate,
explicit, dry-run-defaulted, hash-verified operation (`mw_code_sync_back` carries **source
only** — measured 8 files, where a blanket copy selected 90 and led with `.pdb` files).
Compilation is explicitly documented as *not* proof of machine behaviour.

**Evidence the site can cite** (from the upstream capability table, which grades each row):

- Native COM variable lifecycle and worksheet navigation — **passed**
- Native POU/task structure — blank ST/FBD/LD creation, populated ST copy/edit/rename/delete,
  populated LD copy/rename/delete, task lifecycle — **passed** with saved/native and
  collateral checks
- Native ST code editing — body replacement and clearing, exact comment read-back,
  stale-body refusal, fresh Build/Make — **passed on a disposable POU**; printable ASCII only
- Graphical worksheet editing and libraries — LD lifecycle preservation passed;
  **graphical body import/insertion/wiring remains unverified**

**Honest limits to publish:** arbitrary graphical LD/FBD generation is still not claimed;
graphical insertion and wiring are explicitly outside the tools' scope; library lifecycle
acceptance is incomplete; native Rebuild is refused on the installed IDE; a build attempted
while a POU is unassigned can stall ~90 s and end with an **empty Errors pane, which is
explicitly not success**; the static reviewer is not a compiler, and compilation is not
commissioning.

**Publishing note:** this page should land **with** the plugin update, not before it. The
installed 0.6.7 still carries 0.5.1, which has no native code writer — so publishing the
editing story today would overstate the shipped build.

**Why it is a page:** this is a category the site currently gives one paragraph, and the
paragraph is about a writer that was withdrawn. The stronger, true story is the one the
plugin is actually built around: **it plans, guards and verifies, and the compiler is the
evidence.**

### 4.2 Studio 5000 / Logix Designer — "a Studio 5000 engineer, online with you"

**What it actually is.** A pinned Cordis bundle (`dsh-tool-l5x`) delivering **23
engineering tools**, plus a separate switchable MCP row, plus a shipped built-in viewer.

**Verified surface (23 tools):**

- *Offline read*: `open_project`, `project_overview`, `get_component`, `compare_projects`, `read_project_comm_path`
- *Code understanding*: `find_references`, `trace_symbol`, `run_checks` (UNUSED_TAG, UNRESOLVED_REFERENCE, UNSCHEDULED_PROGRAM, MULTIPLE_OUTPUT_WRITES, IO_MODULE_CHANGED…)
- *Offline edit & build*: `propose_change`, `validate_proposal`, `edit_offline_acd`, `verify_offline_l5x`, `export_acd_to_l5x`
- *Preflight*: `studio_sdk_status`, `controller_approval_status`
- *Live read-only*: `read_controller_mode`, `go_online`, `read_live_tag`, `read_live_dint`, `sample_live_tags`
- *Controller actions — per-call approval*: `capture_controller_snapshot` (upload), `change_controller_mode`, `download_project`

**The L5X viewer** (`packages/client/ui-logix-project-viewer`, mounted enabled) is a
Studio-style offline workspace: Controller Organizer tree, **ladder drawn from
NeutralText** with real contact/coil geometry and function-block cards, Structured Text
source, searchable tag tables, an offline watch, textual cross-references, a source-review
dock, and a blue **OFFLINE** chip. Every value is labelled as coming from the saved export,
not the controller. Ask-Arya actions only *draft* a prompt; the user decides whether to send.
An `.ACD` shows export guidance instead.

**Approval mechanics worth publishing** — this is the section no competitor can match:
a composer takeover reading **"Waiting for approval"**, naming the user-supplied IP, the
resolved FactoryTalk Linx route, the ACD path and SHA-256, the change list, and
"safety content unchanged; observed Program mode", with **Reject (Esc)** / **Allow once
(Enter)**. No tool schema has an `approved` flag, so the model cannot self-authorise; the
plugin fails closed if the approval service is unavailable; and under the **Full access**
preset the actions cannot be requested at all (verified live in this session:
`approval_required_per_call` = the three tools, `approved_controller_actions_requestable`
= `false`).

**Honest limits to publish:** **download has never been exercised on a real controller**
(upload and Run→Program→Run have). Encoded/AOI payload equivalence is unverified and
blocks download eligibility for protected projects. SDK build requires revision ≥ 37.
FBD/SFC are only partly analysed; protected logic is neither analysed nor edited.
`edit_offline_acd` handles one existing same-type RLL/ST routine. Checks are heuristics,
not certification.

---

## 5. Blocking decisions

These gate the copy. I recommend deciding all four before writing pages.

### D1 — What is the controller safety rule, in one sentence?

The repository currently publishes an absolutist rule ("will never be granted the ability
to download to… a live controller") **and** ships the tools that do it behind approval.
`ARYAAI-ONLINE-SAFETY.md` additionally asserts nothing in the tree reports whether a
controller is live — which `read_controller_mode` now does.

Options:
- **(a) Ratify the shipped behaviour** (recommended): *read-only by default; three
  controller-changing actions, each requiring a fresh, per-operation human approval
  against a named controller; online edits, forces, bit toggles and data writes are
  permanently prohibited.* Then update `PRODUCT.md`, `README.md`, `SAFETY.md` and
  `ARYAAI-ONLINE-SAFETY.md` to match.
- **(b) Restore the absolutist rule** by removing the three tools.
- **(c) Keep both** (bad): the site and the repo continue to contradict each other.

### D2 — MotionWorks: what may the site claim? *(resolved)*

`ARYAAI-STATUS.md` flags a "BLOCKING A RELEASE — undecided" item about a MotionWorks
*writing* plugin. It was written against the v0.4.0 vendored copy, which shipped offline file
writers. **The 0.5 migration retired all nine of those, and the upcoming release replaces them
with native IDE APIs.** So the original framing ("keep the writer" vs "ship read-only") was
wrong in both directions — there is neither a disk writer to keep nor a read-only design to
defend.

**Resolution: the site says the product reads, reviews *and* writes, and says how.** The claim
is stronger than either option in the original question, because the mechanism is the story:

> The disk writer is retired permanently. Edits go through the vendor IDE's own APIs —
> `mw_ide_code_change` uses the native `ChangeCodeWS` API, not keyboard input and not a
> disk-source writer. Every write takes an exact expected-body precondition and returns a
> read-back verdict, and the compiler is the evidence.

Remaining actions, none of them open questions:

- Rewrite `PRODUCT.md`'s limit — "It does not edit a MotionWorks IEC project… There is no
  MotionWorks plugin in this line" is false and always was.
- **State the desktop-control companion as a requirement** on the MotionWorks page. It is
  honest, and it explains why the IDE must be open for the remaining UI-only operations.
- Fix `ARYAAI-STATUS.md` (stale version and retired-tool list) in Phase 0 so the site is not
  copying a contradiction.
- **Time the page to the plugin update.** The installed 0.6.7 carries 0.5.1, which has no
  native code writer. Publishing the editing story against today's installer would overstate
  it.

### D3 — Windows Computer Use: kill switch or dry run?

If D-safety is ratified as the kill switch, the site leads with the kill switch and the
0.6.6 settings card, and retires every "dry run by default" sentence. I recommend this —
it is both true and a better story, since the kill switch refuses mutating automation
outright and the settings are user-facing.

### D4 — Is remote access / pairing publishable?

0.6.0 ships it, but `ARYAAI-STATUS.md` records the underlying relay plugin as parked by
user decision. Publish or omit — do not half-mention.

---

## 6. The plan

### Phase 0 — Decide and set one source of truth (½ day)

1. Resolve D1–D4.
2. Fix the *repo* docs first, so the site has something true to copy: `PRODUCT.md`,
   `README.md`, `SAFETY.md`, `ARYAAI-ONLINE-SAFETY.md`, `ARYAAI-STATUS.md` (which still
   says 0.4.0 and calls `packages/industrial/` untracked).
3. Add a single `VERSIONS.md` or a version constant the site reads, so the number is
   stated once and cannot drift again.

### Phase 1 — The truth pass (1 day) — *do this first, it is the urgent part*

Surgical corrections to existing pages, no new design:

- Rewrite the safety block on `index.html` and `docs.html` per D1/D3.
- Replace the Studio 5000 row in `engineering.html`'s reach/boundary table.
- Fix the terminal mock on `index.html`.
- Re-count to "eight servers, seven in the installer, two on by default."
- State the version (0.6.7) explicitly.
- Remove or re-label the 12-state companion gallery.
- Fix the ComfyUI endpoint claim.

Ship this even if Phases 2–4 slip. Every day it is live, the site makes a safety promise
the product does not make.

### Phase 2 — Information architecture and the two flagship pages (3–4 days)

Current nav: `Features · Engineering desk · Docs · Pricing · Contact`.

Proposed:

```
Product
  Features              (existing, revised)
  Engineering desk      (existing — becomes the hub)
    MotionWorks IEC     (NEW — flagship 1)
    Studio 5000 / Logix (NEW — flagship 2)
    Ignition & Optix    (split out of the hub)
    Drawings & CAD      (NEW — the DXF engine is currently three paragraphs)
  Images & ComfyUI      (NEW — promoted out of Features)
Docs · Pricing · Contact
```

Homepage restructure: lead with the two engineer stories, keep the "different desk"
positioning, and add one honest "what it does not do yet" block (already present — extend
it rather than soften it).

### Phase 3 — Pictures (2 days including capture setup)

See §7. This is a hard dependency for Phase 2: neither flagship page can ship without a
real screenshot, and the site's own promise is "Every image below is a real screen capture
of the interface. Nothing here is a rendering or a design comp."

### Phase 4 — Repo docs (1 day, parallel with Phase 2)

`README.md`, `PRODUCT.md`, and the per-plugin READMEs the site will mirror.

### Phase 5 — Verify (½ day)

- Every number on the site traced to a file or a live call.
- Every capability statement traced to a tool registration.
- Every "cannot" traced to a refusal or a documented limit.
- Re-read the site as a sceptical automation engineer: *what would I be angry to discover
  was untrue after I installed it?*

---

## 7. Picture plan

### 7.1 The constraint

The site currently states: *"Every image below is a real screen capture of the
interface. Nothing here is a rendering or a design comp."* **Keep that promise.** Generated
or mocked-up UI would be the single fastest way to lose the credibility the safety writing
is trying to earn. Use generated imagery only for non-UI art (concept, diagrams, brand),
and label it as such if it appears at all.

### 7.2 What exists today

Five screenshots — `app-welcome`, `app-images`, `app-mcp`, `app-skills`, `app-plugins` —
plus `mark.svg` and the brand kit (icons, logos, tray, splash, companion art). Four of the
five are pre-0.6.0. `app-mcp.png` visibly shows the **old** Skills & MCP layout and a
server list with **no MotionWorks row**.

### 7.3 Capture blockers on this machine (verified)

| Blocker | Detail | Fix |
|---|---|---|
| A disposable MotionWorks project already exists, but discovery will not find it | `.motionworks/stage/TopCutter` holds a staged copy with 7 POEs and a real export (`.motionworks/exports/TopCutterCutControl.st`). `mw_project_find` reports "No MotionWorks projects found" because it deliberately **skips hidden directories**, and `.motionworks` is one. | Copy `TopCutter.mwt` + its expanded directory to a **non-hidden** folder inside the workspace before shooting. Never a customer project. |
| MotionWorks IDE not running | `mw_ide_status` → "no running MotionWorks IDE window; refusing to instantiate (that would launch a new IDE and a **trial licence permits only one instance**)." | Launch deliberately via `mw_ide_start`, once. Trial = one instance, so plan the shoot. |
| Studio 5000 not running | No `LogixDesigner.Exe` window. Installed at `…\Studio 5000\Logix Designer\ENU\v36` and `v37`. | Launch for the online/approval shots only. |
| No L5X in the workspace | Only test fixtures exist. | Use a **purpose-built demo export** (below). |
| No controller available | Upload/download/mode-change shots need real hardware. | Shoot the **approval prompt** to a controller that is not connected — the prompt is the story, and it needs no controller. |
| Existing fixture is not publishable | `dsh-tool-l5x/tests/fixtures/studio5000-v36-export.l5x` is a real 308 KB export of a **1756-L84E** with **1,010 tags** — but carries a live-looking network path in `CommPath="AUECHO01\10.11.19.204\Backplane\1"`. | **Do not screenshot as-is.** Scrub `CommPath`/hostnames/IPs, or build a demo export. |

### 7.4 Build one demo project, once

Neither fixture works well: `studio5000-v36-export.l5x` has a rich tag database but
**1 routine / 1 rung** (nothing to draw), while `sample.l5x` has 16 rungs but a thin tree.

Create a small, obviously-synthetic **"demo plant"** pair — one L5X and one MotionWorks
project — with:

- a plausible controller name and revision, no real IP/hostname anywhere,
- 3–4 programs, ~8–10 routines mixing **ladder** and **ST**, 20–40 rungs with real
  instructions (`XIC`/`XIO`/`OTE`/`OTL`/`TON`/`MOV`/`JSR`), rung comments,
- 2–3 UDTs, an AOI, I/O modules, a tag table with descriptions,
- one deliberate finding for the review dock (an unscheduled program or an unused tag).

This single artifact unblocks most shots, is safe to publish, and is reusable for docs
and release notes.

### 7.5 Shot list — priority order

**Tier 1 — the two flagship pages cannot ship without these**

| # | Shot | State needed |
|---|---|---|
| 1 | **Logix viewer, full window**: `LOGIX WORKSPACE` header, controller + revision, blue **OFFLINE** chip, source bar, Controller Organizer, a drawn ladder rung, inspector, bottom dock | App open, demo `.l5x` open in the right sidebar |
| 2 | **Ladder close-up** with the operand hover tooltip (symbol, scope, type, exported value, description) | Zoomed, tooltip visible |
| 3 | **Controller-action approval prompt** — "Waiting for approval", IP, resolved Linx route, ACD SHA-256, change list, Reject / Allow once | Can be triggered without a controller; **the best safety image in the product** |
| 4 | **MotionWorks: Arya driving the IDE** — MotionWorks IEC 3 Pro foreground with `TopCutterCutControl` open in the ST editor and a chat docked beside it naming the POU | IDE launched on the staged TopCutter copy. Capture with `mw_ide_screenshot` |
| 5 | **MotionWorks: compiler verdict, pass and fail** — the `mw_ide_errors` Errors/Warnings panes. Pair the clean build with the honest counter-image: an **empty pane with `is_compiled=false`**, captioned as the "stall or destroyed POU, not success" verdict | After a deliberate build; `mw_ide_errors` can screenshot the pane itself |
| 5b | **The verification report** — `mw_ide_verify` returning `ide_acceptance_and_persistence_verified` with phase rows (validate → Build → Make → Save → close/reopen → Build/Make) | Real retained reports exist under `.motionworks/verification/` |

**Tier 2 — hub and feature pages**

| # | Shot |
|---|---|
| 6 | Skills & MCP **new** manager, with the Windows Computer Use **kill switch + dry run** card and Save/restart |
| 7 | Images as a **conversation room** — inline generated media, persistent composer, reference-photo thumbnails, recents, media library |
| 8 | `verify_offline_l5x` success card — `offline_build: passed`, change summary, `download_ready: true` |
| 9 | A **failed** build with `failure_stage` + diagnostics + log tail — the honest counterpart |
| 10 | `find_references` / `trace_symbol` result table with access class and confidence |
| 11 | Drawings page with a DXF rendered as a drawing |
| 11b | **Browser panel** — the right-sidebar tab on a real page, with the toolbar (Back/Forward/Reload/Go/Open in system browser) and, on Desktop, the capture-to-composer action. A second variant attached to a **loopback service** would show the plant-network use case | Desktop, since Web's iframe carrier refuses many sites |
| 12 | Better Sidebar — file tree, editor, changes, tasks, side chat |
| 13 | Plugin Market — browse, themes, backup/restore, diagnostics |
| 14 | The shipped **pet** overlay in situ with a speech bubble (replaces the 12-state grid) |
| 15 | Settings → Release notes, showing 0.6.7 — doubles as the version story |

**Tier 3 — supporting**

Terminal panel, Browser panel, Jobs panel, Schedule panel, Goal panel, Deliverables cards,
subagent card, workflow run card, session cost display.

### 7.6 Capture method

- **Arya's own UI** (Tier 2/3): window-scoped screenshot via
  `mcp__wincomputer__cua_computer_use_screenshot`, or `automation_visual` with a region.
  Read-only capture is permitted even with the kill switch on (verified: `automation_visual`
  and `automation_screenshot` are in the permitted set).
- **MotionWorks**: `mw_ide_screenshot` for the IDE window.
- **Composition**: shoot at native resolution on the 1920×1080 display, then crop. Do not
  upscale. These are dark-theme UI shots; keep them on the site's `--dark-background`
  (`#0f141b`) so they sit in the page rather than on it.
- **Redaction pass**: identical to the fixture problem — check every shot for IPs,
  hostnames, customer names, paths and file names before publishing. The docs already
  require this for bug reports; apply it to marketing.

### 7.7 Assets to produce

```
assets/img/
  logix-viewer-full.png        1600x1000
  logix-ladder-detail.png      ~1200x700
  logix-approval-prompt.png    ~1200x800
  motionworks-ide.png          1600x1000
  motionworks-build.png        ~1400x900
  mcp-kill-switch.png          ~1400x900
  images-conversation.png      1600x1000
  logix-build-pass.png / logix-build-fail.png
  drawings-dxf.png
  better-sidebar.png
  plugin-market.png
  pet-overlay.png
```

WebP alongside PNG, `loading="lazy"`, explicit `width`/`height`, and real `alt` text that
describes what the screen shows (accessibility, and it is what the safety writing needs).

---

## 8. Suggested sequencing

| Step | Work | Depends on |
|---|---|---|
| 1 | Decide D1–D4 | you |
| 2 | Phase 1 truth pass → ship | 1 |
| 3 | Build the demo L5X + demo MotionWorks project | — (can start now) |
| 4 | Capture Tier 1 shots | 3 |
| 5 | Phase 2 IA + two flagship pages | 2, 4 |
| 6 | Capture Tier 2/3 | 2 |
| 7 | Phase 4 repo docs | 1 |
| 8 | Phase 5 verification | all |

Steps 3 can begin immediately and is the long pole for pictures.

---

## 9. Open questions

1. **D1–D4 above** — the copy cannot be written without them.
2. Should the site state the version number, or keep deferring to the releases page?
   (I recommend stating it; a version read from a feed cannot go stale.)
3. Do you want the "what it does not do yet" block to grow? It is a genuine differentiator
   and the two flagship pages each need one.
4. Is there a customer story or bench result you are willing to publish? The repo records
   a real bench upload and a Run → Program → Run mode change — publishing that as a
   dated, anonymised result would be strong.
5. Should I go ahead and **capture the Tier 1 shots** now (starting with the demo
   project and the Logix viewer), or do you want to review this plan first?
