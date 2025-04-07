let defaultApiUrl = "https://api.qlty.sh";
let apiUrl = defaultApiUrl;
let apiToken = "";

// Load settings when service worker starts
chrome.storage.sync.get(['apiUrl', 'apiToken'], function (result) {
  apiUrl = result.apiUrl || defaultApiUrl;
  apiToken = result.apiToken;
  console.log("[qlty] Settings loaded, API URL:", apiUrl);
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  console.log("[qlty] Settings changed:", changes);
  if (namespace === 'sync') {
    if (changes.apiUrl) {
      apiUrl = changes.apiUrl.newValue || defaultApiUrl;
    }
    if (changes.apiToken) {
      apiToken = changes.apiToken.newValue;
    }
  }
});

chrome.runtime.onMessage.addListener(function (
  data: MessageRequest,
  _,
  sendResponse
) {
  console.log("Received command:", data);
  if (data.command === "getFileCoverage") {
    fetchCoverageData(data, sendResponse);
  }
  return true;
});

async function fetchCoverageData(
  { workspace, project, reference, path }: FetchCoverageDataRequest,
  sendResponse: (resp?: any) => void
) {
  const url = new URL(`${apiUrl || defaultApiUrl}/gh/${workspace}/projects/${project}/coverage/file`);
  url.searchParams.append("path", path);
  url.searchParams.append("reference", reference);

  try {
    const headers: HeadersInit = {};
    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    const result = await fetch(url, { headers });
    sendResponse(await result.json());
  } catch (error) {
    console.error("[qlty] Error fetching coverage data:", error);
    sendResponse({ error: "Failed to fetch coverage data" });
  }
}
