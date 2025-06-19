import browser from "webextension-polyfill";

const loginUrl = `${import.meta.env.VITE_LOGIN_URL ?? "https://qlty.sh"}/login`;
const apiUrl = import.meta.env.VITE_API_URL ?? "https://api.qlty.sh";

let apiToken = "";
let customApiToken = "";
let authStateHash: string | null = null;

let authTab: browser.Tabs.Tab | undefined;
let prevTab: browser.Tabs.Tab | undefined;

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    console.log("[qlty] Extension installed");
    await loadAuthenticationPage();
  }
});

browser.storage.sync.get(["apiToken", "customApiToken"]).then((result) => {
  apiToken = (result.apiToken as string) || "";
  customApiToken = (result.customApiToken as string) || "";
  fetchUser();
});

browser.storage.onChanged.addListener((changes, namespace) => {
  console.log("[qlty] Settings changed:", namespace, changes);
  if (namespace === "sync") {
    if (changes.apiToken) {
      apiToken = changes.apiToken.newValue as string;
    }
    if (changes.customApiToken) {
      customApiToken = changes.customApiToken.newValue as string;
    }

    if (changes.apiToken || changes.customApiToken) {
      fetchUser();
    }
  }
});

browser.runtime.onMessage.addListener((input, sender, sendResponse) => {
  let data: MessageRequest;
  if (typeof input === "string") {
    data = { command: input as MessageRequest["command"] } as MessageRequest;
  } else {
    data = input as MessageRequest;
  }
  console.log("Received command:", data);
  if (data.command === "getFileCoverage") {
    fetchCoverageData(data, sendResponse);
  } else if (data.command === "getAuthStateHash") {
    const hash = authStateHash;
    authStateHash = null; // Clear the hash because we are sending it
    sendResponse({ hash });
  } else if (data.command === "signIn") {
    loadAuthenticationPage(sender.tab);
    sendResponse({ success: true });
  } else if (data.command === "signOut") {
    browser.storage.sync.remove(["apiToken", "login", "avatarUrl"]);
    sendResponse({ success: true });
  } else if (data.command === "getUser") {
    fetchUser(sendResponse);
  } else if (data.command === "endAuthFlow") {
    closeAuthenticationPage();
    sendResponse({ success: true });
  }

  return true;
});

function resolveApiToken(): string {
  return customApiToken || apiToken;
}

async function fetchUser(
  sendResponse?: (resp?: GetUserResponse | null) => void,
) {
  if (!resolveApiToken()) {
    console.log("[qlty] No API token provided, clearing session");
    browser.storage.sync.set({ login: null, avatarUrl: null });
    sendResponse?.(null);
    return;
  }

  const url = new URL(`${apiUrl}/user`);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${resolveApiToken()}` },
    });
    if (response.status >= 400 && response.status < 500) {
      browser.storage.sync.remove(["apiToken", "login", "avatarUrl"]);
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    const json = await response.json();
    browser.storage.sync.set({
      login: json.login,
      avatarUrl: json.avatarUrl,
    });
    sendResponse?.(typeof json === "string" ? { error: json } : json);
  } catch (error) {
    console.error("[qlty] Error fetching user:", error);
    sendResponse?.(null);
  }
}

async function fetchCoverageData(
  { workspace, project, reference, path }: GetFileCoverageRequest,
  sendResponse: (
    resp?: GetFileCoverageResponse | GetFileCoverageError | null,
  ) => void,
) {
  if (!resolveApiToken()) {
    console.log("[qlty] No API token provided");
    sendResponse?.(null);
    return;
  }

  const url = new URL(
    `${apiUrl}/gh/${workspace}/projects/${project}/coverage/file`,
  );
  url.searchParams.append("path", path);
  url.searchParams.append("reference", reference);

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${resolveApiToken()}` },
    });
    const json = await response.json();
    sendResponse(typeof json === "string" ? { error: json } : json);
  } catch (error) {
    console.error("[qlty] Error fetching coverage data:", error);
    sendResponse({ error: "Failed to fetch coverage data" });
  }
}

async function loadAuthenticationPage(senderTab?: browser.Tabs.Tab) {
  const state = `browser-${crypto.randomUUID()}`;
  authStateHash = await hashStringHex(state.replace(/^browser-/, ""));
  prevTab = senderTab;

  const url = new URL(loginUrl);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("state", state);
  authTab = await browser.tabs.create({ url: url.toString(), active: true });
}

async function closeAuthenticationPage() {
  if (prevTab?.id) {
    await browser.tabs.update(prevTab.id, { active: true });
    prevTab = undefined;
  }
  if (authTab?.id) {
    await browser.tabs.remove(authTab.id);
    authTab = undefined;
  }
}

async function hashStringHex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export {};
