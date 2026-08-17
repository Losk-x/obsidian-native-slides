import type NativeSlidesPlugin from "../main";
import { registerDebugCommand } from "./debug";
import { frontmatterOf } from "./mode";
import { DECK_KEY } from "./types";

/** Register every command; the debug command is dev-build only. */
export function registerCommands(plugin: NativeSlidesPlugin): void {
  // Toggle the slides bar (within Slides mode)
  plugin.addCommand({
    id: "ns-toggle-bar",
    name: "Toggle Slides Bar",
    callback: async () => {
      plugin.settings.barHidden = !plugin.settings.barHidden;
      await plugin.saveSettings();
      plugin.refresh();
    },
  });
  // Hide / show the mouse pointer window-wide (presenting; Slides mode only)
  plugin.addCommand({
    id: "ns-toggle-pointer",
    name: "Toggle Mouse Pointer",
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
    name: "Previous Page",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowLeft" }],
    callback: () => plugin.navigate("prev"),
  });
  plugin.addCommand({
    id: "ns-next",
    name: "Next Page",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "ArrowRight" }],
    callback: () => plugin.navigate("next"),
  });
  // Create Next Slide — new slide after the current one (deck notes only)
  plugin.addCommand({
    id: "ns-create-next",
    name: "Create Next Slide",
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
    name: "Toggle Slides Mode",
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
