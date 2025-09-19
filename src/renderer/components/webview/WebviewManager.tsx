import * as React from "react";
import { cn } from "@renderer/lib/utils";
import type { TabId, TabNode } from "@common/tabs";

interface WebviewManagerProps {
  tabs: TabNode[];
  activeTabId: TabId | null;
  preloadPath: string;
  onLinkOpen: (sourceTabId: TabId, url: string) => void;
  onMetadata: (tabId: TabId, metadata: { title: string; url: string }) => void;
  onNavigation: (tabId: TabId, url: string) => void;
  onNavigationStateChange: (
    tabId: TabId,
    state: { canGoBack: boolean; canGoForward: boolean; isLoading: boolean },
  ) => void;
  webviewRefs: React.MutableRefObject<Map<TabId, Electron.WebviewTag>>;
}

export const WebviewManager: React.FC<WebviewManagerProps> = ({
  tabs,
  activeTabId,
  preloadPath,
  onLinkOpen,
  onMetadata,
  onNavigation,
  onNavigationStateChange,
  webviewRefs,
}) => {
  const register = React.useCallback(
    (tabId: TabId, element: Electron.WebviewTag) => {
      webviewRefs.current.set(tabId, element);
    },
    [webviewRefs],
  );

  const unregister = React.useCallback(
    (tabId: TabId) => {
      webviewRefs.current.delete(tabId);
    },
    [webviewRefs],
  );

  React.useEffect(() => {
    if (!activeTabId) return;
    const webview = webviewRefs.current.get(activeTabId);
    if (
      !webview ||
      !(webview as unknown as { __acaciaReady?: boolean }).__acaciaReady
    ) {
      return;
    }

    onNavigationStateChange(activeTabId, {
      canGoBack: Boolean(webview.canGoBack && webview.canGoBack()),
      canGoForward: Boolean(webview.canGoForward && webview.canGoForward()),
      isLoading: Boolean(webview.isLoading && webview.isLoading()),
    });
  }, [activeTabId, onNavigationStateChange, webviewRefs]);

  return (
    <div className="relative h-full w-full">
      {tabs.map((tab) => (
        <WebviewItem
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          preloadPath={preloadPath}
          register={register}
          unregister={unregister}
          onLinkOpen={onLinkOpen}
          onMetadata={onMetadata}
          onNavigation={onNavigation}
          onNavigationStateChange={onNavigationStateChange}
        />
      ))}
    </div>
  );
};

interface WebviewItemProps {
  tab: TabNode;
  active: boolean;
  preloadPath: string;
  register: (tabId: TabId, element: Electron.WebviewTag) => void;
  unregister: (tabId: TabId) => void;
  onLinkOpen: (tabId: TabId, url: string) => void;
  onMetadata: (tabId: TabId, metadata: { title: string; url: string }) => void;
  onNavigation: (tabId: TabId, url: string) => void;
  onNavigationStateChange: (
    tabId: TabId,
    state: { canGoBack: boolean; canGoForward: boolean; isLoading: boolean },
  ) => void;
}

const WebviewItem: React.FC<WebviewItemProps> = ({
  tab,
  active,
  preloadPath,
  register,
  unregister,
  onLinkOpen,
  onMetadata,
  onNavigation,
  onNavigationStateChange,
}) => {
  const elementRef = React.useRef<Electron.WebviewTag | null>(null);
  const readyRef = React.useRef(false);

  const emitNavigationState = React.useCallback(() => {
    if (!readyRef.current) return;
    const element = elementRef.current;
    if (!element) return;
    onNavigationStateChange(tab.id, {
      canGoBack: Boolean(element.canGoBack && element.canGoBack()),
      canGoForward: Boolean(element.canGoForward && element.canGoForward()),
      isLoading: Boolean(element.isLoading && element.isLoading()),
    });
  }, [onNavigationStateChange, tab.id]);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    register(tab.id, element);

    const handleIpcMessage = (event: Electron.IpcMessageEvent) => {
      if (event.channel !== "webview:event") return;
      const payload = event.args[0] as
        | { type: "link-clicked"; url: string; tabId: TabId }
        | { type: "metadata"; url: string; title: string; tabId: TabId }
        | { type: "navigation"; url: string; tabId: TabId };

      if (!payload) return;

      switch (payload.type) {
        case "link-clicked":
          onLinkOpen(tab.id, payload.url);
          break;
        case "metadata":
          onMetadata(tab.id, { title: payload.title, url: payload.url });
          break;
        case "navigation":
          onNavigation(tab.id, payload.url);
          emitNavigationState();
          break;
        default:
          break;
      }
    };

    const handleDidNavigate = (
      navigateEvent: Electron.Event & { url: string },
    ) => {
      if (!readyRef.current) return;
      const currentUrl = element.getURL?.() ?? navigateEvent.url;
      if (currentUrl) {
        onNavigation(tab.id, currentUrl);
      }
      emitNavigationState();
    };

    const handleDomReady = () => {
      readyRef.current = true;
      (element as unknown as { __acaciaReady?: boolean }).__acaciaReady = true;
      element.setAudioMuted(true);
      element.send("webview:init", { tabId: tab.id });
      const currentUrl = element.getURL?.();
      if (currentUrl) {
        onNavigation(tab.id, currentUrl);
      }
      emitNavigationState();
    };

    const handleLoading = () => {
      if (!readyRef.current) return;
      emitNavigationState();
    };

    const handleWillNavigate = (
      navigateEvent: Electron.Event & { url: string },
    ) => {
      const targetUrl = navigateEvent.url;
      if (!targetUrl) return;

      const elementAny = element as unknown as {
        __acaciaProgrammatic?: boolean;
      };

      if (!readyRef.current) {
        elementAny.__acaciaProgrammatic = false;
        return;
      }

      if (elementAny.__acaciaProgrammatic) {
        elementAny.__acaciaProgrammatic = false;
        return;
      }

      navigateEvent.preventDefault();
      onLinkOpen(tab.id, targetUrl);
    };

    element.addEventListener("ipc-message", handleIpcMessage);
    element.addEventListener("did-navigate", handleDidNavigate as any);
    element.addEventListener("did-navigate-in-page", handleDidNavigate as any);
    element.addEventListener("dom-ready", handleDomReady as any);
    element.addEventListener("did-start-loading", handleLoading as any);
    element.addEventListener("did-stop-loading", handleLoading as any);
    element.addEventListener("will-navigate", handleWillNavigate as any);

    return () => {
      element.removeEventListener("ipc-message", handleIpcMessage);
      element.removeEventListener("did-navigate", handleDidNavigate as any);
      element.removeEventListener(
        "did-navigate-in-page",
        handleDidNavigate as any,
      );
      element.removeEventListener("dom-ready", handleDomReady as any);
      element.removeEventListener("did-start-loading", handleLoading as any);
      element.removeEventListener("did-stop-loading", handleLoading as any);
      element.removeEventListener("will-navigate", handleWillNavigate as any);
      unregister(tab.id);
      readyRef.current = false;
      (element as unknown as { __acaciaReady?: boolean }).__acaciaReady = false;
    };
  }, [
    emitNavigationState,
    onLinkOpen,
    onMetadata,
    onNavigation,
    register,
    tab.id,
    unregister,
  ]);

  const setRef = React.useCallback((element: Electron.WebviewTag | null) => {
    elementRef.current = element;
  }, []);

  return (
    <webview
      ref={setRef}
      preload={preloadPath}
      allowpopups={false}
      src={tab.url}
      className={cn(
        "absolute inset-0 h-full w-full rounded-md bg-white transition-opacity duration-150",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    />
  );
};
