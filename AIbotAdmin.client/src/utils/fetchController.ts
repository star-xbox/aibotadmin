let globalAbortController = new AbortController();

export function getGlobalAbortController() {
  return globalAbortController;
}

export function abortAllFetch() {
  globalAbortController.abort();
  globalAbortController = new AbortController();  // tạo signal mới
}