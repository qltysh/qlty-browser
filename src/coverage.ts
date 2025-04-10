import "./coverage.css";
import { tryInjectDiffUI } from "./github";

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

observeForTargetElement();
watchForURLChanges();

console.log("[qlty] extension loaded");
