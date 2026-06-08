import { create } from 'zustand'

// 성단 진행 상태 — 현재 위치(currentNodeId)와 정복한 노드 집합(conqueredNodeIds)을 영구 보관한다(MOD-6).
// "이동 가능/잠김" 판정은 별도 플래그 없이 "현재 위치의 connections에 포함되는가"만으로 정한다 —
// 정복할수록 현재 위치가 전진하고, 그만큼 인접한 새 노드가 자연히 열리는 단순한 프런티어 모델.
const HOME_NODE_ID = 's0'

export const useProgressStore = create((set, get) => ({
  currentNodeId: HOME_NODE_ID,
  conqueredNodeIds: [HOME_NODE_ID],

  isConquered: (nodeId) => get().conqueredNodeIds.includes(nodeId),

  // 정복했거나 모항인 인접 노드로 자유롭게 이동(위치만 갱신, 전투 없음).
  moveTo: (nodeId) => set({ currentNodeId: nodeId }),

  // 별계 클리어 — 정복 집합에 추가하고 그 자리로 이동(다음 인접 노드가 잠금 해제된다).
  conquer: (nodeId) =>
    set((state) => ({
      currentNodeId: nodeId,
      conqueredNodeIds: state.conqueredNodeIds.includes(nodeId)
        ? state.conqueredNodeIds
        : [...state.conqueredNodeIds, nodeId],
    })),
}))
