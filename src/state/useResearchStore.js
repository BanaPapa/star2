import { create } from 'zustand'
import { useResourceStore } from './useResourceStore'
import { useDevelopmentStore } from './useDevelopmentStore'
import { useDataStore } from './useDataStore'

// 연구·개발 트리 진행 상태 — research.json의 prereq(선행 노드)·cost(자원)를 그대로 판정에 쓴다(MOD-7).
// MOD-9: devReq 필드(특정 별계 개발 완료 필요) + s2 개발 시 연구 비용 25% 절감(research_boost) 지원.

// s2 research_boost 개발 완료 시 연구 비용 25% 절감 (최솟값 1)
function getEffectiveCost(cost) {
  if (!useDevelopmentStore.getState().isDeveloped('s2')) return cost ?? {}
  return Object.fromEntries(
    Object.entries(cost ?? {}).map(([k, v]) => [k, Math.max(1, Math.ceil(v * 0.75))]),
  )
}

export const useResearchStore = create((set, get) => ({
  unlockedIds: [],

  isUnlocked: (id) => get().unlockedIds.includes(id),

  // 선행 연구 충족 + devReq(별계 개발 조건) 충족 여부 — 자원은 별도 canAffordUnlock으로 확인
  canUnlock: (node) => {
    if (get().unlockedIds.includes(node.id)) return false
    if (!(node.prereq ?? []).every((id) => get().unlockedIds.includes(id))) return false
    if (node.devReq && !useDevelopmentStore.getState().isDeveloped(node.devReq)) return false
    return true
  },

  // 연구 비용 충족 여부 (research_boost 할인 반영)
  canAffordUnlock: (node) => useResourceStore.getState().canAfford(getEffectiveCost(node.cost)),

  // 조건 + 자원 충족 시 research_boost 할인 적용해 자원 소비 후 해금
  unlock: (node) => {
    if (!get().canUnlock(node)) return false
    if (!useResourceStore.getState().spend(getEffectiveCost(node.cost))) return false
    set((state) => ({ unlockedIds: [...state.unlockedIds, node.id] }))
    return true
  },

  // 연구 시너지 — research.json의 synergies 중 requires 전부 해금된 항목들의 bonus를 키별로 합산.
  // 활성 시너지가 없으면 {} (applyResearchSynergies가 그대로 통과시킴).
  activeSynergyBonus: () => {
    const synergies = useDataStore.getState().data?.research?.synergies ?? []
    const unlockedIds = get().unlockedIds
    const bonus = {}
    for (const synergy of synergies) {
      if (!synergy.requires.every((id) => unlockedIds.includes(id))) continue
      for (const [key, amount] of Object.entries(synergy.bonus ?? {})) {
        bonus[key] = (bonus[key] ?? 0) + amount
      }
    }
    return bonus
  },
}))
