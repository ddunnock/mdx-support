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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useMDXComponents?: () => Record<string, React.ComponentType<any>>;
    }

    export function compile(
        content: string,
        options?: CompileOptions
    ): Promise<{ value: string }>;

    export function evaluate(
        content: string,
        options?: EvaluateOptions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<{ default: React.ComponentType<any> }>;

    export function run(
        code: string,
        options?: CompileOptions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<{ default: React.ComponentType<any> }>;
}

declare module '@mdx-js/react' {
    import * as React from 'react';

    export interface MDXProviderProps {
        children: React.ReactNode;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        components?: Record<string, React.ComponentType<any>>;
    }

    export const MDXProvider: React.FC<MDXProviderProps>;
}