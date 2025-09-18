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
  onSelect: (tabId: TabId) => void
  onCloseTab: (tabId: TabId) => void
  onCloseSubtree: (tabId: TabId) => void
  onToggleExpand: (tabId: TabId) => void
}

export const TabTree: React.FC<TabTreeProps> = ({
  nodes,
  rootIds,
  activeTabId,
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
  onSelect: (tabId: TabId) => void
  onCloseTab: (tabId: TabId) => void
  onCloseSubtree: (tabId: TabId) => void
  onToggleExpand: (tabId: TabId) => void
}

const TabTreeItem: React.FC<TabTreeItemProps> = ({
  nodeId,
  level,
  nodes,
  activeTabId,
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

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'group flex cursor-pointer items-center rounded-md px-2 py-1 text-sm transition-colors',
          isActive ? 'bg-primary/10 text-foreground' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={() => onSelect(nodeId)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="mr-1 h-7 w-7 p-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100"
            onClick={event => {
              event.stopPropagation()
              onToggleExpand(nodeId)
            }}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <span className="mr-1 h-7 w-7" />
        )}
        <div className="flex-1 truncate pr-2 font-medium text-foreground">
          {node.title || node.url}
        </div>
        <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
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
