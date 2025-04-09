const loginUrl = `http://localhost:3000/login`;
let defaultApiUrl = "https://api.qlty.sh";
let apiUrl = defaultApiUrl;
let apiToken = "";
let authStateHash: string | null = null;

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    console.log("[qlty] Extension installed");
    await loadAuthenticationPage();
  }
});

// Load settings when service worker starts
chrome.storage.sync.get(["apiUrl", "apiToken"], (result) => {
  apiUrl = result.apiUrl || defaultApiUrl;
  apiToken = result.apiToken;
  console.log("[qlty] Settings loaded, API URL:", apiUrl);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("[qlty] Settings changed:", namespace, changes);
  if (namespace === "sync") {
    if (changes.apiUrl) {
      apiUrl = changes.apiUrl.newValue || defaultApiUrl;
    }
    if (changes.apiToken) {
      apiToken = changes.apiToken.newValue;
    }
  }
});

chrome.runtime.onMessage.addListener(
  async (data: MessageRequest, _, sendResponse) => {
    if (typeof data === "string") {
      data = { command: data };
    }
    console.log("Received command:", data);
    if (data.command === "getFileCoverage") {
      fetchCoverageData(data, sendResponse);
    } else if (data.command === "getAuthStateHash") {
      const hash = authStateHash;
      //authStateHash = null; // Clear the hash because we are sending it
      sendResponse({ hash });
    } else if (data.command === "signIn") {
      loadAuthenticationPage();
      sendResponse({ success: true });
    }
    return true;
  },
);

async function fetchCoverageData(
  { workspace, project, reference, path }: GetFileCoverageRequest,
  sendResponse: (resp?: any) => void,
) {
  const url = new URL(
    `${apiUrl || defaultApiUrl}/gh/${workspace}/projects/${project}/coverage/file`,
  );
  url.searchParams.append("path", path);
  url.searchParams.append("reference", reference);

  try {
    const headers: HeadersInit = {};
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`;
    }

    const result = await fetch(url, { headers });
    const response = await result.json();
    sendResponse(typeof response === "string" ? { error: response } : response);
  } catch (error) {
    console.error("[qlty] Error fetching coverage data:", error);
    sendResponse({ error: "Failed to fetch coverage data" });
  }
}

async function loadAuthenticationPage() {
  const state = `browser-${crypto.randomUUID()}`;
  authStateHash = await hashStringHex(state.replace(/^browser-/, ""));
  console.log("[qlty] State hash stored:", state);
  console.log("[qlty] Auth state hash:", authStateHash);

  const url = new URL(loginUrl);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("state", state);
  chrome.tabs.create({ url: url.toString() });
}

async function hashStringHex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export {};
