import { App, PluginSettingTab, Setting } from 'obsidian';
import MDXPlugin from './main';

export interface MDXPluginSettings {
    enableJSX: boolean;
    allowHTMLTags: boolean;
    theme: 'light' | 'dark' | 'auto';
    customComponents: Record<string, string>;
    autoOpenMDX: boolean;
    enableSyntaxHighlight: boolean;
    // Storybook code snippet preferences
    preferredLanguage: 'js' | 'ts';
    preferredRenderer: string;
}

export const DEFAULT_SETTINGS: MDXPluginSettings = {
    enableJSX: true,
    allowHTMLTags: true,
    theme: 'auto',
    customComponents: {},
    autoOpenMDX: true,
    enableSyntaxHighlight: true,
    preferredLanguage: 'ts',
    preferredRenderer: 'react'
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
            .setName('Auto-open mdx files')
            .setDesc('Automatically render mdx files when clicked. If disabled, use the command palette to preview.')
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
            .setName('Enable jsx')
            .setDesc('Allow jsx components in mdx files.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableJSX)
                .onChange(async (value) => {
                    this.plugin.settings.enableJSX = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Allow HTML tags')
            .setDesc('Allow raw HTML tags in mdx content.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.allowHTMLTags)
                .onChange(async (value) => {
                    this.plugin.settings.allowHTMLTags = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Theme')
            .setDesc('Select the theme for mdx rendering.')
            .addDropdown(dropdown => dropdown
                .addOption('auto', 'Auto')
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .setValue(this.plugin.settings.theme)
                .onChange(async (value) => {
                    this.plugin.settings.theme = value as 'light' | 'dark' | 'auto';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable syntax highlighting')
            .setDesc('Enable syntax highlighting for code blocks in mdx.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableSyntaxHighlight)
                .onChange(async (value) => {
                    this.plugin.settings.enableSyntaxHighlight = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Storybook Code Snippets')
            .setHeading();

        new Setting(containerEl)
            .setName('Preferred language')
            .setDesc('Default language for Storybook code snippets (JavaScript or TypeScript).')
            .addDropdown(dropdown => dropdown
                .addOption('ts', 'TypeScript')
                .addOption('js', 'JavaScript')
                .setValue(this.plugin.settings.preferredLanguage)
                .onChange(async (value) => {
                    this.plugin.settings.preferredLanguage = value as 'js' | 'ts';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preferred framework')
            .setDesc('Default framework for Storybook code snippets.')
            .addDropdown(dropdown => dropdown
                .addOption('react', 'React')
                .addOption('vue', 'Vue')
                .addOption('angular', 'Angular')
                .addOption('svelte', 'Svelte')
                .addOption('web-components', 'Web Components')
                .addOption('common', 'All/Common')
                .setValue(this.plugin.settings.preferredRenderer)
                .onChange(async (value) => {
                    this.plugin.settings.preferredRenderer = value;
                    await this.plugin.saveSettings();
                }));
    }
}
