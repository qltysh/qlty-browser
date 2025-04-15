export function showToast(
  message: string,
  type: "info" | "error" | "success" = "info",
): void {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".qlty-toast");
  existingToasts.forEach((toast) => toast.remove());

  const toast = document.createElement("div");
  toast.classList.add(
    "qlty-toast",
    type === "error"
      ? "qlty-toast-error"
      : type === "success"
        ? "qlty-toast-success"
        : "qlty-toast-info",
  );

  const icon = document.createElement("div");
  icon.classList.add("qlty-icon");
  toast.appendChild(icon);

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
    cursor: "pointer",
  });
  closeButton.onclick = () => document.body.removeChild(toast);

  toast.appendChild(closeButton);
  document.body.appendChild(toast);

  // setTimeout(() => {
  //   if (document.body.contains(toast)) {
  //     document.body.removeChild(toast);
  //   }
  // }, 5000);
}
