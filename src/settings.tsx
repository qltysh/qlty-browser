import React, {
  StrictMode,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

import "./settings.css";

async function getCachedUser(): Promise<StoredSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["login", "avatarUrl", "apiToken", "customApiToken"],
      ({ login, avatarUrl, apiToken, customApiToken }) => {
        resolve({ login, avatarUrl, apiToken, customApiToken });
      },
    );
  });
}

const initialCache = getCachedUser();

function Settings() {
  const [userCache, setUserCache] = useState(use(initialCache));

  useEffect(() => {
    const handler = () => getCachedUser().then(setUserCache);
    chrome.storage.sync.onChanged.addListener(handler);
    return () => {
      chrome.storage.sync.onChanged.removeListener(handler);
    };
  }, []);

  return (
    <>
      <h1>
        <div className="qlty-icon" style={{ width: 48, height: 48 }}></div>lty
        Settings
      </h1>

      <UserInfo cache={userCache} />

      <AdvancedSettings initialState={userCache.customApiToken} />
    </>
  );
}

function UserInfo({
  cache: { login, avatarUrl, apiToken },
}: {
  cache: StoredSettings;
}) {
  const handleSignOut = useCallback(() => {
    chrome.runtime.sendMessage({ command: "signOut" });
  }, []);

  if (!login) {
    return <NotSignedIn />;
  }
  return (
    <>
      <div className="user-info">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "end",
          }}
        >
          <div style={{ opacity: 0.6 }}>Logged in as</div>
          <div className="login">{login}</div>
        </div>
        <img
          src={avatarUrl}
          width={40}
          height={40}
          className="avatar"
          alt={`${login}'s avatar`}
        />
      </div>

      {apiToken && (
        <button className="full-width" onClick={handleSignOut}>
          Sign Out
        </button>
      )}
    </>
  );
}

function AdvancedSettings({ initialState = false }: { initialState: boolean }) {
  const [showAdvancedSettings, setShowAdvancedSettings] =
    useState(initialState);
  const [customApiToken, setCustomApiToken] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(["customApiToken"], (result) => {
      if (result.customApiToken) {
        setCustomApiToken(result.customApiToken);
      }
    });

    const handler = (changes: any) => {
      if (changes.customApiToken) {
        setCustomApiToken(changes.customApiToken.newValue);
      }
    };
    chrome.storage.sync.onChanged.addListener(handler);
    return () => {
      chrome.storage.sync.onChanged.removeListener(handler);
    };
  }, [customApiToken]);

  return (
    <div style={{ marginTop: 32 }}>
      <h4
        className="advanced-settings"
        onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
      >
        <span
          style={{
            transform: showAdvancedSettings ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ▶
        </span>{" "}
        Advanced Settings
      </h4>

      {showAdvancedSettings && (
        <>
          <label htmlFor="custom-api-token">Custom API Token</label>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              name="custom-api-token"
              type="password"
              placeholder="Manually enter API token"
              onChange={(e) => {
                chrome.storage.sync.set({ customApiToken: e.target.value });
              }}
              value={customApiToken ?? ""}
            />
            <a
              href="https://qlty.sh/user/settings/cli"
              target="_blank"
              rel="noopener noreferrer"
              className="settings-link-icon"
            >
              <svg
                viewBox="0 0 24 20"
                width={16}
                height={16}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13.29 9.29l-4 4a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4-4a1 1 0 0 0-1.42-1.42z" />
                <path d="M12.28 17.4L11 18.67a4.2 4.2 0 0 1-5.58.4 4 4 0 0 1-.27-5.93l1.42-1.43a1 1 0 0 0 0-1.42 1 1 0 0 0-1.42 0l-1.27 1.28a6.15 6.15 0 0 0-.67 8.07 6.06 6.06 0 0 0 9.07.6l1.42-1.42a1 1 0 0 0-1.42-1.42z" />
                <path d="M19.66 3.22a6.18 6.18 0 0 0-8.13.68L10.45 5a1.09 1.09 0 0 0-.17 1.61 1 1 0 0 0 1.42 0L13 5.3a4.17 4.17 0 0 1 5.57-.4 4 4 0 0 1 .27 5.95l-1.42 1.43a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l1.42-1.42a6.06 6.06 0 0 0-.6-9.06z" />
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function NotSignedIn() {
  const handleSignIn = useCallback(() => {
    chrome.runtime.sendMessage({ command: "signIn" });
  }, []);

  return (
    <>
      <button className="full-width" onClick={handleSignIn}>
        Sign In
      </button>
    </>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <Settings />
  </StrictMode>,
);
console.log("[qlty] settings loaded");
