<div align="center">
  <img src="assets/mdx-logo.svg" alt="MDX Logo" width="200"/>
  <h1>MDX Support for Obsidian</h1>
  <p>A modern, feature-rich plugin for <a href="https://obsidian.md">Obsidian</a> that provides seamless rendering and editing of <a href="https://mdxjs.com/">MDX</a> files with React components and interactive content.</p>
</div>

## Features

### 🎨 Seamless MDX Rendering
- **Auto-render on open** - MDX files automatically render when clicked (configurable)
- **Live reload** - Changes update instantly as you edit
- **React 19 + MDX v3** - Built on the latest technology stack
- **Desktop-only** - Optimized for Obsidian desktop with full React support

### 🛠️ File Management
- **Ribbon icon** - Quick access to create new MDX files
- **Context menu integration** - Right-click to create MDX files in any folder
- **Smart file naming** - Auto-increments filenames (Untitled.mdx, Untitled 1.mdx, etc.)
- **Command palette** - Access all functions via `Ctrl/Cmd+P`

### 📦 Built-in Components
Ready-to-use React components for interactive content:

- **`<Alert>`** - Info, warning, error, and success alerts
- **`<Callout>`** - Styled callout boxes with titles and icons
- **`<Counter>`** - Interactive counter example
- **`<CodeSnippets>`** - Code snippet placeholders (Storybook compatible)
- **`<IfRenderer>`** / **`<If>`** - Conditional rendering (Storybook compatible)

### ⚙️ Configurable Settings
- **Auto-open toggle** - Choose between auto-render or markdown editing
- **JSX control** - Enable/disable JSX components
- **HTML tags** - Allow or restrict raw HTML
- **Theme support** - Auto, light, or dark mode
- **Syntax highlighting** - Code Hike-powered highlighting with theme support
- **Storybook preferences** - Set preferred language (JS/TS) and framework

### 🎯 Storybook Integration
Perfect for importing Storybook documentation:
- **Smart code filtering** - Set preferred language (JS/TS) and framework (React/Vue/Angular/Svelte)
- **Syntax highlighting** - Beautiful Code Hike-powered syntax highlighting
- **Automatic frontmatter stripping** - Handles Storybook metadata
- **Storybook-specific components** - CodeSnippets, IfRenderer, and more
- **Cross-platform** - Works on Windows, macOS, and Linux

## Installation

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/dunnock/obsidian-mdx-plugin/releases)
2. Extract the zip file to `<vault>/.obsidian/plugins/obsidian-mdx-plugin/`
3. Reload Obsidian
4. Enable "MDX Support" in Settings → Community plugins

### Development Installation
1. Clone this repository to `<vault>/.obsidian/plugins/obsidian-mdx-plugin/`
2. Run `npm install`
3. Run `npm run build`
4. Enable the plugin in Obsidian

## Usage

### Creating MDX Files

**Method 1: Ribbon Icon**
- Click the file-plus icon in the left sidebar
- A new MDX file will be created in the current folder

**Method 2: Context Menu**
- Right-click any file or folder
- Select "New MDX file"

**Method 3: Command Palette**
- Press `Ctrl/Cmd+P`
- Type "New MDX file"

### Viewing MDX Files

**Auto-render (default)**
- Simply click any `.mdx` file to view the rendered output

**Manual preview**
- Disable auto-open in settings
- Edit MDX as markdown
- Press `Ctrl/Cmd+P` → "Preview MDX" to render

### Writing MDX

MDX files support standard Markdown plus JSX components:

```mdx
---
title: My Document
---

# Hello MDX

This is regular markdown with **bold** and *italic* text.

<Alert type="info">
  This is an informational alert!
</Alert>

<Callout title="Pro Tip" icon="💡">
  You can use React components inside your markdown!
</Callout>

<Counter />

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello from MDX!");
}
\`\`\`
```

## Architecture

The plugin uses a modern, component-based architecture:

```
src/
├── main.ts           # Plugin initialization and commands
├── MDXView.ts        # View handler for .mdx files
├── MDXRenderer.tsx   # React renderer for MDX content
├── settings.ts       # Settings panel and configuration
└── types.d.ts        # TypeScript declarations
```

### Key Technologies
- **MDX v3.1.1** - Latest MDX compiler with full JSX support
- **React 19** - Modern React with improved performance
- **TypeScript** - Full type safety
- **esbuild** - Fast bundling

## Comparison with Other MDX Plugins

| Feature | MDX Support (this) | obsidian-mdx | obsidian-edit-mdx | others |
|---------|-------------------|--------------|-------------------|--------|
| MDX Rendering | ✅ | ✅ | ❌ | ❌ |
| Auto-open | ✅ | ❌ | N/A | N/A |
| Mobile Support | ❌ | ❌ | ✅ | ✅ |
| File Creation | ✅ | ❌ | ✅ | ❌ |
| Custom Components | ✅ | Limited | N/A | N/A |
| Storybook Support | ✅ | ❌ | ❌ | ❌ |
| MDX Version | 3.1.1 | 2.3.0 | N/A | N/A |
| Settings Panel | ✅ | ❌ | ❌ | ❌ |

### What Makes This Plugin Different?

1. **Only auto-rendering plugin** - No command palette needed
2. **Storybook-first** - Built for importing component documentation
3. **Modern stack** - Latest MDX and React versions
4. **Extensible** - Easy to add custom components
5. **Full React support** - Interactive components with state management

## Settings

Access settings via Settings → MDX Support

### Behavior
- **Auto-open MDX files** - Automatically render MDX files when clicked

### Rendering
- **Enable JSX** - Allow JSX components in MDX files
- **Allow HTML Tags** - Allow raw HTML in MDX content
- **Theme** - Select light, dark, or auto theme
- **Enable syntax highlighting** - Enhanced code block styling

## Credits and Inspiration

This plugin was inspired by and learned from:

- **[obsidian-mdx](https://github.com/yuleicul/obsidian-mdx)** by Yulei Chen
  - Pioneered MDX rendering in Obsidian
  - Introduced Code Hike integration concept

- **[obsidian-edit-mdx](https://github.com/timppeters/obsidian-edit-mdx)** by Tim Peters
  - File creation UI patterns
  - Context menu integration ideas

- **[obsidian-markdown-file-suffix](https://github.com/git-no/obsidian-markdown-file-suffix)** by swissmation
  - Multi-format extension support approach

- **[mdx-as-md-obsidian](https://github.com/mkozhukharenko/mdx-as-md-obsidian)** by death_au
  - Minimal plugin architecture reference

Special thanks to the MDX team for creating an amazing format for interactive documentation.

## Roadmap

- [x] ~~Advanced syntax highlighting (Code Hike style)~~ ✅ v1.3.0
- [x] ~~Storybook code snippet filtering~~ ✅ v1.3.0
- [ ] Theme-aware syntax highlighting (match Obsidian theme)
- [ ] Custom component loader
- [ ] MDX plugin system (remark/rehype)
- [ ] Export to HTML
- [ ] Obsidian internal link support
- [ ] Live preview mode (split edit/preview)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

David Dunnock
- GitHub: [@dunnock](https://github.com/dunnock)
- Funding: [Buy me a coffee](https://buymeacoffee.com/ddunnock)

## Support

If you encounter any issues or have suggestions:
1. Check the [issues page](https://github.com/dunnock/obsidian-mdx-plugin/issues)
2. Create a new issue with details about your problem
3. Include your Obsidian version and plugin version

---

Made with ❤️ for the Obsidian community