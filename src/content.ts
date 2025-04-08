import "./styles.css";
import { showToast } from "./toast";

function tryInjectDiffUI(): boolean {
  try {
    return tryInjectDiffPullRequestUI() || tryInjectDiffCommitUI();
  } catch (error: any) {
    showToast(`Error: ${error.message}`, "error");
    return false;
  }
}

function tryInjectDiffPullRequestUI(): boolean {
  const rootElement = document.querySelector(".js-diff-progressive-container");
  if (!rootElement) return false;

  const fileContainers = rootElement.querySelectorAll(
    '[data-details-container-group="file"]',
  );
  fileContainers.forEach(async (container) => {
    const path = container.getAttribute("data-tagsearch-path");
    if (!path) return;

    try {
      const data = await readCoverageData(path);
      const coverage = data?.files.find((file) => file.path === path);
      if (!data || !coverage) {
        console.info("[qlty] No coverage data found for file:", path);
        return;
      }

      const gutterCells = container.querySelectorAll("td[data-line-number]");
      gutterCells.forEach((cell) => {
        if (cell.classList.contains("blob-num-addition")) {
          cell
            .querySelectorAll(".qlty-coverage-line")
            .forEach((el) => el.remove());

          const lineNumber =
            parseInt(cell.getAttribute("data-line-number") ?? "") - 1;
          if (lineNumber >= 0) {
            const hit = coverage?.hits[lineNumber] ?? 0;
            const el = cell.appendChild(document.createElement("div"));
            el.classList.add("qlty-coverage-gutter");
            if (hit > 0) {
              el.classList.add("qlty-coverage-hit");
            } else if (hit < 0) {
              el.classList.add("qlty-coverage-miss");
            }
          }
        }
      });
    } catch (error: any) {
      showToast(`Error: ${error.message}`, "error");
    }
  });

  console.log("[qlty] injected diff PR UI");

  return true;
}

function tryInjectDiffCommitUI(): boolean {
  const rootElement = document.getElementById("diff-content-parent");
  if (!rootElement) return false;

  rootElement.querySelectorAll('a[href^="#diff-"').forEach(async (link) => {
    const path = (link as HTMLElement).innerText.replace("\u200E", "");
    const fileId = link.getAttribute("href")?.split("#")[1] ?? "";

    try {
      const data = await readCoverageData(path);
      const coverage = data?.files.find(
        (file) => normalizePath(file.path) === normalizePath(path),
      );
      if (!data || !coverage) {
        console.info("[qlty] No coverage data found for file:", path);
        return;
      }

      const gutterCells = rootElement.querySelectorAll(
        `[data-diff-anchor="${fileId}"] tr.diff-line-row td:nth-last-child(2)`,
      );
      gutterCells.forEach((cell) => {
        const idParts =
          cell.getAttribute("data-grid-cell-id")?.split("-") ?? [];
        if (idParts.length === 0) return;

        cell
          .querySelectorAll(".qlty-coverage-line")
          .forEach((el) => el.remove());

        const lineNumber = parseInt(idParts.at(-2) ?? "") - 1;
        if (lineNumber >= 0) {
          const hit = coverage?.hits[lineNumber] ?? 0;
          const el = cell.appendChild(document.createElement("div"));
          el.classList.add("qlty-coverage-gutter");
          if (hit > 0) {
            el.classList.add("qlty-coverage-hit");
          } else if (hit < 0) {
            el.classList.add("qlty-coverage-miss");
          }
        }
      });
    } catch (error: any) {
      showToast(`Error: ${error.message}`, "error");
    }
  });

  console.log("[qlty] injected diff commit UI");

  return true;
}

async function readCoverageData(
  path: string,
): Promise<CoverageReferenceResponse | null> {
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
      { command: "getFileCoverage", workspace, project, reference, path },
      (response: CoverageReferenceResponse | CoverageReferenceError) => {
        if ("error" in response) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      },
    );
  });
}

function observeForTargetElement() {
  if (tryInjectDiffUI()) return;

  const observer = new MutationObserver((_, obs) => {
    if (tryInjectDiffUI()) {
      obs.disconnect();
      return;
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function watchForURLChanges() {
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      observeForTargetElement();
    }
  }).observe(document, { subtree: true, childList: true });
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

observeForTargetElement();
watchForURLChanges();

console.log("[qlty] extension loaded");
