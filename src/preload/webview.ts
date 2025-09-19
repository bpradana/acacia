import { ipcRenderer } from "electron";

type WebviewEvent =
  | { type: "link-clicked"; url: string; tabId: string }
  | { type: "metadata"; url: string; title: string; tabId: string }
  | { type: "navigation"; url: string; tabId: string };

let tabId = "";

const emitToHost = (payload: WebviewEvent) => {
  ipcRenderer.sendToHost("webview:event", payload);
};

const isModifiedClick = (event: MouseEvent) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const shouldBypassAnchor = (anchor: HTMLAnchorElement) => {
  const rawHref = anchor.getAttribute("href");
  if (!rawHref || rawHref.trim().length === 0) return true;
  if (rawHref.startsWith("#")) return true;
  if (rawHref.startsWith("javascript:")) return true;
  if (anchor.target === "_blank" && anchor.rel.includes("external"))
    return true;
  return false;
};

const setupLinkInterceptor = () => {
  window.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (shouldBypassAnchor(anchor)) return;
      if (isModifiedClick(event)) return;

      event.preventDefault();
      emitToHost({ type: "link-clicked", url: anchor.href, tabId });
    },
    { capture: true },
  );
};

const setupMetadataObservers = () => {
  const notify = () => {
    emitToHost({
      type: "metadata",
      url: window.location.href,
      title: document.title ?? "Untitled",
      tabId,
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    notify();
  });

  window.addEventListener("hashchange", () => {
    emitToHost({ type: "navigation", url: window.location.href, tabId });
    notify();
  });

  window.addEventListener("popstate", () => {
    emitToHost({ type: "navigation", url: window.location.href, tabId });
    notify();
  });

  const titleObserver = new MutationObserver(() => {
    notify();
  });

  const title = document.querySelector("title");
  if (title) {
    titleObserver.observe(title, { childList: true });
  }
};

ipcRenderer.on("webview:init", (_event, payload: { tabId: string }) => {
  tabId = payload.tabId;
  emitToHost({ type: "navigation", url: window.location.href, tabId });
  emitToHost({
    type: "metadata",
    url: window.location.href,
    title: document.title ?? "Untitled",
    tabId,
  });
});

window.addEventListener("DOMContentLoaded", () => {
  setupLinkInterceptor();
  setupMetadataObservers();
});
