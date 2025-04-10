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
        container.querySelectorAll("td[data-line-number].js-blob-rnum"),
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
      link.parentElement?.parentElement ?? link,
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

  if (gutterCells.length === 0) {
    return;
  }

  try {
    const coverage = await loadCoverageForPath(path);
    if (!coverage) {
      injectMissingCoverageElement(container);
      return;
    }
    injectCoverageSummary(container, coverage);
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

function injectMissingCoverageElement(container: Element): void {
  container
    .querySelectorAll(".qlty-coverage-summary")
    .forEach((el) => el.remove());

  const el = container.appendChild(document.createElement("div"));
  el.classList.add("qlty-coverage-summary");
  const icon = el.appendChild(document.createElement("div"));
  icon.classList.add("qlty-icon");
  el.appendChild(document.createTextNode("Missing coverage"));
}

function injectCoverageSummary(
  container: Element,
  coverage: FileCoverage,
): void {
  container
    .querySelectorAll(".qlty-coverage-summary")
    .forEach((el) => el.remove());

  const el = container.appendChild(document.createElement("div"));
  el.classList.add("qlty-coverage-summary");
  const icon = el.appendChild(document.createElement("div"));
  icon.classList.add("qlty-icon");
  el.appendChild(document.createTextNode("Coverage: "));
  const percent = el.appendChild(document.createElement("span"));
  const covPercent = (coverage.coveredLines / coverage.totalLines) * 100;
  percent.innerText = `${covPercent.toFixed(2)}%`;
  const progress = el.appendChild(document.createElement("div"));
  progress.classList.add("qlty-coverage-progress");
  const progressInner = progress.appendChild(document.createElement("div"));
  progressInner.classList.add("qlty-coverage-progress-inner");
  if (covPercent >= 75) {
    progressInner.classList.add("qlty-coverage-progress-good");
  } else if (covPercent >= 50) {
    progressInner.classList.add("qlty-coverage-progress-warning");
  } else {
    progressInner.classList.add("qlty-coverage-progress-bad");
  }
  progressInner.style.width = `${covPercent}%`;
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}
