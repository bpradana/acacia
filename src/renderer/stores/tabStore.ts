import { create } from 'zustand'
import { HOME_URL, TabId, TabNode, TabState } from '@common/tabs'

const generateTabId = () => crypto.randomUUID()

const buildInitialState = (url: string = HOME_URL): TabState => {
  const id = generateTabId()
  const node: TabNode = {
    id,
    parentId: null,
    title: 'Home',
    url,
    children: [],
    isActive: true,
    isExpanded: true,
  }

  return {
    nodes: {
      [id]: node,
    },
    rootIds: [id],
    activeTabId: id,
  }
}

interface TabStore extends TabState {
  createTab: (options: { parentId: TabId | null; url: string; title?: string }) => TabId
  activateTab: (tabId: TabId) => void
  updateTabMetadata: (tabId: TabId, metadata: Partial<Pick<TabNode, 'title' | 'url'>>) => void
  updateTabUrl: (tabId: TabId, url: string) => void
  closeTab: (tabId: TabId) => TabId | null
  closeSubtree: (tabId: TabId) => TabId | null
  toggleExpanded: (tabId: TabId) => void
  ensureRoot: () => void
}

export const useTabStore = create<TabStore>((set, get) => ({
  ...buildInitialState(),
  createTab: ({ parentId, url, title }) => {
    const state = get()
    const newId = generateTabId()
    const newNode: TabNode = {
      id: newId,
      parentId,
      title: title ?? 'Loading…',
      url,
      children: [],
      isActive: true,
      isExpanded: true,
    }

    const nodes: Record<TabId, TabNode> = { ...state.nodes }

    if (state.activeTabId && nodes[state.activeTabId]) {
      nodes[state.activeTabId] = { ...nodes[state.activeTabId], isActive: false }
    }

    nodes[newId] = newNode

    let rootIds = [...state.rootIds]

    if (parentId) {
      const parent = nodes[parentId]
      if (parent) {
        const parentChildren = [...parent.children, newId]
        nodes[parentId] = {
          ...parent,
          children: parentChildren,
          isExpanded: true,
        }
      } else {
        rootIds = [...state.rootIds, newId]
      }
    } else {
      rootIds = [...state.rootIds, newId]
    }

    set({
      nodes,
      rootIds,
      activeTabId: newId,
    })

    console.debug('[tabs] created', { parentId, newId, url })

    return newId
  },
  activateTab: tabId => {
    const state = get()
    if (!state.nodes[tabId]) return

    const nodes: Record<TabId, TabNode> = { ...state.nodes }

    if (state.activeTabId && nodes[state.activeTabId]) {
      nodes[state.activeTabId] = { ...nodes[state.activeTabId], isActive: false }
    }

    nodes[tabId] = { ...nodes[tabId], isActive: true }

    set({
      nodes,
      activeTabId: tabId,
    })
  },
  updateTabMetadata: (tabId, metadata) => {
    const state = get()
    const node = state.nodes[tabId]
    if (!node) return

    const nodes = {
      ...state.nodes,
      [tabId]: {
        ...node,
        ...metadata,
      },
    }

    set({ nodes })
  },
  updateTabUrl: (tabId, url) => {
    const state = get()
    const node = state.nodes[tabId]
    if (!node) return

    const nodes = {
      ...state.nodes,
      [tabId]: {
        ...node,
        url,
      },
    }

    set({ nodes })
  },
  closeTab: tabId => {
    const state = get()
    const node = state.nodes[tabId]
    if (!node) return state.activeTabId

    const nodes: Record<TabId, TabNode> = { ...state.nodes }
    delete nodes[tabId]

    let rootIds = [...state.rootIds]

    if (node.parentId) {
      const parent = nodes[node.parentId]
      if (parent) {
        const index = parent.children.indexOf(tabId)
        const updatedChildren = [...parent.children]
        if (index !== -1) {
          updatedChildren.splice(index, 1, ...node.children)
        }
        nodes[node.parentId] = {
          ...parent,
          children: updatedChildren,
          isExpanded: true,
        }
      }
    } else {
      const rootIndex = rootIds.indexOf(tabId)
      if (rootIndex !== -1) {
        rootIds.splice(rootIndex, 1, ...node.children)
      }
    }

    node.children.forEach(childId => {
      const child = nodes[childId]
      if (!child) return
      nodes[childId] = {
        ...child,
        parentId: node.parentId,
      }
    })

    let nextActive = state.activeTabId

    if (state.activeTabId === tabId) {
      nextActive = node.parentId ?? node.children[0] ?? rootIds[0] ?? null
    }

    if (nextActive && nodes[nextActive]) {
      const previousActive = Object.values(nodes).find(current => current.isActive)
      if (previousActive) {
        nodes[previousActive.id] = { ...previousActive, isActive: false }
      }
      nodes[nextActive] = { ...nodes[nextActive], isActive: true }
    }

    if (rootIds.length === 0) {
      const initial = buildInitialState()
      set(initial)
      return initial.activeTabId
    }

    set({
      nodes,
      rootIds,
      activeTabId: nextActive ?? null,
    })

    return nextActive ?? null
  },
  closeSubtree: tabId => {
    const state = get()
    const node = state.nodes[tabId]
    if (!node) return state.activeTabId

    const nodes: Record<TabId, TabNode> = { ...state.nodes }

    const collect = (id: TabId, accumulator: TabId[]) => {
      accumulator.push(id)
      const current = state.nodes[id]
      if (!current) return
      current.children.forEach(childId => collect(childId, accumulator))
    }

    const idsToRemove: TabId[] = []
    collect(tabId, idsToRemove)

    idsToRemove.forEach(id => {
      delete nodes[id]
    })

    let rootIds = state.rootIds.filter(id => !idsToRemove.includes(id))

    if (node.parentId) {
      const parent = nodes[node.parentId]
      if (parent) {
        nodes[node.parentId] = {
          ...parent,
          children: parent.children.filter(id => id !== tabId),
        }
      }
    }

    let nextActive = state.activeTabId

    if (idsToRemove.includes(state.activeTabId ?? '')) {
      nextActive = node.parentId ?? rootIds[0] ?? null
    }

    if (nextActive && nodes[nextActive]) {
      const previousActive = Object.values(nodes).find(current => current.isActive)
      if (previousActive) {
        nodes[previousActive.id] = { ...previousActive, isActive: false }
      }
      nodes[nextActive] = { ...nodes[nextActive], isActive: true }
    }

    if (rootIds.length === 0) {
      const initial = buildInitialState()
      set(initial)
      return initial.activeTabId
    }

    set({
      nodes,
      rootIds,
      activeTabId: nextActive ?? null,
    })

    return nextActive ?? null
  },
  toggleExpanded: tabId => {
    const state = get()
    const node = state.nodes[tabId]
    if (!node) return

    const nodes = {
      ...state.nodes,
      [tabId]: {
        ...node,
        isExpanded: !node.isExpanded,
      },
    }

    set({ nodes })
  },
  ensureRoot: () => {
    const state = get()
    if (state.rootIds.length === 0) {
      set(buildInitialState())
    }
  },
}))
