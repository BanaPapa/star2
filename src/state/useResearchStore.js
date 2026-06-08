import { create } from 'zustand'
import { useResourceStore } from './useResourceStore'

// 연구·개발 트리 진행 상태 — research.json의 prereq(선행 노드)·cost(자원)를 그대로 판정에 쓴다(MOD-7).
// 해금된 노드 id 집합만 보관하고, "그 노드가 무엇을 푸는지(unlock: 아이템/함선/기능/조합)"는
// research.json 자체가 출처이므로 여기서 따로 들고 있지 않는다 — 화면이 조회 시점에 합성한다.

export const useResearchStore = create((set, get) => ({
  unlockedIds: [],

  isUnlocked: (id) => get().unlockedIds.includes(id),

  // 선행 노드를 모두 해금했고, 아직 해금하지 않은 상태인지 — 자원 충족 여부는 별도(canAffordUnlock).
  canUnlock: (node) => {
    if (get().unlockedIds.includes(node.id)) return false
    return (node.prereq ?? []).every((id) => get().unlockedIds.includes(id))
  },

  canAffordUnlock: (node) => useResourceStore.getState().canAfford(node.cost),

  // 선행 조건 + 자원 충족을 모두 검사해 자원을 소비하고 해금한다. 실패 시 false.
  unlock: (node) => {
    if (!get().canUnlock(node)) return false
    if (!useResourceStore.getState().spend(node.cost)) return false
    set((state) => ({ unlockedIds: [...state.unlockedIds, node.id] }))
    return true
  },
}))
