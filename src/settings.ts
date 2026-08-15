import { PluginSettingTab, Setting } from "obsidian";
import type NativeSlidesPlugin from "../main";

/** Settings tab: toggles the nav buttons, page number, auto-fullscreen and WYSIWYG mode. */
export class NativeSlidesSettingTab extends PluginSettingTab {
  constructor(private plugin: NativeSlidesPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Properties Bar · Settings" });

    new Setting(containerEl)
      .setName("Show Previous/Next buttons")
      .setDesc(
        "Show ◀ ▶ buttons on the left of the bar when the note belongs to a deck (has a `deck` property)",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showNavButtons).onChange(async (value) => {
          this.plugin.settings.showNavButtons = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Show page number")
      .setDesc(
        "Auto-computed from the deck chain (overview page shows “Overview”); shown at the bottom-right",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showPageNumber).onChange(async (value) => {
          this.plugin.settings.showPageNumber = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Auto fullscreen in reading view")
      .setDesc(
        "Enter the immersive fullscreen reading mode automatically when switching to reading view (also toggleable via the Pause/Resume Auto Fullscreen command)",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoFullscreen).onChange(async (value) => {
          this.plugin.settings.autoFullscreen = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("WYSIWYG mode (deck notes)")
      .setDesc(
        "Immersive deck mode: hides the tab bar and sidebars, shows the bottom bar at tab-bar height in both views, and hides in-note properties while editing. Toggle from the command palette, the Mod+Shift+E hotkey, or the bottom-bar button.",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.wysiwygMode).onChange(async (value) => {
          this.plugin.settings.wysiwygMode = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Navigation hotkeys")
      .setDesc(
        "Default: Previous Page Mod+Shift+←, Next Page Mod+Shift+→. Rebind under Settings → Hotkeys.",
      )
      .addButton((button) =>
        button.setButtonText("Open Hotkeys Settings").onClick(() => {
          // Open Obsidian's hotkeys settings page (internal API; ignore failures)
          (
            this.app as unknown as { setting?: { openTabById?: (id: string) => void } }
          ).setting?.openTabById?.("hotkeys");
        }),
      );
  }
}
