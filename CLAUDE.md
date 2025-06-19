# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a cross-browser extension for the [Qlty](https://qlty.sh) platform that
provides code quality insights directly in GitHub pull requests and commits.
The extension supports both Chrome and Firefox using a unified codebase.

## Build Commands

### Development

- `npm run watch` - Build and watch for Chrome with development environment
- `npm run watch:chrome` - Build and watch for Chrome specifically
- `npm run watch:firefox` - Build and watch for Firefox specifically

### Production Builds

- `npm run build` - Default build (Chrome)
- `npm run build:chrome` - Build Chrome extension (Manifest v3)
- `npm run build:firefox` - Build Firefox extension (Manifest v2)

All builds output to the `dist/` directory.

## Architecture

### Cross-Browser Compatibility

The extension uses `webextension-polyfill` to provide a unified API across browsers:

- `src/browser-api.ts` - Simple re-export of webextension-polyfill
- All extension APIs use promise-based `browser.*` interface
- Chrome gets Manifest v3, Firefox gets Manifest v2 automatically

### Core Components

- **Service Worker** (`src/service_worker.ts`) - Background script handling API
  communication, authentication, and tab management
- **Content Scripts**:
  - `src/coverage.ts` - Injects coverage data into GitHub pages
  - `src/auth.ts` - Handles OAuth flow on Qlty auth pages
- **Settings Page** (`src/settings.tsx`) - React-based popup for configuration
- **API Layer** (`src/api.ts`) - Handles communication with Qlty backend

### Manifest System

The build system uses JavaScript-based manifests that support environment
variable interpolation:

- `manifest.js` - Chrome Manifest v3 with service workers
- `manifest-firefox.js` - Firefox Manifest v2 with background scripts
- Vite plugin automatically processes the appropriate manifest based on
  `TARGET_BROWSER` env var

### Message Passing Architecture

Uses a command-based message system between content scripts and service
worker:

- Messages defined as TypeScript interfaces in `src/types.d.ts`
- Commands: `getFileCoverage`, `getAuthStateHash`, `signIn`, `signOut`, `getUser`,
  `endAuthFlow`
- Service worker maintains API tokens and handles all external API calls

### Environment Configuration

- Development mode uses `.env.development` with dotenvx
- Environment variables for `VITE_API_URL` and `VITE_LOGIN_URL` are
  interpolated into manifests
- Default values: API at `https://api.qlty.sh`, login at `https://qlty.sh`

## Development Workflow

1. Install dependencies: `npm install`
2. Start development build: `npm run watch:chrome` or `npm run watch:firefox`
3. Load extension in browser:
   - **Chrome**: Go to `chrome://extensions`, enable Developer mode, click
     "Load unpacked", select `dist/` folder
   - **Firefox**: Go to `about:debugging`, click "This Firefox", click "Load
     Temporary Add-on", select any file in `dist/` folder

The extension automatically rebuilds when source files change, but you'll need
to reload the extension in the browser to see changes.

## Important Commands

- Always run `qlty fmt` after making changes to ensure code style consistency.
- Always run `qlty check` to verify code quality before committing changes.
- Always run `tsc` to check TypeScript types.

## Key Integration Points

- **GitHub Integration**: Content scripts match `https://github.com/*/pull/*`
  and `https://github.com/*/commit/*`
- **Authentication Flow**: OAuth flow happens on
  `https://qlty.sh/auth/browser?*` pages
- **API Communication**: All API calls go through the service worker to
  `https://api.qlty.sh`
- **Storage**: Uses browser sync storage for API tokens and user preferences
