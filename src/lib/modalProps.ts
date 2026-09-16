/** Spread onto `WuModal` — `WuModalContent` is a div and ignores these handlers. */
export const preventModalDismiss = {
  preventClickOutside: true,
  onEscapeKeyDown: (event: KeyboardEvent) => event.preventDefault(),
}
