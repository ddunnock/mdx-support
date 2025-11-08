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

interface MDXRendererProps {
    content: string;
    settings: MDXPluginSettings;
    filePath: string;
}

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
    CodeSnippets: ({ path }: { path: string }) => (
        <div className="mdx-code-snippets">
            <em>[Code snippet: {path}]</em>
        </div>
    ),
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
};

type MDXComponent = React.ComponentType<{ components?: Record<string, React.ComponentType<Record<string, unknown>>> }>;

export const MDXRenderer: React.FC<MDXRendererProps> = ({ content, settings, filePath }) => {
    const [Component, setComponent] = useState<MDXComponent | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const compileMDX = async () => {
            try {
                // Strip frontmatter before compiling
                const contentWithoutFrontmatter = stripFrontmatter(content);

                // Evaluate MDX - this compiles and runs it in one step
                const { default: MDXContent } = await evaluate(contentWithoutFrontmatter, {
                    ...runtime,
                    development: false,
                    useMDXComponents: () => defaultComponents,
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
                <h3>Error compiling MDX</h3>
        <pre>{error}</pre>
        </div>
    );
    }

    if (!Component) {
        return <div className="mdx-loading">Loading...</div>;
    }

    return (
        <div className="mdx-content">
            <Component components={defaultComponents} />
        </div>
    );
};