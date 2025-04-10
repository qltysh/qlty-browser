async function authorize() {
  try {
    await validateState();

    console.log("[qlty] Authorizing...");
    const response = await fetch("/api/user/access_tokens", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Failed to generate a token: ${response.statusText}`);
    }

    const { newToken } = await response.json();
    if (newToken) {
      chrome.storage.sync.set({ apiToken: newToken }, () =>
        chrome.runtime.sendMessage({ command: "endAuthFlow" }),
      );
    } else {
      throw new Error("No token in payload");
    }
  } catch (error) {
    console.error("[qlty] Error during authorization:", error);
    showFailedAuthMessage();
  }
}

async function validateState(): Promise<boolean> {
  // ?state query parameter is a SHA-256 hashed value of the state we previously
  // stored in service worker as authState (minus browser- prefix).
  // Grab the query parameter and return true if it matches the stored value

  const url = new URL(window.location.href);
  const state = url.searchParams.get("state");
  if (!state) {
    throw new Error("Missing state parameter");
  }

  const storedHash = await loadStoredStateHash();
  if (storedHash !== state) {
    throw new Error("State values do not match");
  }

  return true;
}

async function loadStoredStateHash(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ command: "getAuthStateHash" }, (response) => {
      resolve(response?.hash || null);
    });
  });
}

function showFailedAuthMessage() {
  const message = document.getElementById("message");
  if (!message) return;
  message.innerText =
    "Something went wrong. Please close this window and try again.";
  message.style.color = "--var(color-rose-500)";
  document.getElementById("spinner")?.remove();
}

authorize();

export {};
