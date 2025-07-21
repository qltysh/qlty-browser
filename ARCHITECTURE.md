# Architecture

This document describes the technical architecture of the Qlty Browser Extension, focusing on architecturally significant components that developers need to understand for maintenance and extension.

## Overview

The Qlty Browser Extension provides code coverage insights directly within GitHub pull requests and commits. It integrates with the Qlty platform to fetch coverage data and inject visual indicators into GitHub's interface using a content script architecture.

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

### Service Worker (`src/service_worker.ts`)

The service worker acts as the central orchestrator for all extension functionality:

**Key Responsibilities:**
- **API Communication**: Manages all HTTP requests to the Qlty API at `https://api.qlty.sh`
- **Authentication State**: Stores and manages OAuth tokens using `browser.storage.sync`
- **Tab Management**: Handles opening/closing authentication tabs during OAuth flow
- **Message Routing**: Processes commands from content scripts via `browser.runtime.onMessage`

**Architecture Patterns:**
- Command-based message system with typed TypeScript interfaces
- Token resolution logic (custom API token takes precedence over OAuth token)
- State-based authentication flow with cryptographic validation
- Automatic token cleanup on 4xx HTTP responses

**Chrome vs Firefox:**
- Chrome: Runs as a service worker (Manifest v3)
- Firefox: Runs as a background script (Manifest v2)

### GitHub Page Injection (`src/github-injector.ts`)

The GitHub injection system is the core feature that provides coverage visualization:

**Injection Strategy:**
- **DOM Monitoring**: Uses `MutationObserver` to detect GitHub page changes and re-inject UI
- **File Detection**: Scans for file diff links (`a[href^="#diff-"]`) to identify files needing coverage
- **Path Extraction**: Extracts file paths from GitHub's diff anchor links
- **Coverage Mapping**: Maps line numbers to coverage data using GitHub's grid cell IDs

**UI Components Injected:**
- **Coverage Badges**: Visual indicators in PR/commit headers showing overall coverage status
- **Line Gutters**: Color-coded coverage indicators (green=covered, red=uncovered, gray=omitted)
- **Coverage Summary**: Percentage and progress bar for each file
- **Navigation Button**: "Jump to next uncovered line" functionality with keyboard shortcut (n key)

**Technical Implementation:**
- Caches coverage data per file path to avoid repeated API calls
- Handles both PR pages and standalone commit pages with different selectors
- Injects CSS classes (`qlty-coverage-hit`, `qlty-coverage-miss`, `qlty-coverage-omit`)
- Line number extraction from GitHub's `data-grid-cell-id` and `data-line-number` attributes

**Content Script Entry Point (`src/coverage.ts`):**
- Simple entry point that imports CSS and calls `tryInjectDiffUI()`
- Loads on GitHub URLs matching pull requests and commits

### Authentication Flow

The authentication system implements a secure OAuth-like flow:

**OAuth State Management (`src/service_worker.ts`):**
1. **State Generation**: Creates cryptographically secure state with `crypto.randomUUID()`
2. **State Hashing**: Generates SHA-256 hash of state for validation
3. **Tab Orchestration**: Opens Qlty login page in new tab, remembers previous tab
4. **State Validation**: Compares returned state hash with stored value

**Token Exchange (`src/auth.ts`):**
1. **URL Validation**: Runs on `https://qlty.sh/auth/browser?*` pages
2. **State Verification**: Validates state parameter against stored hash
3. **Token Generation**: Makes authenticated request to `/api/user/access_tokens`
4. **Storage**: Stores token in `browser.storage.sync` for persistence
5. **Flow Completion**: Notifies service worker to close auth tab

**Security Features:**
- State parameter prevents CSRF attacks
- Hash comparison ensures state integrity
- Automatic token cleanup on authentication failures
- Secure storage using browser sync storage

### Settings Interface (`src/settings.tsx`)

React-based popup interface for extension configuration:

**Component Architecture:**
- **Settings Container**: Main component managing user state and storage listeners
- **UserInfo Component**: Displays login status, avatar, and sign-out functionality
- **AdvancedSettings**: Collapsible section for custom API token input
- **NotSignedIn**: Sign-in button for unauthenticated users

**State Management:**
- Uses React hooks with `browser.storage.sync` integration
- Real-time updates via `browser.storage.onChanged` listeners
- Cached user data includes login, avatar URL, and tokens

**User Experience:**
- Automatic token validation and user info display
- Custom API token override for enterprise/development use
- Direct link to Qlty settings page for token generation

