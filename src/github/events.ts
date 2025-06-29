import { isCommitPage, IsPageFn, isReviewPage } from "~/github/pages.ts";

export type OnPageOpenCallback = () => void;

export function onPageChange(onChange: (pathname: string) => void) {
  const observable = () => document.location.pathname;

  let oldValue = observable();
  const observer = new MutationObserver(() => {
    const newValue = observable();

    if (oldValue !== newValue) {
      oldValue = newValue;
      onChange(newValue);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function onPageOpen(isPage: IsPageFn, cb: OnPageOpenCallback) {
  if (isPage(document.location.pathname)) {
    cb();
  }

  onPageChange((page) => {
    if (!isPage(page)) {
      return;
    }

    cb();
  });
}

export const onReviewPageOpen = (cb: OnPageOpenCallback) =>
  onPageOpen(isReviewPage, cb);

export const onCommitPageOpen = (cb: OnPageOpenCallback) =>
  onPageOpen(isCommitPage, cb);
