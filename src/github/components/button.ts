export function createButton(
  text: string,
  classNames: string[],
  onClick: (this: HTMLButtonElement, e: MouseEvent) => any,
  buttonContent?: HTMLSpanElement,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.classList.add('qlty-btn', 'qlty-mr-2', ...classNames);
  button.addEventListener('click', onClick.bind(button));

  const textSpan = document.createElement('span');
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
  contentElements?.forEach((element) => buttonContentElement.appendChild(element));

  return buttonContentElement;
}
