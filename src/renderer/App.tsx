import * as React from 'react'
import { BrowserToolbar } from '@renderer/components/toolbar/BrowserToolbar'
import { TabTree } from '@renderer/components/tab-tree/TabTree'
import { WebviewManager } from '@renderer/components/webview/WebviewManager'
import { useTabStore } from '@renderer/stores/tabStore'
import { Button } from '@renderer/components/ui/button'
import { HOME_URL, type TabId, type TabNode } from '@common/tabs'
import { Plus } from 'lucide-react'

const flattenTabs = (nodes: Record<TabId, TabNode>, rootIds: TabId[]): TabNode[] => {
  const ordered: TabNode[] = []

  const visit = (id: TabId) => {
    const node = nodes[id]
    if (!node) return
    ordered.push(node)
    node.children.forEach(visit)
  }

  rootIds.forEach(visit)

  return ordered
}

const ensureHttpUrl = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export const App: React.FC = () => {
  const {
    nodes,
    rootIds,
    activeTabId,
    createTab,
    activateTab,
    updateTabMetadata,
    updateTabUrl,
    closeTab,
    closeSubtree,
    toggleExpanded,
  } = useTabStore()

  const activeTab = activeTabId ? nodes[activeTabId] : null
  const [addressValue, setAddressValue] = React.useState(activeTab?.url ?? HOME_URL)
  const [navigationState, setNavigationState] = React.useState({
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
  })

  const preloadPath = React.useMemo(() => window.electronAPI.getPreloadPath('webview'), [])
  const webviewRefs = React.useRef(new Map<TabId, Electron.WebviewTag>())

  const tabList = React.useMemo(() => flattenTabs(nodes, rootIds), [nodes, rootIds])

  React.useEffect(() => {
    if (activeTab) {
      console.debug('[app] active tab changed', { tabId: activeTab.id, url: activeTab.url })
      setAddressValue(activeTab.url)
      setNavigationState({ canGoBack: false, canGoForward: false, isLoading: false })
    }
  }, [activeTab?.id, activeTab?.url])

  React.useEffect(() => {
    if (!activeTabId) {
      setNavigationState({ canGoBack: false, canGoForward: false, isLoading: false })
    }
  }, [activeTabId])

  const markProgrammaticNavigation = React.useCallback(
    (tabId: TabId) => {
      const webview = webviewRefs.current.get(tabId)
      if (!webview) return null
      ;(webview as unknown as { __acaciaProgrammatic?: boolean }).__acaciaProgrammatic = true
      return webview
    },
    []
  )

  const handleAddressSubmit = () => {
    if (!activeTabId) return
    const normalized = ensureHttpUrl(addressValue)
    if (!normalized) return
    const webview = markProgrammaticNavigation(activeTabId)
    if (!webview) return
    webview.loadURL(normalized)
    updateTabUrl(activeTabId, normalized)
  }

  const handleOpenLink = (sourceTabId: TabId, url: string) => {
    const normalized = ensureHttpUrl(url) ?? url
    console.debug('[app] open link request', { sourceTabId, url: normalized })
    createTab({ parentId: sourceTabId, url: normalized, title: 'Loading…' })
  }

  const handleMetadata = (tabId: TabId, metadata: { title: string; url: string }) => {
    updateTabMetadata(tabId, metadata)
  }

  const handleNavigation = (tabId: TabId, url: string) => {
    updateTabUrl(tabId, url)
    if (tabId === activeTabId) {
      setAddressValue(url)
    }
  }

  const handleNavigationStateChange = (
    tabId: TabId,
    state: { canGoBack: boolean; canGoForward: boolean; isLoading: boolean }
  ) => {
    if (tabId === activeTabId) {
      setNavigationState(state)
    }
  }

  const handleCloseTab = (tabId: TabId) => {
    closeTab(tabId)
  }

  const handleCloseSubtree = (tabId: TabId) => {
    closeSubtree(tabId)
  }

  const handleNewRootTab = () => {
    createTab({ parentId: null, url: HOME_URL, title: 'Home' })
  }

  const handleGoBack = () => {
    if (!activeTabId) return
    const webview = markProgrammaticNavigation(activeTabId)
    if (webview?.canGoBack?.()) {
      webview.goBack()
    }
  }

  const handleGoForward = () => {
    if (!activeTabId) return
    const webview = markProgrammaticNavigation(activeTabId)
    if (webview?.canGoForward?.()) {
      webview.goForward()
    }
  }

  const handleReload = () => {
    if (!activeTabId) return
    const webview = markProgrammaticNavigation(activeTabId)
    webview?.reload()
  }

  const handleGoHome = () => {
    if (!activeTabId) return
    const webview = markProgrammaticNavigation(activeTabId)
    if (!webview) return
    webview.loadURL(HOME_URL)
    updateTabUrl(activeTabId, HOME_URL)
  }

  return (
    <div className="flex h-full bg-background text-foreground">
      <aside className="flex w-72 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tab Tree</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNewRootTab}
            aria-label="New root tab"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <TabTree
          nodes={nodes}
          rootIds={rootIds}
          activeTabId={activeTabId}
          onSelect={activateTab}
          onCloseTab={handleCloseTab}
          onCloseSubtree={handleCloseSubtree}
          onToggleExpand={toggleExpanded}
        />
      </aside>
      <div className="flex flex-1 flex-col">
        <BrowserToolbar
          address={addressValue}
          onAddressChange={setAddressValue}
          onSubmitAddress={handleAddressSubmit}
          canGoBack={navigationState.canGoBack}
          canGoForward={navigationState.canGoForward}
          isLoading={navigationState.isLoading}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onReload={handleReload}
          onGoHome={handleGoHome}
          onNewRootTab={handleNewRootTab}
        />
        <div className="flex-1 bg-muted">
          <WebviewManager
            tabs={tabList}
            activeTabId={activeTabId}
            preloadPath={preloadPath}
            onLinkOpen={handleOpenLink}
            onMetadata={handleMetadata}
            onNavigation={handleNavigation}
            onNavigationStateChange={handleNavigationStateChange}
            webviewRefs={webviewRefs}
          />
        </div>
      </div>
    </div>
  )
}
