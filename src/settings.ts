import { App, PluginSettingTab, Setting } from 'obsidian';
import MDXPlugin from './main';

export interface MDXPluginSettings {
    enableJSX: boolean;
    allowHTMLTags: boolean;
    theme: 'light' | 'dark' | 'auto';
    customComponents: Record<string, string>;
    autoOpenMDX: boolean;
    enableSyntaxHighlight: boolean;
}

export const DEFAULT_SETTINGS: MDXPluginSettings = {
    enableJSX: true,
    allowHTMLTags: true,
    theme: 'auto',
    customComponents: {},
    autoOpenMDX: true,
    enableSyntaxHighlight: true
};

export class MDXSettingTab extends PluginSettingTab {
    plugin: MDXPlugin;

    constructor(app: App, plugin: MDXPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('File behavior')
            .setHeading();

        new Setting(containerEl)
            .setName('Auto-open MDX files')
            .setDesc('Automatically render MDX files when clicked. If disabled, use the command palette to preview.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoOpenMDX)
                .onChange(async (value) => {
                    this.plugin.settings.autoOpenMDX = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Rendering')
            .setHeading();

        new Setting(containerEl)
            .setName('Enable JSX')
            .setDesc('Allow JSX components in MDX files.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableJSX)
                .onChange(async (value) => {
                    this.plugin.settings.enableJSX = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Allow HTML tags')
            .setDesc('Allow raw HTML tags in MDX content.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.allowHTMLTags)
                .onChange(async (value) => {
                    this.plugin.settings.allowHTMLTags = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Theme')
            .setDesc('Select the theme for MDX rendering.')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'auto')
                .addOption('light', 'light')
                .addOption('dark', 'dark')
                .setValue(this.plugin.settings.theme)
                .onChange(async (value) => {
                    this.plugin.settings.theme = value as 'light' | 'dark' | 'auto';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable syntax highlighting')
            .setDesc('Enable syntax highlighting for code blocks in MDX.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableSyntaxHighlight)
                .onChange(async (value) => {
                    this.plugin.settings.enableSyntaxHighlight = value;
                    await this.plugin.saveSettings();
                }));
    }
}