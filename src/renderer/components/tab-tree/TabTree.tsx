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
const MARQUEE_BASE_SPEED_PX_PER_SEC = 40
const MARQUEE_MIN_DURATION_SEC = 3
const MARQUEE_MAX_DURATION_SEC = 12
const MARQUEE_IDLE_DELAY_MS = 600
const LABEL_RESERVED_WIDTH = 108
const LABEL_MIN_WIDTH = 72

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
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const textRef = React.useRef<HTMLSpanElement | null>(null)
  const [isOverflowing, setIsOverflowing] = React.useState(false)
  const [overflowOffset, setOverflowOffset] = React.useState('0px')
  const [animationDuration, setAnimationDuration] = React.useState<string | null>(null)
  const [animationDelay, setAnimationDelay] = React.useState<string | null>(null)

  const paddedIndent = React.useMemo(() => {
    const maxIndent = Math.max(sidebarWidth - MIN_AVAILABLE_WIDTH, 0)
    return Math.min(level * INDENT_STEP, maxIndent)
  }, [level, sidebarWidth])

  const availableLabelWidth = React.useMemo(() => {
    const maxWidth = sidebarWidth - paddedIndent - LABEL_RESERVED_WIDTH
    return Math.max(maxWidth, LABEL_MIN_WIDTH)
  }, [paddedIndent, sidebarWidth])

  const measureOverflow = React.useCallback(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const overflowAmount = text.scrollWidth - container.clientWidth
    if (overflowAmount > 4) {
      setIsOverflowing(true)
      const distance = Math.max(overflowAmount, 0)
      const durationSeconds = Math.min(
        Math.max(distance / MARQUEE_BASE_SPEED_PX_PER_SEC, MARQUEE_MIN_DURATION_SEC),
        MARQUEE_MAX_DURATION_SEC
      )
      setOverflowOffset(`-${distance}px`)
      setAnimationDuration(`${durationSeconds.toFixed(2)}s`)
      setAnimationDelay(`${(MARQUEE_IDLE_DELAY_MS / 1000).toFixed(2)}s`)
    } else {
      setIsOverflowing(false)
      setOverflowOffset('0px')
      setAnimationDuration(null)
      setAnimationDelay(null)
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('tab-tree:overflow-check', {
        id: nodeId,
        sidebarWidth,
        clientWidth: container.clientWidth,
        scrollWidth: text.scrollWidth,
        overflowAmount,
        paddedIndent,
        availableLabelWidth,
      })
    }
  }, [availableLabelWidth, node.title, node.url, nodeId, paddedIndent, sidebarWidth])

  const labelStyle = React.useMemo(
    () =>
      ({
        width: `${availableLabelWidth}px`,
        maxWidth: `${availableLabelWidth}px`,
        '--tab-label-offset': overflowOffset,
        ...(animationDuration ? { '--tab-label-duration': animationDuration } : {}),
        ...(animationDelay ? { '--tab-label-delay': animationDelay } : {}),
      }) as React.CSSProperties,
    [animationDelay, animationDuration, availableLabelWidth, overflowOffset]
  )

  React.useLayoutEffect(() => {
    measureOverflow()
  }, [measureOverflow])

  React.useLayoutEffect(() => {
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
          <div
            ref={containerRef}
            className={cn(
              'tab-label relative block overflow-hidden whitespace-nowrap font-medium text-foreground',
              isOverflowing ? 'tab-label--overflow' : 'tab-label--clamped'
            )}
            title={node.title || node.url}
            style={labelStyle}
          >
            <span ref={textRef} className="tab-label__text inline-block">
              {node.title || node.url}
            </span>
          </div>
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
