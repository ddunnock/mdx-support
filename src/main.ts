import { Plugin, TFile, normalizePath, Notice, addIcon } from 'obsidian';
import { MDXView, VIEW_TYPE_MDX } from './MDXView';
import { MDXPluginSettings, DEFAULT_SETTINGS, MDXSettingTab } from './settings';

// MDX icon SVGs - optimized with proper viewBox
const MDX_ICON_BW = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.79 7.12h22.42c0.436 0 0.79 0.355 0.79 0.792v8.176c0 0.436 -0.354 0.79 -0.79 0.79H0.79a0.79 0.79 0 0 1 -0.79 -0.79V7.912a0.79 0.79 0 0 1 0.79 -0.791V7.12Zm2.507 7.605v-3.122l1.89 1.89L7.12 11.56v3.122h1.055v-5.67l-2.99 2.99L2.24 9.056v5.67h1.055v-0.001Zm8.44 -1.845 -1.474 -1.473 -0.746 0.746 2.747 2.747 2.745 -2.747 -0.746 -0.746 -1.473 1.473v-4h-1.054v4Zm10.041 0.987 -2.175 -2.175 2.22 -2.22 -0.746 -0.746 -2.22 2.22 -2.22 -2.22 -0.747 0.746 2.22 2.22 -2.176 2.177 0.746 0.746 2.177 -2.177 2.176 2.175 0.745 -0.746Z" fill="currentColor"/>
</svg>`;

const MDX_ICON_COLOR = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill="#fcfcfc" d="M1.143745 7.274475H22.8557c0.423225 0 0.7663 0.343075 0.7663 0.7663V15.95925c0 0.423225 -0.343075 0.7663 -0.7663 0.7663H1.143745c-0.4232175 0 -0.7663025 -0.343075 -0.7663025 -0.7663V8.040775c0 -0.423225 0.343085 -0.7663 0.7663025 -0.7663Z"/>
<path fill="#e0e0e0" d="M1.1440225 7.146725H22.855975c0.49375 0 0.894025 0.400275 0.894025 0.894025v7.918475c0 0.49375 -0.400275 0.894025 -0.894025 0.894025H1.1440225C0.6502675 16.85325 0.25 16.452975 0.25 15.959225V8.04075c0 -0.49375 0.4002675 -0.894025 0.8940225 -0.894025Zm0 0.25545c-0.3526825 0 -0.6385875 0.2859 -0.6385875 0.638575v7.918475c0 0.352675 0.285905 0.6386 0.6385875 0.6386H22.855975c0.352675 0 0.6386 -0.285925 0.6386 -0.6386V8.04075c0 -0.352675 -0.285925 -0.638575 -0.6386 -0.638575H1.1440225Z"/>
<path fill="#1a1a1a" d="m12.766475 8.99195 -0.00005 3.896575 1.4313 -1.431025 0.72245 0.7225L12.2745 14.8255 9.59545 12.14645l0.7225 -0.722475 1.426725 1.426725 0.000075 -3.85875h1.021725Z"/>
<path fill="#1a1a1a" d="M3.562025 14.627175V11.609475l1.847625 1.84775 1.861625 -1.8615v3.000975h1.02175V9.12915L5.4097 12.012275 2.540275 9.14265v5.484525h1.02175Z"/>
<path fill="#f9ac00" d="m20.8052 8.828975 0.72245 0.7225 -2.164075 2.163975 2.0975 2.097575 -0.722475 0.7225 -2.097575 -2.097525 -2.097575 2.097525 -0.722475 -0.7225 2.09735 -2.097575 -2.163925 -2.163975 0.72245 -0.7225 2.164175 2.16395 2.164175 -2.16395Z"/>
</svg>`;

export default class MDXPlugin extends Plugin {
    settings!: MDXPluginSettings;

