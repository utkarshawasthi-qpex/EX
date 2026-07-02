export const preventModalDismiss = {
  onInteractOutside: (event: Event) => event.preventDefault(),
  onEscapeKeyDown: (event: KeyboardEvent) => event.preventDefault(),
}
