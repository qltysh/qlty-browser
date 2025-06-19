import browser from "webextension-polyfill";

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

  try {
    const response = await browser.runtime.sendMessage({
      command: "getFileCoverage",
      workspace,
      project,
      reference,
      path,
    });

    const typedResponse = response as
      | GetFileCoverageResponse
      | GetFileCoverageError
      | null;

    if (typedResponse && "error" in typedResponse) {
      throw new Error(typedResponse.error);
    }

    return typedResponse;
  } catch (error) {
    console.error("[qlty] Error sending message:", error);
    return null;
  }
}
