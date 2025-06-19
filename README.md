# Qlty Browser Extension

A cross-browser extension for the [Qlty](https://qlty.sh) platform that provides
code quality insights directly in GitHub pull requests and commits. The extension
supports both Chrome and Firefox using a unified codebase.

## Supported Browsers

- **Chrome** - Uses Manifest v3 with service workers
- **Firefox** - Uses Manifest v2 with background scripts

## Development

### Installing Dependencies

```sh
npm install
```

### Building

For development with file watching:

```sh
# Chrome (default)
npm run watch

# Chrome specifically
npm run watch:chrome

# Firefox
npm run watch:firefox
```

For production builds:

```sh
# Chrome (default)
npm run build

# Chrome specifically
npm run build:chrome

# Firefox
npm run build:firefox
```

All builds output to the `dist/{chrome,firefox}` directories respectively.

### Loading the Extension

#### Chrome

1. Build the extension: `npm run build:chrome` or `npm run watch:chrome`
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/chrome` folder from the repository

For more details, see the [Chrome Extension Developer Documentation][chrome-ext-load].

#### Firefox

1. Build the extension: `npm run build:firefox` or `npm run watch:firefox`
2. Run `npm run run:firefox` to load the extension in Firefox.

The extension automatically rebuilds when source files change during development,
but you'll need to reload the extension in the browser to see changes.

## Architecture

For technical details about the extension's architecture, cross-browser compatibility, and implementation details, see [ARCHITECTURE.md](ARCHITECTURE.md).

[chrome-ext-load]: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked
