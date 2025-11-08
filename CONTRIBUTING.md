# Contributing to MDX Support for Obsidian

Thank you for your interest in contributing to the MDX Support plugin! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

1. **Clear title** - Describe the issue concisely
2. **Steps to reproduce** - List the exact steps to recreate the bug
3. **Expected behavior** - What you expected to happen
4. **Actual behavior** - What actually happened
5. **Environment details**:
   - Obsidian version
   - Plugin version
   - Operating system
   - Any relevant error messages or console logs

### Suggesting Features

Feature requests are welcome! Please create an issue with:

1. **Use case** - Explain why this feature would be useful
2. **Proposed solution** - Describe how you envision the feature working
3. **Alternatives considered** - Any other approaches you've thought about

### Pull Requests

We actively welcome pull requests! Here's how to contribute code:

#### 1. Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/obsidian-mdx-plugin.git
cd obsidian-mdx-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# For development with auto-rebuild
npm run dev
```

#### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### 3. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

#### 4. Test Your Changes

- Test the plugin in Obsidian
- Ensure no TypeScript errors: `npm run build`
- Test on different file types if applicable
- Verify existing features still work

#### 5. Commit Your Changes

Follow conventional commit format:

```bash
git commit -m "feat: add new component support"
git commit -m "fix: resolve rendering issue with frontmatter"
git commit -m "docs: update README with new examples"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

#### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Reference to any related issues
- Screenshots/GIFs if UI changes

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing file structure
- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Avoid using `!important` in CSS

### File Organization

```
src/
├── main.ts           # Plugin entry point
├── MDXView.ts        # View management
├── MDXRenderer.tsx   # React rendering logic
├── settings.ts       # Settings UI and config
└── types.d.ts        # TypeScript declarations
```

### CSS Guidelines

- Use Obsidian CSS variables for theming
- Prefix custom classes with `mdx-`
- Use specific selectors instead of `!important`
- Test with different Obsidian themes

### Testing Checklist

Before submitting a PR, verify:

- [ ] Plugin builds without errors
- [ ] No TypeScript compilation errors
- [ ] Plugin loads correctly in Obsidian
- [ ] New features work as expected
- [ ] Existing features still work
- [ ] Settings panel displays correctly
- [ ] No console errors
- [ ] Code follows project style
- [ ] Documentation updated if needed

## Project Structure

### Key Components

**main.ts**
- Plugin initialization
- Command registration
- File extension handling
- Icon management

**MDXView.ts**
- View lifecycle management
- File watching and updates
- State management

**MDXRenderer.tsx**
- MDX compilation
- React component rendering
- Error handling
- Component library

**settings.ts**
- Settings panel UI
- Configuration management
- User preferences

### Adding New Components

To add a new built-in component:

1. Add component to `MDXRenderer.tsx` in the `components` object
2. Export component type in the interface
3. Document in README.md
4. Add example usage

Example:

```typescript
const MyComponent: React.FC<{ title: string }> = ({ title }) => {
  return <div className="mdx-my-component">{title}</div>;
};

// Add to components object
const components = {
  // ... existing components
  MyComponent,
};
```

### Adding CSS Styles

1. Add styles to `styles.css`
2. Use Obsidian CSS variables
3. Prefix class names with `mdx-`
4. Comment complex selectors

Example:

```css
/* My Component Styles */
.mdx-my-component {
    padding: 16px;
    background-color: var(--background-secondary);
    border-radius: 6px;
}
```

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Create a new issue with your question
3. Reach out on GitHub discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation where applicable

Thank you for helping make MDX Support better!