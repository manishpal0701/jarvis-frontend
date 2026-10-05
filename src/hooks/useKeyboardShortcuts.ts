import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onToggleChat: () => void;
  onCloseChat: () => void;
}

export function useKeyboardShortcuts({ onToggleChat, onCloseChat }: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      // If user is actively typing in an input/textarea, ignore shortcuts
      if (isTyping) {
        return;
      }

      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        onToggleChat();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCloseChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleChat, onCloseChat]);
}
