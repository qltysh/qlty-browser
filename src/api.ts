export async function readCoverageData(
  path: string,
  reference: string,
): Promise<GetFileCoverageResponse | null> {
  const pathParts = window.location.pathname.split("/");
  const [workspace, project] = pathParts.slice(1, 3);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        command: "getFileCoverage",
        workspace,
        project,
        reference,
        path,
      },
      (response: GetFileCoverageResponse | GetFileCoverageError | null) => {
        if (response && "error" in response) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      },
    );
  });
}
