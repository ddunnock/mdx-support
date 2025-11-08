declare module '*.mdx' {
    let MDXComponent: (props: any) => JSX.Element;
    export default MDXComponent;
}

declare module '@mdx-js/mdx' {
    export function compile(
        content: string,
        options?: any
    ): Promise<{ value: string }>;

    export function evaluate(
        content: string,
        options?: any
    ): Promise<{ default: React.ComponentType<any> }>;

    export function run(
        code: string,
        options?: any
    ): Promise<{ default: React.ComponentType<any> }>;
}

declare module '@mdx-js/react' {
    import * as React from 'react';

    export interface MDXProviderProps {
        children: React.ReactNode;
        components?: Record<string, React.ComponentType<any>>;
    }

    export const MDXProvider: React.FC<MDXProviderProps>;
}