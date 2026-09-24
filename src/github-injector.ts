import { readCoverageData } from "./api";
import { createButton, createButtonContent } from "./github/components/button";
import { SELECTOR_PR_REVIEW_TOOLS } from "./github/components/selectors";

const coverageData = new Map<string, FileCoverage>();

export function tryInjectDiffUI(): void {
  try {
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

async function loadCoverageForPath(path: string): Promise<FileCoverage | null> {
  path = normalizePath(path);
  let cached = coverageData.get(path);
  if (cached) return cached;

  const data = await readCoverageData(path);
  const coverage = data?.files.find(
    (file) => normalizePath(file.path) === path,
  );
  if (!data || !coverage) {
    return null;
  }
  coverageData.set(path, coverage);
  return coverage;
}

const uncoveredLineKeyListener = (event: KeyboardEvent) => {
  const ignoredTags = new Set(["INPUT", "TEXTAREA", "SELECT"]);

  const isTypingInEditable = (element: EventTarget | null) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    return (
      element?.isContentEditable === true || ignoredTags.has(element?.tagName)
    );
  };

  const { key, target, ctrlKey, metaKey, altKey, repeat } = event;
  if (key !== "n" || ctrlKey || metaKey || altKey || repeat) {
    return;
  }

  if (isTypingInEditable(target)) {
    // ignore when focus is in an input-like or contentEditable element
    return;
  }

  event.preventDefault();
  jumpToNextUncoveredLine();
};

function setupJumpToUncoveredLineHotkey() {
  document.removeEventListener("keydown", uncoveredLineKeyListener);
  document.addEventListener("keydown", uncoveredLineKeyListener);
}

async function tryInjectDiffCommitUI(): Promise<void> {
  const rootElement =
    document.getElementById("diff-content-parent") || document.body;
  if (rootElement.classList.contains("qlty-diff-ui")) return;

  const links: Element[] = [];
  rootElement.querySelectorAll('a[href^="#diff-"').forEach((link) => {
    if (!link.classList.contains("Link--primary")) return;
    if (link.classList.contains("qlty-diff-link")) return; // Skip if already injected
    link.classList.add("qlty-diff-link");
    links.push(link);
  });

  await processFileLinks(rootElement, links);

  if (isPRPage()) {
    addPRPageBadge();
    addNextUncoveredLineButton();
  } else {
    addDiffPageBadge();
  }

  console.log("[qlty] injected diff UI");
  rootElement.classList.add("qlty-diff-ui");
}

async function processFileLinks(rootElement: HTMLElement, links: Element[]) {
  const promises: Promise<void>[] = [];

  for (const link of links) {
    const path = (link as HTMLElement).innerText.replace("\u200E", "");
    const fileId = link.getAttribute("href")?.split("#")[1] ?? "";

    promises.push(injectIntoFileContainer(
      link.parentElement?.parentElement ?? link,
      path,
      rootElement.querySelectorAll(
        `[data-diff-anchor="${fileId}"] td:nth-last-child(2)`,
      ),
    ));
  }

  return Promise.all(promises);
}

function isPRPage(): boolean {
  return !!(
    document.querySelector(".pull-request-tab-content") ||
    document.querySelector("react-app[app-name='pull-request-files']")
  );
}

function addPRPageBadge(): void {
  const badge = createBadge("pr");
  if (!badge) return;

  const header = document.querySelector(".gh-header-actions");
  if (header) {
    header.prepend(badge);
  }

  const actions = document.querySelector("[data-component=PH_Actions]");
  if (actions) {
    actions.insertBefore(badge, actions.querySelector("button")!);
    badge.style.order = "inherit";
  }
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

function getUncoveredLineDivs(): HTMLDivElement[] {
  return Array.from(document.querySelectorAll(".qlty-coverage-miss"));
}

function jumpToNextUncoveredLine() {
  const uncoveredLineDivs = getUncoveredLineDivs();
  if (uncoveredLineDivs.length === 0) {
    return;
  }

  const currentlySelectedIndex = uncoveredLineDivs.findIndex((el) =>
    el.parentElement?.classList.contains("selected-line"),
  );

  const currentElement = uncoveredLineDivs[currentlySelectedIndex];
  if (currentElement) {
    // Click the current line to deselect it; this is necessary to make sure
    // the selected line doesn't stay selected (occurs sometimes during back/forward nav)
    selectLinkableLine(currentElement.parentElement!);
  }

  const nextIndex = (currentlySelectedIndex + 1) % uncoveredLineDivs.length;
  const nextElement = uncoveredLineDivs[nextIndex];
  nextElement.scrollIntoView({ behavior: "smooth", block: "center" });

  const linkableLine = nextElement.parentElement!;
  if (!linkableLine.classList.contains("js-linkable-line-number")) {
    console.warn("[qlty] Could not find linkable line number");
    return;
  }

  selectLinkableLine(linkableLine);
}

function selectLinkableLine(linkableLine: HTMLElement) {
  // Click the line to highlight it
  // If we don't also trigger a click event, then our line gets unhighlighted on
  // subsequent button clicks
  linkableLine.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  linkableLine.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  linkableLine.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function addNextUncoveredLineButton(): void {
  const prReviewToolsDiv = document.querySelector(SELECTOR_PR_REVIEW_TOOLS);
  if (!prReviewToolsDiv) {
    return;
  }

  let existingButton = document.querySelector(".qlty-btn-next-uncovered-line");
  if (existingButton) {
    return;
  }

  if (getUncoveredLineDivs().length === 0) {
    // No uncovered lines
    return;
  }

  const buttonIcon = document.createElement("span");
  buttonIcon.classList.add("qlty-icon");

  const button = createButton(
    "Jump to next uncovered line",
    [
      "qlty-btn-next-uncovered-line",
      prReviewToolsDiv.lastElementChild ? "qlty-mr-2" : "qlty-ml-2",
    ],
    (e) => {
      e.preventDefault();
      jumpToNextUncoveredLine();
    },
    createButtonContent([buttonIcon]),
  );

  if (prReviewToolsDiv.lastElementChild) {
    prReviewToolsDiv.insertBefore(button, prReviewToolsDiv.lastElementChild);
  } else {
    prReviewToolsDiv.appendChild(button);
  }

  setupJumpToUncoveredLineHotkey();
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
  const covPercent =
    (coverage.coveredLines / (coverage.coveredLines + coverage.missedLines)) *
    100;
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
