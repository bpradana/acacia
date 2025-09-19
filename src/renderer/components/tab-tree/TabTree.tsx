import * as React from 'react'
import { ChevronDown, ChevronRight, TreePine, X } from 'lucide-react'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import type { TabId, TabNode } from '@common/tabs'

interface TabTreeProps {
  nodes: Record<TabId, TabNode>
  rootIds: TabId[]
  activeTabId: TabId | null
  sidebarWidth: number
  onSelect: (tabId: TabId) => void
  onCloseTab: (tabId: TabId) => void
  onCloseSubtree: (tabId: TabId) => void
  onToggleExpand: (tabId: TabId) => void
}

export const TabTree: React.FC<TabTreeProps> = ({
  nodes,
  rootIds,
  activeTabId,
  sidebarWidth,
  onSelect,
  onCloseTab,
  onCloseSubtree,
  onToggleExpand,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {rootIds.map(rootId => (
          <TabTreeItem
            key={rootId}
            nodeId={rootId}
            level={0}
            nodes={nodes}
            activeTabId={activeTabId}
            sidebarWidth={sidebarWidth}
            onSelect={onSelect}
            onCloseTab={onCloseTab}
            onCloseSubtree={onCloseSubtree}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface TabTreeItemProps {
  nodeId: TabId
  level: number
  nodes: Record<TabId, TabNode>
  activeTabId: TabId | null
  sidebarWidth: number
  onSelect: (tabId: TabId) => void
  onCloseTab: (tabId: TabId) => void
  onCloseSubtree: (tabId: TabId) => void
  onToggleExpand: (tabId: TabId) => void
}

const INDENT_STEP = 12
const MIN_AVAILABLE_WIDTH = 140

const TabTreeItem: React.FC<TabTreeItemProps> = ({
  nodeId,
  level,
  nodes,
  activeTabId,
  sidebarWidth,
  onSelect,
  onCloseTab,
  onCloseSubtree,
  onToggleExpand,
}) => {
  const node = nodes[nodeId]
  if (!node) return null

  const hasChildren = node.children.length > 0
  const isExpanded = node.isExpanded
  const isActive = nodeId === activeTabId
  const containerRef = React.useRef<HTMLSpanElement | null>(null)
  const textRef = React.useRef<HTMLSpanElement | null>(null)
  const [isOverflowing, setIsOverflowing] = React.useState(false)
  const [overflowOffset, setOverflowOffset] = React.useState('0px')

  const paddedIndent = React.useMemo(() => {
    const maxIndent = Math.max(sidebarWidth - MIN_AVAILABLE_WIDTH, 0)
    return Math.min(level * INDENT_STEP, maxIndent)
  }, [level, sidebarWidth])

  const measureOverflow = React.useCallback(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const overflowAmount = text.scrollWidth - container.clientWidth
    if (overflowAmount > 4) {
      setIsOverflowing(true)
      setOverflowOffset(`-${overflowAmount}px`)
    } else {
      setIsOverflowing(false)
      setOverflowOffset('0px')
    }
  }, [node.title, node.url, sidebarWidth])

  React.useEffect(() => {
    measureOverflow()
  }, [measureOverflow])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (typeof ResizeObserver === 'undefined') {
      measureOverflow()
      window.addEventListener('resize', measureOverflow)
      return () => {
        window.removeEventListener('resize', measureOverflow)
      }
    }

    const observer = new ResizeObserver(() => {
      measureOverflow()
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [measureOverflow])

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'group flex min-w-0 cursor-pointer items-center rounded-md px-2 py-1 text-sm transition-colors',
          isActive ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${paddedIndent}px` }}
        onClick={() => onSelect(nodeId)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="mr-1 h-7 w-7 shrink-0 p-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            onClick={event => {
              event.stopPropagation()
              onToggleExpand(nodeId)
            }}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <span className="mr-1 h-7 w-7 shrink-0" />
        )}
        <div className="min-w-0 flex-1 pr-2">
          <span
            ref={containerRef}
            className={cn(
              'tab-label block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-foreground',
              isOverflowing && 'tab-label--overflow'
            )}
            title={node.title || node.url}
            style={{ '--tab-label-offset': overflowOffset } as React.CSSProperties}
          >
            <span ref={textRef} className="tab-label__text inline-block">
              {node.title || node.url}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={event => {
              event.stopPropagation()
              onCloseTab(nodeId)
            }}
            aria-label="Close tab"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
            onClick={event => {
              event.stopPropagation()
              onCloseSubtree(nodeId)
            }}
            aria-label="Close subtree"
          >
            <TreePine className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children.map(childId => (
            <TabTreeItem
              key={childId}
              nodeId={childId}
              level={level + 1}
              nodes={nodes}
              activeTabId={activeTabId}
              sidebarWidth={sidebarWidth}
              onSelect={onSelect}
              onCloseTab={onCloseTab}
              onCloseSubtree={onCloseSubtree}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}
