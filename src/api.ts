export async function readCoverageData(
  path: string,
): Promise<GetFileCoverageResponse | null> {
  const pathParts = window.location.pathname.split("/");
  const [workspace, project] = pathParts.slice(1, 3);

  let commitShaIndex = pathParts.indexOf("pull");
  let reference: string | null = null;
  if (commitShaIndex >= 0) {
    reference = `refs/pull/${pathParts[commitShaIndex + 1]}`;
  } else {
    commitShaIndex = pathParts.indexOf("commit");
    if (commitShaIndex >= 0) {
      reference = pathParts[commitShaIndex + 1];
    }
  }

  if (!reference) {
    console.error("[qlty] No commit SHA found in the URL.");
    return null;
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        command: "getFileCoverage",
        workspace,
        project,
        reference,
        path,
      },
      (response: GetFileCoverageResponse | GetFileCoverageError) => {
        if ("error" in response) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      },
    );
  });
}
