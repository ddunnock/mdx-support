import * as React from 'react';
import { useEffect, useState } from 'react';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
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
}

// Context to pass filePath to components
const FilePathContext = React.createContext<string>('');

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
        const [snippets, setSnippets] = useState<Array<{ code: string; language: string; filename: string; renderer: string; tabTitle: string }>>([]);
        const [activeTab, setActiveTab] = useState(0);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string>('');

        useEffect(() => {
            const loadSnippet = async () => {
                const app = (window as unknown as { app: { vault: { adapter: { read: (path: string) => Promise<string> } } } }).app;

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
            <div className="mdx-code-snippets" style={{ margin: '1em 0' }}>
                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.5em',
                    borderBottom: '1px solid var(--background-modifier-border)',
                    marginBottom: '0.5em',
                    flexWrap: 'wrap'
                }}>
                    {snippets.map((snippet, index) => {
                        const label = snippet.tabTitle || snippet.renderer || snippet.filename || `Tab ${index + 1}`;
                        return (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                style={{
                                    padding: '0.5em 1em',
                                    background: activeTab === index ? 'var(--background-primary-alt)' : 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === index ? '2px solid var(--interactive-accent)' : 'none',
                                    color: 'var(--text-normal)',
                                    cursor: 'pointer',
                                    fontSize: '0.9em'
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Code display */}
                <div>
                    {currentSnippet.filename && (
                        <div style={{
                            fontSize: '0.85em',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5em',
                            fontFamily: 'var(--font-monospace)'
                        }}>
                            {currentSnippet.filename}
                        </div>
                    )}
                    <pre style={{
                        background: 'var(--background-primary-alt)',
                        padding: '1em',
                        borderRadius: '4px',
                        overflow: 'auto',
                        margin: 0
                    }}>
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

                const app = (window as unknown as {
                    app: {
                        vault: {
                            adapter: {
                                getResourcePath: (path: string) => string;
                            };
                            getFiles: () => Array<{ path: string; name: string }>
                        }
                    }
                }).app;

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

                // Check which path actually exists by looking at vault files
                const files = app.vault.getFiles();
                let resolvedPath = pathsToTry[0]; // Default to first path

                for (const tryPath of pathsToTry) {
                    const fileExists = files.some(file => file.path === tryPath);
                    if (fileExists) {
                        resolvedPath = tryPath;
                        break;
                    }
                }

                const resourcePath = app.vault.adapter.getResourcePath(resolvedPath);
                setResolvedSrc(resourcePath);
            };

            void resolveVideoPath();
        }, [props.src, currentFilePath]);

        if (!props.src) {
            return (
                <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' as const }}>
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
                <div style={{ margin: '1em 0' }}>
                    <iframe
                        src={embedSrc}
                        style={{
                            width: '100%',
                            height: '400px',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }

        // Direct video file with resolved path
        return (
            <div style={{ margin: '1em 0' }}>
                <video
                    src={resolvedSrc}
                    controls
                    autoPlay={props.autoPlay}
                    loop={props.loop}
                    muted={props.muted}
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        borderRadius: '4px'
                    }}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    },
    // Custom img component to handle relative paths and wikilinks
    img: (props: { src?: string; alt?: string; title?: string }) => {
        const currentFilePath = React.useContext(FilePathContext);
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

                const app = (window as unknown as {
                    app: {
                        vault: {
                            adapter: {
                                getResourcePath: (path: string) => string;
                                exists: (path: string) => Promise<boolean>;
                            };
                            getFiles: () => Array<{ path: string; name: string }>
                        }
                    }
                }).app;

                // For wikilink-style paths (just filename, no path separators) - search vault
                if (!props.src.includes('/')) {
                    try {
                        // Search through all files in the vault
                        const files = app.vault.getFiles();
                        const matchingFile = files.find(file => file.name === props.src);

                        if (matchingFile) {
                            const resourcePath = app.vault.adapter.getResourcePath(matchingFile.path);
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

                // Check which path actually exists by looking at vault files
                const files = app.vault.getFiles();
                let resolvedPath = pathsToTry[0]; // Default to first path

                for (const tryPath of pathsToTry) {
                    const fileExists = files.some(file => file.path === tryPath);
                    if (fileExists) {
                        resolvedPath = tryPath;
                        break;
                    }
                }

                const resourcePath = app.vault.adapter.getResourcePath(resolvedPath);
                setResolvedSrc(resourcePath);
            };

            void resolveImagePath();
        }, [props.src, currentFilePath]);

        return (
            <img
                src={resolvedSrc}
                alt={props.alt || ''}
                title={props.title}
                style={{ maxWidth: '100%', height: 'auto' }}
            />
        );
    },
    // Table components for markdown tables
    table: ({ children }: { children: React.ReactNode }) => (
        <div style={{ overflowX: 'auto', margin: '1em 0' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid var(--background-modifier-border)'
            }}>
                {children}
            </table>
        </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
        <thead style={{ backgroundColor: 'var(--background-primary-alt)' }}>
            {children}
        </thead>
    ),
    tbody: ({ children }: { children: React.ReactNode }) => (
        <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
        <tr style={{ borderBottom: '1px solid var(--background-modifier-border)' }}>
            {children}
        </tr>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
        <th style={{
            padding: '0.75em',
            textAlign: 'left',
            fontWeight: 'bold',
            borderRight: '1px solid var(--background-modifier-border)'
        }}>
            {children}
        </th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
        <td style={{
            padding: '0.75em',
            borderRight: '1px solid var(--background-modifier-border)'
        }}>
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
            <div className="mdx-component-placeholder" style={{
                padding: '15px',
                border: '2px dashed var(--background-modifier-border)',
                borderRadius: '4px',
                margin: '10px 0',
                backgroundColor: 'var(--background-secondary)',
                color: 'var(--text-muted)'
            }}>
                <div style={{ fontWeight: 'bold' }}>⚠️ Component `{prop}` not available</div>
                <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                    This component is not defined in the preview.
                </div>
                {props.children && <div style={{ marginTop: '10px' }}>{props.children}</div>}
            </div>
        );
    }
});

type MDXComponent = React.ComponentType<{ components?: Record<string, React.ComponentType<Record<string, unknown>>> }>;

export const MDXRenderer: React.FC<MDXRendererProps> = ({ content, settings, filePath }) => {
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
        <FilePathContext.Provider value={filePath}>
            <div className="mdx-content">
                <Component components={componentsWithFallback as unknown as Record<string, React.ComponentType<Record<string, unknown>>>} />
            </div>
        </FilePathContext.Provider>
    );
};