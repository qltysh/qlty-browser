export async function sendCommand<T, R>(request: T): Promise<R> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(request, (response: R) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
