import { readCoverageData } from "./api";

const coverageData = new Map<string, FileCoverage>();

export function tryInjectDiffUI(): void {
  try {
    tryInjectDiffPullRequestUI();
    tryInjectDiffCommitUI();

    // Set up observer for future tab changes
    const observer = new MutationObserver((mutations) => {
      let update = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" || mutation.addedNodes.length > 0) {
          update = true;
        }
      });

      if (update) {
        tryInjectDiffPullRequestUI();
        tryInjectDiffCommitUI();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (error: any) {
    console.warn(`[qlty] Could not load coverage: ${error.message}`);
  }
}

function getRef() {
  const commitSha = getPullRequestCommitSha();
  if (commitSha) {
    return commitSha;
  }

  const ref = getRefFromUrl();
  if (ref) {
    return ref;
  }

  return null;
}

function getPullRequestCommitSha() {
  // Retrieve the SHA from the "changes from ..." picker
  const finalCommitElement = document.querySelector("#files_bucket details-menu [data-commit]:last-child");

  return finalCommitElement?.getAttribute('data-commit') ?? null;
}

function getRefFromUrl() {
  const pathParts = window.location.pathname.split("/");

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

  return reference;
}

async function loadCoverageForPath(path: string): Promise<FileCoverage | null> {
  path = normalizePath(path);
  let cached = coverageData.get(path);
  if (cached) return cached;

  const ref = getRef();
  if (!ref) {
    console.warn("[qlty] No reference found for coverage data");
    return null;
  }

  const data = await readCoverageData(path, ref);

  const coverage = data?.files.find(
    (file) => normalizePath(file.path) === path,
  );
  if (!data || !coverage) {
    return null;
  }
  coverageData.set(path, coverage);
  return coverage;
}

function tryInjectDiffPullRequestUI() {
  document.querySelectorAll(".js-diff-progressive-container").forEach((el) => {
    tryInjectDiffPullRequestUIElement(el as HTMLElement);
  });
}

function tryInjectDiffPullRequestUIElement(
  rootElement: HTMLElement | null,
): void {
  if (!rootElement) return;
  if (rootElement.classList.contains("qlty-diff-ui")) return;

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
  addPRPageBadge();
  rootElement.classList.add("qlty-diff-ui");
}

function addPRPageBadge(): void {
  const badge = createBadge("pr");
  if (!badge) return;
  document.querySelector(".gh-header-actions")?.prepend(badge);
}

function tryInjectDiffCommitUI(): void {
  const rootElement = document.getElementById("diff-content-parent");
  if (!rootElement) return;
  if (rootElement.classList.contains("qlty-diff-ui")) return;

  const links: Element[] = [];
  rootElement.querySelectorAll('a[href^="#diff-"').forEach((link) => {
    if (link.classList.contains("qlty-diff-link")) return; // Skip if already injected
    link.classList.add("qlty-diff-link");
    links.push(link);
  });

  if (links.length === 0) {
    return; // No links to process
  }

  links.forEach(async (link) => {
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
  addDiffPageBadge();
  rootElement.classList.add("qlty-diff-ui");
}

function addDiffPageBadge(): void {
  const badge = createBadge("commit");
  if (!badge) return;
  document.querySelector("[data-component=PH_Actions] div")?.prepend(badge);
}

function createBadge(type: "pr" | "commit"): HTMLDivElement | null {
  if (document.querySelector(".qlty-diff-badge")) {
    return null;
  }
  const badge = document.createElement("div");
  badge.classList.add("qlty-diff-badge");
  badge.classList.add(`qlty-diff-badge-${type}`);
  badge.appendChild(document.createElement("div")).classList.add("qlty-icon");
  return badge;
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
      return;
    }
    injectCoverageSummary(container, coverage);
    gutterCells.forEach((cell) => injectIntoGutterCell(cell, coverage));
  } catch (error: any) {
    console.warn(`[qlty] Could not load coverage: ${error.message}`);
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
  const covPercent = coverage.coveredLines / (coverage.coveredLines + coverage.missedLines) * 100;
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
