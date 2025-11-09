declare module '*.mdx' {
    let MDXComponent: (props: Record<string, unknown>) => JSX.Element;
    export default MDXComponent;
}

declare module '@mdx-js/mdx' {
    import * as React from 'react';

    export interface CompileOptions {
        [key: string]: unknown;
    }

    export interface EvaluateOptions extends CompileOptions {
        development?: boolean;
        useMDXComponents?: () => Record<string, React.ComponentType<Record<string, unknown>>>;
    }

    export function compile(
        content: string,
        options?: CompileOptions
    ): Promise<{ value: string }>;

    export function evaluate(
        content: string,
        options?: EvaluateOptions
    ): Promise<{ default: React.ComponentType<Record<string, unknown>> }>;

    export function run(
        code: string,
        options?: CompileOptions
    ): Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
}

declare module '@mdx-js/react' {
    import * as React from 'react';

    export interface MDXProviderProps {
        children: React.ReactNode;
        components?: Record<string, React.ComponentType<Record<string, unknown>>>;
    }

    export const MDXProvider: React.FC<MDXProviderProps>;
}