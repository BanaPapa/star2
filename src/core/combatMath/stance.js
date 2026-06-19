// 방어 태세 / 경계 태세 (요청서 16·17장).
// 두 태세 모두 버튼을 누르는 순간 남은 AP를 전부 소모한다(호출부 책임).

/**
 * 방어 태세 피해 감소율 (요청서 16장).
 * 최종 피해 감소율 = 사용 AP × damageReductionPerAp% × 함선 방어 효율, 최대 maxDamageReduction%.
 * @param {{ id?:string, class?:string }} ship - 함선 등급 식별(id 또는 class)
 * @param {number} usedAp
 * @param {object} config
 * @returns {number} 0~1 피해 감소율(예: 0.4 = 40%)
 */
export function calculateDefenseReduction(ship, usedAp, config) {
  const def = config?.combat?.defense ?? {}
  const cls = ship?.class ?? ship?.id
  const efficiency = def.shipDefenseEfficiency?.[cls] ?? 1.0
  const perAp = def.damageReductionPerAp ?? 5
  const maxPct = def.maxDamageReduction ?? 40

  const pct = Math.min(maxPct, Math.max(0, usedAp) * perAp * efficiency)
  return pct / 100
}

/**
 * 경계 태세 효과 (요청서 17장) — 사용 AP에 따른 경계 반경·반격 확률·반격 명중 보정.
 * AP가 표의 최댓값을 넘으면 가장 높은 단계를 사용한다.
 * @param {object} ship - (현재 미사용, 향후 함선별 보정 확장용)
 * @param {number} usedAp
 * @param {object} config
 * @returns {{ radius:number, chance:number, accuracyPenalty:number, damageMultiplier:number } | null}
 */
export function calculateOverwatchChance(ship, usedAp, config) {
  void ship
  const ow = config?.combat?.overwatch ?? {}
  const table = ow.rulesByAp ?? {}
  const ap = Math.max(0, Math.floor(usedAp))
  if (ap <= 0) return null

  const tiers = Object.keys(table).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b)
  if (tiers.length === 0) return null

  // 사용 AP 이하의 가장 높은 단계를 선택(5 이상은 최고 단계).
  let chosen = tiers[0]
  for (const t of tiers) { if (ap >= t) chosen = t }
  const rule = table[chosen]

  return {
    radius: rule.radius,
    chance: rule.chance,
    accuracyPenalty: rule.accuracyPenalty ?? 0,
    damageMultiplier: ow.damageMultiplier ?? 0.7,
  }
}