    async onload() {
        // Register custom MDX icons
        addIcon('mdx-bw', MDX_ICON_BW);
        addIcon('mdx-color', MDX_ICON_COLOR);

        await this.loadSettings();

        // Register the MDX view
        this.registerView(
            VIEW_TYPE_MDX,
            (leaf) => new MDXView(leaf, this)
        );

        // Register .mdx file extension - use VIEW_TYPE_MDX if autoOpenMDX is enabled, otherwise markdown
        if (this.settings.autoOpenMDX) {
            this.registerExtensions(['mdx'], VIEW_TYPE_MDX);
        } else {
            this.registerExtensions(['mdx'], 'markdown');
        }

        // Add ribbon icon to create new MDX file
        this.addRibbonIcon('mdx-bw', 'New mdx file', () => {
            void this.createNewMDXFile();
        });

        // Add command to preview MDX file (for when auto-open is disabled)
        this.addCommand({
            id: 'preview-mdx',
            name: 'Preview mdx',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file && file.extension === 'mdx') {
                    if (!checking) {
                        void this.openMDXPreview(file);
                    }
                    return true;
                }
                return false;
            }
        });

        // Add command to create new MDX file
        this.addCommand({
            id: 'new-mdx-file',
            name: 'New mdx file',
            callback: () => {
                void this.createNewMDXFile();
            }
        });

        // Add command to edit MDX source
        this.addCommand({
            id: 'edit-mdx-source',
            name: 'Edit mdx source',
            checkCallback: (checking: boolean) => {
                const file = this.app.workspace.getActiveFile();
                if (file && file.extension === 'mdx') {
                    if (!checking) {
                        void this.editMDXSource(file);
                    }
                    return true;
                }
                return false;
            }
        });

        // Add settings tab
        this.addSettingTab(new MDXSettingTab(this.app, this));

        // Register file menu event
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file instanceof TFile && file.extension === 'mdx') {
                    menu.addItem((item) => {
                        item
                            .setTitle('Preview as mdx')
                            .setIcon('mdx-color')
                            .onClick(async () => {
                                await this.openMDXPreview(file);
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle('Edit mdx source')
                            .setIcon('mdx-bw')
                            .onClick(async () => {
                                await this.editMDXSource(file);
                            });
                    });
                }

                // Add "New MDX file" to folder context menus
                menu.addItem((item) => {
                    item
                        .setTitle('New mdx file')
                        .setIcon('mdx-bw')
                        .onClick(async () => {
                            let folder: string;
                            if (file instanceof TFile && file.parent) {
                                folder = file.parent.path;
                            } else {
                                folder = file.path;
                            }
                            await this.createNewMDXFile(folder);
                        });
                });
            })
        );
    }

    /**
     * Create a new MDX file
     */
    async createNewMDXFile(folder?: string) {
        if (!folder) {
            const activeFile = this.app.workspace.getActiveFile();
            folder = this.app.fileManager.getNewFileParent(activeFile?.path || '').path;
        }

        let filename = normalizePath(`${folder}/Untitled.mdx`);

        // If file exists, increment number
        if (this.fileExists(filename)) {
            let iter = 1;
            while (true) {
                filename = normalizePath(`${folder}/Untitled ${iter}.mdx`);
                if (!this.fileExists(filename)) {
                    break;
                }
                iter++;
            }
        }

        try {
            const file = await this.app.vault.create(filename, '# New mdx file\n\nStart writing your mdx content here...\n');
            new Notice(`Created ${file.name}`);

            // Open the new file
            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(file, { active: true });
        } catch (error) {
            new Notice(`Failed to create mdx file: ${error instanceof Error ? error.message : String(error)}`);
            console.error('Error creating MDX file:', error);
        }
    }

    /**
     * Check if a file exists
     */
    fileExists(filepath: string): boolean {
        return this.app.vault.getAbstractFileByPath(filepath) !== null;
    }

    /**
     * Open MDX preview for a file
     */
    async openMDXPreview(file: TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file, { active: true });
    }

    /**
     * Edit MDX source code in markdown mode
     */
    async editMDXSource(file: TFile) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.setViewState({
            type: 'markdown',
            state: { file: file.path, mode: 'source' }
        });
    }

    onunload() {
        // Plugin cleanup
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}