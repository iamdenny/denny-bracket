export function createHistory(limit = 40) {
  let past = [], future = [];
  return {
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    push(state) { past.push(structuredClone(state)); past = past.slice(-limit); future = []; },
    undo(current) {
      if (!past.length) return null;
      future.push(structuredClone(current));
      return past.pop();
    },
    redo(current) {
      if (!future.length) return null;
      past.push(structuredClone(current));
      return future.pop();
    },
  };
}
