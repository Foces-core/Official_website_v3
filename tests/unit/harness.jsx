import { act } from 'react';
import { createRoot } from 'react-dom/client';

// Shared render harness for component/hook unit specs. Each spec gets its own
// root inside the jsdom body; the harness owns the act() wrapping and the
// teardown, so specs stay focused on behavior instead of copy-pasting
// createRoot/act boilerplate (previously duplicated across every JSX spec).
export function createHarness() {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  return {
    container,
    render(node) {
      act(() => root.render(node));
    },
    async renderAsync(node) {
      await act(async () => root.render(node));
    },
    unmount() {
      act(() => root.unmount());
      document.body.innerHTML = '';
    },
  };
}