### API Layer (`src/api.ts`)

Centralized API communication layer:

**Coverage Data Flow:**
1. Content script requests coverage via message passing
2. Service worker constructs API URL with workspace/project/reference parameters
3. Makes authenticated request to `/gh/{workspace}/projects/{project}/coverage/file`
4. Returns structured coverage data with line-by-line hit counts
5. Content script caches and applies coverage visualization

## Message Passing Architecture

The extension uses a command-based message system for communication between content scripts and the service worker:

**Message Types (`src/types.d.ts`):**
- `getFileCoverage`: Request coverage data for a specific file
- `getAuthStateHash`: Retrieve authentication state hash for validation
- `signIn`: Initiate OAuth authentication flow
- `signOut`: Clear stored authentication tokens
- `getUser`: Fetch current user information
- `endAuthFlow`: Complete authentication and close auth tab

**Communication Pattern:**
1. Content scripts send typed message commands via `browser.runtime.sendMessage`
2. Service worker receives messages via `browser.runtime.onMessage` listener
3. Service worker processes command and sends response via callback
4. All external API calls are centralized in the service worker

**Type Safety:**
- TypeScript interfaces ensure message structure consistency
- Overloaded `chrome.runtime.sendMessage` declarations provide compile-time validation
- Request/response pairs are strongly typed

## Data Flow Architecture

**Coverage Data Pipeline:**
1. **Trigger**: GitHub page load/navigation detected by `MutationObserver`
2. **File Discovery**: Scan DOM for diff links to identify files
3. **Data Request**: Content script sends `getFileCoverage` message to service worker
4. **API Call**: Service worker fetches from `/gh/{workspace}/projects/{project}/coverage/file`
5. **Response Processing**: Coverage data returned with line-by-line hit counts
6. **UI Injection**: Content script injects visual indicators into GitHub DOM
7. **Caching**: Coverage data cached per file path for performance

**Authentication Data Flow:**
1. **Initiation**: User clicks "Sign In" in settings popup
2. **State Generation**: Service worker creates secure random state
3. **Tab Opening**: New tab opened to Qlty OAuth page with state parameter
4. **Token Exchange**: Auth page validates state and generates API token
5. **Storage**: Token stored in `browser.storage.sync` for persistence
6. **Cleanup**: Auth tab closed, previous tab restored

## Environment Configuration

**Build-time Configuration:**
- Development mode uses `.env.development` with dotenvx
- Environment variables for `VITE_API_URL` and `VITE_LOGIN_URL` are interpolated into manifests
- Default values: API at `https://api.qlty.sh`, login at `https://qlty.sh`

**Runtime Configuration:**
- API token storage in browser sync storage (persists across browser sessions)
- Custom API token override for enterprise/development environments
- User preferences cached locally with real-time sync

## Key Integration Points

**GitHub Integration:**
- Content scripts match `https://github.com/*/pull/*` and `https://github.com/*/commit/*`
- DOM injection targets GitHub's specific CSS selectors and data attributes
- Handles both old and new GitHub UI versions

**Authentication Integration:**
- OAuth flow happens on `https://qlty.sh/auth/browser?*` pages
- Secure state validation prevents CSRF attacks
- Automatic token refresh and cleanup

**API Integration:**
- All API calls proxied through service worker to `https://api.qlty.sh`
- Bearer token authentication with automatic token resolution
- Structured error handling and user feedback

**Browser Storage:**
- Uses `browser.storage.sync` for cross-device synchronization
- Stores API tokens, user profile data, and preferences
- Real-time updates via storage change listeners

## Extension Points for Developers

**Adding New Coverage Visualizations:**
- Extend `injectIntoGutterCell()` in `src/github-injector.ts:259`
- Add new CSS classes in `src/coverage.css`
- Update `FileCoverage` interface in `src/types.d.ts` if needed

**Supporting Additional GitHub Pages:**
- Update manifest content script matches
- Modify `tryInjectDiffUI()` for new page types
- Add new selectors to `src/github/components/selectors.ts`

**Adding New API Endpoints:**
- Extend message types in `src/types.d.ts`
- Add command handler in `src/service_worker.ts:42-70`
- Update API layer in `src/api.ts`

**Customizing Authentication:**
- Modify OAuth flow in `loadAuthenticationPage()` and `authorize()`
- Update security validation in `validateState()`
- Extend settings UI for additional auth options
