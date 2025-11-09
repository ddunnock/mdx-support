import { ItemView, TFile, WorkspaceLeaf, ViewStateResult } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import * as React from 'react';
import { MDXRenderer } from './MDXRenderer';
import MDXPlugin from './main';

export const VIEW_TYPE_MDX = 'mdx-view';

interface MDXViewState extends Record<string, unknown> {
    file?: string;
}

export class MDXView extends ItemView {
    plugin: MDXPlugin;
    file: TFile | null = null;
    root: Root | null = null;
    containerEl!: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: MDXPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_MDX;
    }

    getDisplayText(): string {
        return this.file?.basename ?? 'mdx view';
    }

    getIcon(): string {
        return 'mdx-color';
    }

    async setState(state: MDXViewState, result: ViewStateResult): Promise<void> {
        if (state.file) {
            const file = this.app.vault.getAbstractFileByPath(state.file);
            if (file instanceof TFile) {
                this.file = file;
                await this.renderMDX();
            }
        }

        await super.setState(state, result);
    }

    getState(): MDXViewState {
        const state: MDXViewState = {
            file: this.file?.path
        };
        return state;
    }

    onOpen(): Promise<void> {
        this.containerEl = this.contentEl.createDiv({ cls: 'mdx-view-container' });

        // Watch for file changes
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (file === this.file) {
                    void this.renderMDX();
                }
            })
        );

        return Promise.resolve();
    }

    onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
        }

        return Promise.resolve();
    }

    async renderMDX() {
        if (!this.file) return;

        try {
            const content = await this.app.vault.read(this.file);

            // Clear previous render
            if (this.root) {
                this.root.unmount();
            }

            this.containerEl.empty();

            // Create new root and render
            this.root = createRoot(this.containerEl);
            this.root.render(
                React.createElement(MDXRenderer, {
                    content,
                    settings: this.plugin.settings,
                    filePath: this.file.path,
                    app: this.app
                })
            );
        } catch (error) {
            this.containerEl.empty();
            this.containerEl.createEl('div', {
                text: `Error rendering mdx: ${error instanceof Error ? error.message : String(error)}`,
                cls: 'mdx-error'
            });
        }
    }
}