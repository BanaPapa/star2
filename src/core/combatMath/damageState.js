// 함선 손상 단계 (요청서 21장) — HP 비율에 따른 단계와 전투 보정.
// HP 0% = 격파(destroyed). 격파된 아군 함선은 전투 후 함대에서 완전 삭제(요청서 22장 — 호출부 책임).

/**
 * 현재 HP 비율(0~1)에 해당하는 손상 단계와 보정을 반환한다.
 * @param {number} hpRatio - 현재 HP / 최대 HP (0~1)
 * @param {object} config
 * @returns {{ key:string, label:string, apMod:number, accMod:number, evaMod:number, canOverwatch:boolean, destroyed:boolean }}
 */
export function getDamageState(hpRatio, config) {
  const states = config?.combat?.damageStates ?? {}
  const pct = (hpRatio ?? 1) * 100

  if (pct <= 0) {
    return { key: 'destroyed', label: '격파', apMod: 0, accMod: 0, evaMod: 0, canOverwatch: false, destroyed: true }
  }

  // minHpPct 내림차순으로 검사 — 처음 만족하는 단계가 현재 단계.
  const ordered = Object.entries(states)
    .map(([key, s]) => ({ key, ...s }))
    .sort((a, b) => (b.minHpPct ?? 0) - (a.minHpPct ?? 0))

  for (const s of ordered) {
    if (pct >= (s.minHpPct ?? 0)) {
      return {
        key: s.key,
        label: s.label ?? s.key,
        apMod: s.apMod ?? 0,
        accMod: s.accMod ?? 0,
        evaMod: s.evaMod ?? 0,
        canOverwatch: s.canOverwatch !== false,
        destroyed: false,
      }
    }
  }

  // 모든 임계값 미만이지만 0보다 큼 — 가장 낮은 단계로.
  const lowest = ordered[ordered.length - 1] ?? {}
  return {
    key: lowest.key ?? 'heavy',
    label: lowest.label ?? '대파',
    apMod: lowest.apMod ?? 0,
    accMod: lowest.accMod ?? 0,
    evaMod: lowest.evaMod ?? 0,
    canOverwatch: lowest.canOverwatch !== false,
    destroyed: false,
  }
}
