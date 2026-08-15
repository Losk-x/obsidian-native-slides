import type NativeSlidesPlugin from "../main";
import { registerDebugCommand } from "./debug";
import { frontmatterOf } from "./mode";
import { DECK_KEY } from "./types";

/** Register every command; the debug command is dev-build only. */
export function registerCommands(plugin: NativeSlidesPlugin): void {
  // Toggle the properties bar
  plugin.addCommand({
    id: "ns-toggle-bar",
    name: "Toggle Properties Bar",
    callback: async () => {
      plugin.settings.barHidden = !plugin.settings.barHidden;
      await plugin.saveSettings();
      plugin.refresh();
    },
  });
  // Pause / resume auto-fullscreen in reading view
  plugin.addCommand({
    id: "ns-toggle-fullscreen",
    name: "Pause/Resume Auto Fullscreen",
    callback: async () => {
      plugin.settings.autoFullscreen = !plugin.settings.autoFullscreen;
      await plugin.saveSettings();
      // When paused, restore the layout immediately; when resumed, re-sync
      if (!plugin.settings.autoFullscreen) plugin.syncFullscreen(false);
      else plugin.refresh();
    },
  });
  // Previous / next page (deck navigation, rebindable in Settings → Hotkeys)
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
  // Toggle WYSIWYG mode — unified edit/reading typography (deck notes only)
  plugin.addCommand({
    id: "ns-toggle-wysiwyg",
    name: "Toggle WYSIWYG Mode",
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "E" }],
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      if (!file) return false;
      const fm = frontmatterOf(plugin.app, file);
      if (fm === null || !(DECK_KEY in fm)) return false;
      if (!checking) plugin.toggleWysiwyg();
      return true;
    },
  });
  // Debug tooling — registered only in dev builds (tree-shaken in release)
  if (DEV_MODE) registerDebugCommand(plugin);
}
