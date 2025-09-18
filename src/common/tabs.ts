export type TabId = string

export interface TabNode {
  id: TabId
  parentId: TabId | null
  title: string
  url: string
  children: TabId[]
  isActive: boolean
  isExpanded: boolean
}

export interface TabState {
  nodes: Record<TabId, TabNode>
  rootIds: TabId[]
  activeTabId: TabId | null
}

export const HOME_URL = 'https://www.wikipedia.org/'
