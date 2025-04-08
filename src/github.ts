import { readCoverageData } from "./api";
import { showToast } from "./toast";

export function tryInjectDiffUI(): boolean {
  try {
    return tryInjectDiffPullRequestUI() || tryInjectDiffCommitUI();
  } catch (error: any) {
    showToast(`Error: ${error.message}`, "error");
    return false;
  }
}

async function loadCoverageForPath(path: string): Promise<FileCoverage | null> {
  const data = await readCoverageData(path);
  const coverage = data?.files.find(
    (file) => normalizePath(file.path) === normalizePath(path),
  );
  if (!data || !coverage) {
    return null;
  }
  return coverage;
}

function tryInjectDiffPullRequestUI(): boolean {
  const rootElement = document.querySelector(".js-diff-progressive-container");
  if (!rootElement) return false;

  rootElement
    .querySelectorAll('[data-details-container-group="file"]')
    .forEach(async (container) => {
      await injectIntoFileContainer(
        container.querySelector(".file-info") ?? container,
        container.getAttribute("data-tagsearch-path"),
        container.querySelectorAll("td[data-line-number].blob-num-addition"),
      );
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

    await injectIntoFileContainer(
      link.parentElement ?? link,
      path,
      rootElement.querySelectorAll(
        `[data-diff-anchor="${fileId}"] tr.diff-line-row td:nth-last-child(2)`,
      ),
    );
  });

  console.log("[qlty] injected diff commit UI");

  return true;
}

async function injectIntoFileContainer(
  container: Element,
  path: string | null,
  gutterCells: NodeListOf<Element>,
) {
  if (!path) return;

  try {
    const coverage = await loadCoverageForPath(path);
    if (!coverage) {
      const el = container.appendChild(document.createElement("div"));
      el.classList.add("qlty-coverage-error-missing");
      return;
    }
    gutterCells.forEach((cell) => injectIntoGutterCell(cell, coverage));
  } catch (error: any) {
    showToast(`Error: ${error.message}`, "error");
  }
}

function injectIntoGutterCell(cell: Element, coverage: FileCoverage): void {
  cell.querySelectorAll(".qlty-coverage-line").forEach((el) => el.remove());

  let lineNumber = NaN;
  if (cell.hasAttribute("data-grid-cell-id")) {
    const idParts = cell.getAttribute("data-grid-cell-id")?.split("-") ?? [];
    lineNumber = parseInt(idParts.at(-2) ?? "") - 1;
  }
  if (cell.hasAttribute("data-line-number")) {
    lineNumber = parseInt(cell.getAttribute("data-line-number") ?? "") - 1;
  }
  if (Number.isNaN(lineNumber) || lineNumber < 0) {
    return;
  }

  const hit = coverage.hits[lineNumber] ?? 0;
  const el = cell.appendChild(document.createElement("div"));
  el.classList.add("qlty-coverage-gutter");
  if (hit > 0) {
    el.classList.add("qlty-coverage-hit");
  } else if (hit === 0) {
    el.classList.add("qlty-coverage-miss");
  } else if (hit < 0) {
    el.classList.add("qlty-coverage-omit");
  }
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
