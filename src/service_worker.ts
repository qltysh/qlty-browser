const baseURL = "http://localhost:3001";

type FetchCoverageDataRequest = {
  command: "/coverage/reference";
  workspace: string;
  project: string;
  reference: string;
  path: string;
};

type MessageRequest = FetchCoverageDataRequest;

chrome.runtime.onMessage.addListener(function (
  data: MessageRequest,
  _,
  sendResponse
) {
  console.log("Received command:", data);
  if (data.command === "/coverage/reference") {
    fetchCoverageData(data, sendResponse);
  }
  return true;
});

async function fetchCoverageData(
  { command, workspace, project, reference, path }: FetchCoverageDataRequest,
  sendResponse: (resp?: any) => void
) {
  const url = new URL(`${baseURL}${command}`);
  url.searchParams.append("workspace", workspace);
  url.searchParams.append("project", project);
  url.searchParams.append("reference", reference);
  url.searchParams.append("path", path);
  const result = await fetch(url);
  sendResponse(await result.json());
}
