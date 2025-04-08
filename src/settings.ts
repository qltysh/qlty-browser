// TypeScript conversion of settings.js
document.addEventListener("DOMContentLoaded", function () {
  // Get references to DOM elements
  const apiTokenInput = document.getElementById("apiToken") as HTMLInputElement;
  const apiUrlInput = document.getElementById("apiUrl") as HTMLInputElement;
  const saveButton = document.getElementById("saveButton") as HTMLButtonElement;
  const statusMessage = document.getElementById("statusMessage") as HTMLElement;

  // Load saved settings when the page opens
  chrome.storage.sync.get(
    ["apiToken", "apiUrl"],
    function (result: { apiToken?: string; apiUrl?: string }) {
      if (result.apiToken) {
        apiTokenInput.value = result.apiToken;
      }
      if (result.apiUrl) {
        apiUrlInput.value = result.apiUrl;
      }
    },
  );

  // Save settings when the save button is clicked
  saveButton.addEventListener("click", function () {
    const apiToken = apiTokenInput.value.trim();
    const apiUrl = apiUrlInput.value.trim();

    // Save to Chrome storage
    chrome.storage.sync.set(
      {
        apiToken: apiToken,
        apiUrl: apiUrl,
      },
      function () {
        showStatus("Settings saved successfully!", "success");
      },
    );
  });

  function showStatus(message: string, type: "success" | "error"): void {
    statusMessage.textContent = message;
    statusMessage.className = "status " + type;
    statusMessage.style.display = "block";

    // Hide the message after 3 seconds
    setTimeout(function () {
      statusMessage.style.display = "none";
    }, 3000);
  }
});
