export function createButton(
  text: string,
  className: string,
  onClick: (this: HTMLButtonElement, e: MouseEvent) => any,
  buttonContent?: HTMLSpanElement,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `Button Button--small Button--secondary ${className}`;
  button.addEventListener('click', onClick.bind(button));

  const textSpan = document.createElement('span');
  textSpan.classList.add('Button-label');
  textSpan.textContent = text;

  buttonContent = buttonContent ?? createButtonContent();
  buttonContent.appendChild(textSpan);
  if (buttonContent) {
    button.appendChild(buttonContent);
  }

  return button;
}

export function createButtonContent(
  contentElements?: HTMLElement[],
): HTMLSpanElement {
  const buttonContentElement = document.createElement('span');
  buttonContentElement.classList.add('Button-content');
  contentElements?.forEach((element) => buttonContentElement.appendChild(element));

  return buttonContentElement;
}
