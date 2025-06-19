# Architecture

This document describes the technical architecture of the Qlty Browser Extension.

## Cross-Browser Compatibility

The extension supports both Chrome and Firefox using a unified codebase with webextension-polyfill for seamless cross-browser compatibility.

### Browser API Compatibility

- Uses `webextension-polyfill` for cross-browser compatibility
- `src/browser-api.ts` - Simple re-export of the polyfill
- All extension APIs use the standardized `browser.*` interface with promises
- Unified codebase works seamlessly in both Chrome and Firefox

### Manifest System

The build system uses a single JavaScript-based manifest file with dynamic adaptation:

- `manifest.js` - Single manifest file that supports environment variable interpolation
- Chrome builds use Manifest v3 with service workers (default configuration)
- Firefox builds dynamically modify the manifest to use Manifest v2 with background pages
- The `@crxjs/vite-plugin` processes the manifest based on `TARGET_BROWSER` environment variable
- Environment variables like `VITE_API_URL` and `VITE_LOGIN_URL` are interpolated during build
- Firefox-specific processing removes Chrome-only manifest properties like `use_dynamic_url`

### Key Differences Handled

- **Manifest versions**: Chrome uses v3, Firefox uses v2 (dynamically converted)
- **Background execution**:
  - Chrome uses service workers (`background.service_worker`)
  - Firefox uses background page (`background.page` pointing to `service_worker.html`)
- **Manifest properties**: Firefox build removes Chrome-specific properties
- **API compatibility**: Polyfill handles Chrome's callback-based vs Firefox's
  promise-based APIs automatically

## Core Components

### Service Worker

- **File**: `src/service_worker.ts`
- **Purpose**: Background script handling API communication, authentication, and tab management
- **Chrome**: Runs as a service worker (Manifest v3)
- **Firefox**: Runs as a background script (Manifest v2)

### Content Scripts

- **Coverage Script** (`src/coverage.ts`) - Injects coverage data into GitHub pages
- **Auth Script** (`src/auth.ts`) - Handles OAuth flow on Qlty auth pages

### Settings Page

- **File**: `src/settings.tsx`
- **Purpose**: React-based popup for configuration
- **Framework**: React with TypeScript

### API Layer

- **File**: `src/api.ts`
- **Purpose**: Handles communication with Qlty backend
- **Integration**: All API calls go through the service worker

## Message Passing Architecture

Uses a command-based message system between content scripts and service worker:

- Messages defined as TypeScript interfaces in `src/types.d.ts`
- Commands: `getFileCoverage`, `getAuthStateHash`, `signIn`, `signOut`, `getUser`,
  `endAuthFlow`
- Service worker maintains API tokens and handles all external API calls

## Environment Configuration

- Development mode uses `.env.development` with dotenvx
- Environment variables for `VITE_API_URL` and `VITE_LOGIN_URL` are
  interpolated into manifests
- Default values: API at `https://api.qlty.sh`, login at `https://qlty.sh`

## Key Integration Points

- **GitHub Integration**: Content scripts match `https://github.com/*/pull/*`
  and `https://github.com/*/commit/*`
- **Authentication Flow**: OAuth flow happens on
  `https://qlty.sh/auth/browser?*` pages
- **API Communication**: All API calls go through the service worker to
  `https://api.qlty.sh`
- **Storage**: Uses browser sync storage for API tokens and user preferences
