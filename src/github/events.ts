export const addPageLoadListener = (cb: () => any) => {
  // GitHub uses hotwired/turbo under the hood
  document.addEventListener('turbo:load', () => {
    cb();
  });
};
