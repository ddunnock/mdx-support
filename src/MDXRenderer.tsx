import * as React from 'react';
import { useEffect, useState } from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import { App } from 'obsidian';
import { MDXPluginSettings } from './settings';

// Helper to strip frontmatter from MDX content
function stripFrontmatter(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    return content.replace(frontmatterRegex, '');
}

// Helper to convert Obsidian wikilinks to markdown
function convertWikilinks(content: string): string {
    // Convert image wikilinks: ![[image.png]] or ![[image.png|alt text]]
    content = content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, path, alt) => {
        return `![${alt || ''}](${path})`;
    });

    // Convert regular wikilinks: [[link]] or [[link|display text]]
    content = content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, path, display) => {
        return `[${display || path}](${path})`;
    });

    return content;
}

interface MDXRendererProps {
    content: string;
    settings: MDXPluginSettings;
    filePath: string;
    app: App;
}

// Context to pass filePath and app to components
const FilePathContext = React.createContext<string>('');
const AppContext = React.createContext<App | null>(null);

// Default components that can be used in MDX
const defaultComponents = {
    Alert: ({ children, type = 'info' }: { children: React.ReactNode; type?: string }) => (
        <div className={`mdx-alert mdx-alert-${type}`}>
            {children}
        </div>
    ),
    Callout: ({ children, title, variant, icon }: {
        children: React.ReactNode;
        title?: string;
        variant?: string;
        icon?: string;
    }) => (
        <div className={`mdx-callout ${variant ? `mdx-callout-${variant}` : ''}`}>
            {(title || icon) && (
                <div className="mdx-callout-title">
                    {icon && <span className="mdx-callout-icon">{icon}</span>}
                    {title}
                </div>
            )}
            <div className="mdx-callout-content">{children}</div>
        </div>
    ),
    Counter: () => {
        const [count, setCount] = useState(0);
        return (
            <div className="mdx-counter">
                <button onClick={() => setCount(count - 1)}>-</button>
                <span>{count}</span>
                <button onClick={() => setCount(count + 1)}>+</button>
            </div>
        );
    },
    // Storybook-specific components
    CodeSnippets: ({ path }: { path: string }) => {
        const currentFilePath = React.useContext(FilePathContext);
        const app = React.useContext(AppContext);
        const [snippets, setSnippets] = useState<Array<{ code: string; language: string; filename: string; renderer: string; tabTitle: string }>>([]);
        const [activeTab, setActiveTab] = useState(0);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string>('');

        useEffect(() => {
            const loadSnippet = async () => {
                if (!app) {
                    setError('App instance not available');
                    setLoading(false);
                    return;
                }

                // Try multiple resolution strategies
                const pathsToTry: string[] = [];

                if (path.startsWith('/')) {
                    pathsToTry.push(path.substring(1));
                } else if (currentFilePath) {
                    const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
                    const parts = currentDir.split('/');

                    for (let i = parts.length; i >= 0; i--) {
                        const basePath = parts.slice(0, i).join('/');
                        pathsToTry.push(basePath ? `${basePath}/_snippets/${path}` : `_snippets/${path}`);
                    }

                    const relativeParts = [...parts];
                    const pathParts = path.split('/');
                    for (const part of pathParts) {
                        if (part === '..') {
                            relativeParts.pop();
                        } else if (part !== '.') {
                            relativeParts.push(part);
                        }
                    }
                    pathsToTry.push(relativeParts.join('/'));
                }

                let success = false;
                let lastError = '';
                for (const tryPath of pathsToTry) {
                    try {
                        const fileContent = await app.vault.adapter.read(tryPath);

                        // Parse code blocks from markdown
                        const codeBlockRegex = /```(\w+)\s+([^\n]*)\n([\s\S]*?)```/g;
                        const parsedSnippets: typeof snippets = [];
                        let match;

                        while ((match = codeBlockRegex.exec(fileContent)) !== null) {
                            const language = match[1];
                            const metadata = match[2];
                            const code = match[3].trim();

                            // Parse metadata
                            const filenameMatch = metadata.match(/filename="([^"]+)"/);
                            const rendererMatch = metadata.match(/renderer="([^"]+)"/);
                            const tabTitleMatch = metadata.match(/tabTitle="([^"]+)"/);

                            parsedSnippets.push({
                                code,
                                language,
                                filename: filenameMatch ? filenameMatch[1] : '',
                                renderer: rendererMatch ? rendererMatch[1] : '',
                                tabTitle: tabTitleMatch ? tabTitleMatch[1] : '',
                            });
                        }

                        if (parsedSnippets.length > 0) {
                            setSnippets(parsedSnippets);
                        } else {
                            setError('No code snippets found in file');
                        }

                        success = true;
                        break;
                    } catch (err) {
                        lastError = err instanceof Error ? err.message : String(err);
                    }
                }

                if (!success) {
                    setError(`Could not load: ${path}\nLast error: ${lastError}`);
                }
                setLoading(false);
            };
            void loadSnippet();
        }, [path, currentFilePath]);

        if (loading) {
            return <div className="mdx-code-snippets loading">Loading snippets...</div>;
        }

        if (error) {
            return <div className="mdx-code-snippets error">{error}</div>;
        }

        if (snippets.length === 0) {
            return <div className="mdx-code-snippets">No snippets found</div>;
        }

        const currentSnippet = snippets[activeTab];

        return (
            <div className="mdx-code-snippets">
                {/* Tabs */}
                <div className="mdx-code-snippets-tabs">
                    {snippets.map((snippet, index) => {
                        const label = snippet.tabTitle || snippet.renderer || snippet.filename || `Tab ${index + 1}`;
                        return (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                className={`mdx-code-snippet-tab ${activeTab === index ? 'mdx-code-snippet-tab-active' : ''}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Code display */}
                <div>
                    {currentSnippet.filename && (
                        <div className="mdx-code-snippet-filename">
                            {currentSnippet.filename}
                        </div>
                    )}
                    <pre className="mdx-code-snippet-content">
                        <code>{currentSnippet.code}</code>
                    </pre>
                </div>
            </div>
        );
    },
    IfRenderer: ({ children, renderer }: { children: React.ReactNode; renderer?: string }) => (
        <div className="mdx-if-renderer">
            {children}
        </div>
    ),
    If: ({ children, notRenderer }: { children: React.ReactNode; notRenderer?: string }) => (
        <div className="mdx-if">
            {children}
        </div>
    ),
    Video: (props: { src?: string; autoPlay?: boolean; loop?: boolean; muted?: boolean; children?: React.ReactNode }) => {
        const currentFilePath = React.useContext(FilePathContext);
        const app = React.useContext(AppContext);
        const [resolvedSrc, setResolvedSrc] = useState<string>('');

        useEffect(() => {
            const resolveVideoPath = async () => {
                if (!props.src) {
                    setResolvedSrc('');
                    return;
                }

                // External URLs (http/https) - use as-is
                if (props.src.startsWith('http://') || props.src.startsWith('https://')) {
                    setResolvedSrc(props.src);
                    return;
                }

                if (!app) {
                    setResolvedSrc(props.src);
                    return;
                }

                const pathsToTry: string[] = [];

                // Strategy 1: Absolute path from vault root
                if (props.src.startsWith('/')) {
                    pathsToTry.push(props.src.substring(1));
                }
                // Strategy 2: Relative paths - try parent directories first
                else if (currentFilePath) {
                    const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));

                    // Handle ../ and ./ navigation
                    if (props.src.startsWith('./') || props.src.startsWith('../')) {
                        const parts = currentDir.split('/').filter(p => p);
                        const pathParts = props.src.split('/');

                        for (const part of pathParts) {
                            if (part === '..') {
                                parts.pop();
                            } else if (part !== '.') {
                                parts.push(part);
                            }
                        }
                        pathsToTry.push(parts.join('/'));
                    } else {
                        // Try in parent directories (walk up the tree) - most specific first
                        const parts = currentDir.split('/').filter(p => p);
                        for (let i = parts.length; i > 0; i--) {
                            const basePath = parts.slice(0, i).join('/');
                            const fullPath = `${basePath}/${props.src}`;
                            pathsToTry.push(fullPath);
                        }
                        // Finally try vault root
                        pathsToTry.push(props.src);
                    }
                } else {
                    // No current file path, just try vault root
                    pathsToTry.push(props.src);
                }

                // Check which path actually exists using direct lookups
                let resolvedPath = pathsToTry[0]; // Default to first path

                for (const tryPath of pathsToTry) {
                    const file = app.vault.getAbstractFileByPath(tryPath);
                    if (file) {
                        resolvedPath = tryPath;
                        break;
                    }
                }

                const resourcePath = app.vault.adapter.getResourcePath(resolvedPath);
                setResolvedSrc(resolvedPath);
            };

            void resolveVideoPath();
        }, [props.src, currentFilePath]);

        if (!props.src) {
            return (
                <div className="mdx-video-placeholder">
                    Video source not provided
                </div>
            );
        }

        // Check if it's a YouTube/Vimeo URL
        const isYouTube = props.src.includes('youtube.com') || props.src.includes('youtu.be');
        const isVimeo = props.src.includes('vimeo.com');

        if (isYouTube || isVimeo) {
            // Embed iframe for YouTube/Vimeo
            let embedSrc = props.src;
            if (isYouTube) {
                const videoId = props.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
                embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : props.src;
            } else if (isVimeo) {
                const videoId = props.src.match(/vimeo\.com\/(\d+)/)?.[1];
                embedSrc = videoId ? `https://player.vimeo.com/video/${videoId}` : props.src;
            }

            return (
                <div className="mdx-video-container">
                    <iframe
                        src={embedSrc}
                        className="mdx-video-iframe"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }

        // Direct video file with resolved path
        return (
            <div className="mdx-video-container">
                <video
                    src={resolvedSrc}
                    controls
                    autoPlay={props.autoPlay}
                    loop={props.loop}
                    muted={props.muted}
                    className="mdx-video-element"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    },
    // Custom img component to handle relative paths and wikilinks
    img: (props: { src?: string; alt?: string; title?: string }) => {
        const currentFilePath = React.useContext(FilePathContext);
        const app = React.useContext(AppContext);
        const [resolvedSrc, setResolvedSrc] = useState<string>('');

        useEffect(() => {
            const resolveImagePath = async () => {
                if (!props.src) {
                    setResolvedSrc('');
                    return;
                }

                // External URLs and data URIs - use as-is
                if (props.src.startsWith('http://') || props.src.startsWith('https://') || props.src.startsWith('data:')) {
                    setResolvedSrc(props.src);
                    return;
                }

                if (!app) {
                    setResolvedSrc(props.src);
                    return;
                }

                // For wikilink-style paths (just filename, no path separators) - use metadataCache
                if (!props.src.includes('/')) {
                    try {
                        // Use Obsidian's metadata cache to resolve wikilinks
                        const file = app.metadataCache.getFirstLinkpathDest(props.src, currentFilePath);

                        if (file) {
                            const resourcePath = app.vault.adapter.getResourcePath(file.path);
                            setResolvedSrc(resourcePath);
                            return;
                        }
                    } catch {
                        // Fall through to path resolution
                    }
                }

                // Try multiple path resolution strategies
                const pathsToTry: string[] = [];

                // Strategy 1: Absolute path from vault root
                if (props.src.startsWith('/')) {
                    pathsToTry.push(props.src.substring(1));
                }
                // Strategy 2: Relative paths - try parent directories first
                else if (currentFilePath) {
                    const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));

                    // Handle ../ and ./ navigation
                    if (props.src.startsWith('./') || props.src.startsWith('../')) {
                        const parts = currentDir.split('/').filter(p => p);
                        const pathParts = props.src.split('/');

                        for (const part of pathParts) {
                            if (part === '..') {
                                parts.pop();
                            } else if (part !== '.') {
                                parts.push(part);
                            }
                        }
                        pathsToTry.push(parts.join('/'));
                    } else {
                        // Try in parent directories (walk up the tree) - most specific first
                        const parts = currentDir.split('/').filter(p => p);
                        for (let i = parts.length; i > 0; i--) {
                            const basePath = parts.slice(0, i).join('/');
                            const fullPath = `${basePath}/${props.src}`;
                            pathsToTry.push(fullPath);
                        }
                        // Finally try vault root
                        pathsToTry.push(props.src);
                    }
                } else {
                    // No current file path, just try vault root
                    pathsToTry.push(props.src);
                }

                // Check which path actually exists using direct lookups
                let resolvedPath = pathsToTry[0]; // Default to first path

                for (const tryPath of pathsToTry) {
                    const file = app.vault.getAbstractFileByPath(tryPath);
                    if (file) {
                        resolvedPath = tryPath;
                        break;
                    }
                }

                const resourcePath = app.vault.adapter.getResourcePath(resolvedPath);
                setResolvedSrc(resolvedPath);
            };

            void resolveImagePath();
        }, [props.src, currentFilePath]);

        return (
            <img
                src={resolvedSrc}
                alt={props.alt || ''}
                title={props.title}
            />
        );
    },
    // Table components for markdown tables
    table: ({ children }: { children: React.ReactNode }) => (
        <div className="mdx-table-wrapper">
            <table>
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
        <thead>
            {children}
        </thead>
    ),
    tbody: ({ children }: { children: React.ReactNode }) => (
        <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
        <tr>
            {children}
        </tr>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
        <th>
            {children}
        </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
        <td>
            {children}
        </td>
    ),
};

// Create a Proxy to handle undefined components gracefully
const componentsWithFallback = new Proxy(defaultComponents, {
    get(target, prop: string) {
        if (prop in target) {
            return target[prop as keyof typeof target];
        }
        // Return a fallback component for undefined components
        return (props: { children?: React.ReactNode }) => (
            <div className="mdx-component-placeholder">
                <div className="mdx-component-placeholder-title">⚠️ Component `{prop}` not available</div>
                <div className="mdx-component-placeholder-description">
                    This component is not defined in the preview.
                </div>
                {props.children && <div className="mdx-component-placeholder-children">{props.children}</div>}
            </div>
        );
    }
});

type MDXComponent = React.ComponentType<{ components?: Record<string, React.ComponentType<Record<string, unknown>>> }>;

export const MDXRenderer: React.FC<MDXRendererProps> = ({ content, settings, filePath, app }) => {
    const [Component, setComponent] = useState<MDXComponent | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const compileMDX = async () => {
            try {
                // Strip frontmatter before compiling
                let processedContent = stripFrontmatter(content);

                // Convert Obsidian wikilinks to markdown
                processedContent = convertWikilinks(processedContent);

                // Evaluate MDX - this compiles and runs it in one step
                const { default: MDXContent } = await evaluate(processedContent, {
                    ...runtime,
                    development: false,
                    remarkPlugins: [remarkGfm],
                    useMDXComponents: () => componentsWithFallback as unknown as Record<string, React.ComponentType<Record<string, unknown>>>,
                });

                setComponent(() => MDXContent);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                setComponent(null);
            }
        };

        void compileMDX();
    }, [content, settings, filePath]);

    if (error) {
        return (
            <div className="mdx-error">
                <h3>Error compiling mdx</h3>
        <pre>{error}</pre>
        </div>
    );
    }

    if (!Component) {
        return <div className="mdx-loading">Loading...</div>;
    }

    return (
        <AppContext.Provider value={app}>
            <FilePathContext.Provider value={filePath}>
                <div className="mdx-content">
                    <Component components={componentsWithFallback as unknown as Record<string, React.ComponentType<Record<string, unknown>>>} />
                </div>
            </FilePathContext.Provider>
        </AppContext.Provider>
    );
};