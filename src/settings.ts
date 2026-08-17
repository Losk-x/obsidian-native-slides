import { PluginSettingTab, Setting } from "obsidian";
import type NativeSlidesPlugin from "../main";
import { SLIDES_THEMES } from "./types";

/** Settings tab: toggles the nav buttons, page number, auto-enter and bar visibility. */
export class NativeSlidesSettingTab extends PluginSettingTab {
  constructor(private plugin: NativeSlidesPlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Native Slides · Settings" });

    new Setting(containerEl)
      .setName("Style template")
      .setDesc(
        "Built-in look for the Slides card and slides bar (border, background, shadow, bar styling). Every template adapts to light and dark themes.",
      )
      .addDropdown((dropdown) => {
        for (const t of SLIDES_THEMES) dropdown.addOption(t.id, t.label);
        dropdown.setValue(this.plugin.settings.slidesTheme).onChange(async (value) => {
          this.plugin.settings.slidesTheme = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        });
      });

    new Setting(containerEl)
      .setName("Show Previous/Next buttons")
      .setDesc(
        "Show ◀ ▶ buttons on the left of the slides bar when the note belongs to a deck (has a `deck` property)",
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
      .setName("Auto-enter Slides mode")
      .setDesc(
        "Open deck notes directly in Slides mode. Leave off to enter manually with the Toggle Slides Mode command (Mod+Shift+E) or the previous/next page hotkeys.",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoEnterSlides).onChange(async (value) => {
          this.plugin.settings.autoEnterSlides = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

    new Setting(containerEl)
      .setName("Slides title")
      .setDesc(
        "Frontmatter property to show as the card title (H1). Leave empty for none; type `filename` to use the file name.",
      )
      .addText((text) =>
        text
          .setPlaceholder("e.g. title")
          .setValue(this.plugin.settings.slidesTitle)
          .onChange(async (value) => {
            this.plugin.settings.slidesTitle = value;
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
