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
      .setName("Show slides bar")
      .setDesc("Master toggle for the entire slides bar at the bottom of the window")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showSlidesBar).onChange(async (value) => {
          this.plugin.settings.showSlidesBar = value;
          await this.plugin.saveSettings();
          this.plugin.refresh();
        }),
      );

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
      .setName("Page number style")
      .setDesc(
        'Shown at the bottom-right. "N / Total": overview = page 0, content from 1, total excludes overview. "N": just the current page number. "None": hidden.',
      )
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            fraction: "N / Total",
            current: "N",
            none: "None",
          })
          .setValue(this.plugin.settings.pageNumberStyle)
          .onChange(async (value) => {
            this.plugin.settings.pageNumberStyle = value as "fraction" | "current" | "none";
            await this.plugin.saveSettings();
            this.plugin.refresh();
          }),
      );

    new Setting(containerEl)
      .setName("Show progress bar")
      .setDesc(
        "Discrete clickable segments at the top of the slides bar -- one per slide, click to jump",
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showProgress).onChange(async (value) => {
          this.plugin.settings.showProgress = value;
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
      .setName("Escape exits Slides mode")
      .setDesc("Press Escape to leave Slides mode and return to the previous view")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.escExitsSlides).onChange(async (value) => {
          this.plugin.settings.escExitsSlides = value;
          await this.plugin.saveSettings();
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
      .setName("Bar properties")
      .setDesc(
        "Comma-separated frontmatter property names to show in the slides bar (e.g. `university, short-title, date`). Each value fills an equal-width column; drag dividers to resize. Leave empty to show nothing.",
      )
      .addText((text) =>
        text
          .setPlaceholder("e.g. university, date")
          .setValue(this.plugin.settings.barProperties)
          .onChange(async (value) => {
            this.plugin.settings.barProperties = value;
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
