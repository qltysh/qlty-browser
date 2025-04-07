export function showToast(message: string, type: "info" | "error" | "success" = "info"): void {
  const toast = document.createElement("div");

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "10px 20px",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "14px",
    maxWidth: "300px",
    boxShadow: "0 3px 6px rgba(0,0,0,0.16)",
    zIndex: "10000",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: type === "error" ? "#f44336" :
      type === "success" ? "#4caf50" : "#2196f3"
  });

  const textSpan = document.createElement("span");
  textSpan.textContent = message;
  toast.appendChild(textSpan);

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  Object.assign(closeButton.style, {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "18px",
    marginLeft: "10px",
    cursor: "pointer"
  });
  closeButton.onclick = () => document.body.removeChild(toast);

  toast.appendChild(closeButton);
  document.body.appendChild(toast);

  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
}
