# Cross-Browser Extension Support

This extension now supports both Chrome and Firefox browsers using a unified
codebase with webextension-polyfill.

## Architecture

### Browser API Compatibility

- Uses `webextension-polyfill` directly for cross-browser compatibility
- `src/browser-api.ts` - Simple re-export of the polyfill
- All code uses the standardized `browser.*` API with promises
- Works seamlessly in both Chrome and Firefox

### Manifest Files

- `manifest.js` - Chrome Manifest v3 (default)
- `manifest-firefox.js` - Firefox Manifest v2

### Key Differences Handled

- **Manifest versions**: Chrome uses v3, Firefox uses v2
- **Background scripts**: Chrome uses service workers, Firefox uses background scripts
- **Permissions**: Different permission models between browsers
- **API differences**: Polyfill handles Chrome's callback-based vs Firefox's
  promise-based APIs

## Building

### Chrome Extension

```bash
npm run build:chrome
# or
TARGET_BROWSER=chrome npm run build
```

### Firefox Extension

```bash
npm run build:firefox
# or
TARGET_BROWSER=firefox npm run build
```

### Development

```bash
# Chrome development build
npm run watch:chrome

# Firefox development build
npm run watch:firefox
```

## API Usage

All extension APIs use the webextension-polyfill's standardized promise-based interface:

```typescript
import browser from "./browser-api";

// Storage
await browser.storage.sync.set({ key: "value" });
const data = await browser.storage.sync.get(["key"]);

// Runtime messaging
const response = await browser.runtime.sendMessage({ command: "test" });

// Tabs
const tab = await browser.tabs.create({ url: "https://example.com" });
```

The polyfill automatically:

- Converts Chrome's callback-based APIs to promises
- Provides a consistent `browser.*` interface in both browsers
- Handles all the cross-browser compatibility concerns

## Testing

1. Build for Chrome: `npm run build:chrome`
2. Load the `dist/` folder as an unpacked extension in Chrome
3. Build for Firefox: `npm run build:firefox`
4. Load the `dist/` folder as a temporary add-on in Firefox

## Dependencies

- `webextension-polyfill` - Provides unified browser extension API
- `@types/webextension-polyfill` - TypeScript definitions
