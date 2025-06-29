export const timeout = (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });
