# CoBest visual website editor — Undo, Redo, Start over and phone editing

**Status:** Implemented in development on PR #25. Not yet deployed to the public https://cobest.me production site. Automated Chromium tests are not a replacement for testing on a physical phone.

## Edit your website from the start

1. Open a test website's **Website editor** in CoBest.
2. **Add** opens ready-made sections (hero, FAQ, and others) and elements such as headings, text, buttons and images.
3. **Drag** a ready-made section or element onto the canvas. A mouse works on desktop; on touch devices, press and hold briefly then drag. If dragging is difficult, **tap an Add item** to insert it safely, then arrange it in Layers.
4. Select the element or section to change it. Use **Style** to adjust design properties; use the responsive preview to check layout before publishing.
5. **Undo** reverses the latest edit; **Redo** repeats it. Desktop shortcuts: Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z or Ctrl+Y. On phones, use the toolbar buttons.
6. **Start over** replaces the **draft website design** with the CoBest starter design, retaining your site/project ID and name. A confirmation warning appears first. Immediately select **Undo** if you did not intend to reset. Your published site remains unchanged until you **Publish** again.
7. **Save** before leaving; **Dashboard** returns to your merchant dashboard, and attempts to save unsaved edits first. **Preview** opens the public-looking design without publishing.
8. If you want a different original template (Simple/Professional), return to the dashboard and select **Website themes**; this is separate from resetting the starter design.

## Phone editing controls

The narrow-screen editor opens at a phone-portrait breakpoint. A bottom toolbar provides:
- **Add** — tap to add or touch-and-drag a design block onto the page
- **Layers** — select/organize the elements of the page
- **Style** — open settings for the selected element
- **Undo** and **Redo** — history controls without a keyboard
- **Save** — manually persist changes

The header keeps **Dashboard**, **Start over**, **Preview** and **Publish** accessible. Editing panels open as drawers rather than permanently occupying the screen, leaving room to see the canvas. A touch drop closes the drawer so you can inspect the result.

The editor still supports a full website builder underneath these simpler controls. Some precise free-position movements can be hard on a small touchscreen; use a desktop for fine-grained layout work if needed. Actual iPhone Safari and Android Chrome testing is pending.

## Release and tests

- New Playwright coverage: `tests/e2e/editor-mobile.pw.ts` — phone controls, click-to-add, confirmed reset with Undo, Redo, Save, Preview and a touch drag gesture.
- Existing desktop keyboard, mouse drag, snapping, geometry and resize tests must continue passing.
- GitHub tracking: [issue #33](https://github.com/skionin123/cobestme/issues/33), [QA master #26](https://github.com/skionin123/cobestme/issues/26).
- We will test on a real phone after staging/controlled release and record any usability bugs in GitHub. Do not mark device-specific work PASS until observed.
