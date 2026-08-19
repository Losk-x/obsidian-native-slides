import type NativeSlidesPlugin from "../main";
import { Notice } from "obsidian";
import { registerDebugCommand } from "./debug";
import { frontmatterOf } from "./mode";
import { DECK_KEY } from "./types";

/** Register every command; the debug command is dev-build only. */
export function registerCommands(plugin: NativeSlidesPlugin): void {
  // Toggle the slides bar (within Slides mode)
  plugin.addCommand({
    id: "ns-toggle-bar",
    name: "Toggle slides bar",
    callback: async () => {
      plugin.settings.barHidden = !plugin.settings.barHidden;
      await plugin.saveSettings();
      plugin.refresh();
    },
  });
  // New Slides Deck — create an overview note with Base filter and instructions
  plugin.addCommand({
    id: "ns-new-deck",
    name: "New slides deck",
    callback: async () => {
      // Find a unique name for the overview note
      let baseName = "untitled-overview";
      let counter = 1;
      while (plugin.app.vault.getAbstractFileByPath(`${baseName}.md`)) {
        baseName = `untitled-overview-${counter}`;
        counter++;
      }

      // Create overview note with template
      const template = `---
deck: ["[[run-create-next-slide-command-to-create-first-slide]]"]
---

# Overview

This is the **overview page** of your deck. The \`deck\` property has a placeholder link — run the **Create Next Slide** command to create your first slide automatically.

## Base view: all slides

\`\`\`base
filters:
  and:
    - file.hasLink("${baseName}")
    - "!deck.isEmpty()"
views:
  - type: table
    name: Slides
\`\`\`

> If the Base view does not render: enable the core **Bases** plugin
> (_Settings → Core plugins → Bases_), then reload this note.

## How to add slides

1. **Create the first slide:** Run the **Create Next Slide** command (\`Cmd/Ctrl+Shift+P\` → "Create Next Slide") — a new slide is created after this overview, and the \`deck\` property is rewired automatically.
2. **Add more slides:** Open any slide and run **Create Next Slide** again — each run appends a new slide after the current one.
3. **Enter Slides mode:** Open any slide and press \`Cmd/Ctrl+Shift+E\` to enter the immersive card view.

**Convention for the \`deck\` property** (one property, up to two links):

- **Overview page:** \`deck: ["[[first-slide]]"]\` — one link = the first page.
- **Slide page:** \`deck: ["[[overview]]", "[[next-slide]]"]\` — first link = the overview page, second link = the next slide (omit it on the last slide).

Page numbers are computed automatically by walking these links, so no \`page-number\` property is needed.
`;

      try {
        const file = await plugin.app.vault.create(`${baseName}.md`, template);
        const leaf = plugin.app.workspace.getLeaf(false);
        await leaf.openFile(file, { state: { mode: "source" } });
        new Notice(`Native Slides: Created "${baseName}.md"`);
      } catch (error) {
        new Notice(`Native Slides: could not create "${baseName}.md" (${String(error)})`);
      }
    },
  });
  // Hide / show the mouse pointer window-wide (presenting; Slides mode only)
  plugin.addCommand({
    id: "ns-toggle-pointer",
    name: "Toggle mouse pointer",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "M" }],
    checkCallback: (checking) => {
      if (!document.body.classList.contains("native-slides-mode")) return false;
      if (!checking) plugin.togglePointer();
      return true;
    },
  });
  // Previous / next page (deck navigation; entering Slides mode as needed)
  plugin.addCommand({
    id: "ns-prev",
    name: "Previous page",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
    callback: () => plugin.navigate("prev"),
  });
  plugin.addCommand({
    id: "ns-next",
    name: "Next page",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
    callback: () => plugin.navigate("next"),
  });
  // Create Next Slide — new slide after the current one (deck notes only)
  plugin.addCommand({
    id: "ns-create-next",
    name: "Create next slide",
    // Greyed out in the palette unless the active note can take a next slide
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) return false;
      const plan = plugin.deckService.planCreateNext(file);
      if (!plan) return false;
      if (!checking) void plugin.deckService.executeCreateNext(file, plan);
      return true;
    },
  });
  // Toggle Slides mode — the immersive card view (deck notes only)
  plugin.addCommand({
    id: "ns-toggle-slides",
    name: "Toggle slides mode",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "E" }],
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) return false;
      const fm = frontmatterOf(plugin.app, file);
      if (fm === null || !(DECK_KEY in fm)) return false;
      if (!checking) plugin.toggleSlides();
      return true;
    },
  });
  // Debug tooling — registered only in dev builds (tree-shaken in release)
  if (DEV_MODE) registerDebugCommand(plugin);
}
