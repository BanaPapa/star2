// 플레이어 연구 단계(해금한 최고 무기 티어) 계산 (요청서 2장).
// config.combat.weaponTierByResearch 매핑을 사용 — 해금 연구 중 최고 티어. 미해금 시 Tier 1.

/**
 * 해금된 연구 id 목록에서 현재 무기 티어(1~5)를 구한다.
 * @param {string[]} unlockedResearchIds
 * @param {object} config
 * @returns {number} 1~5
 */
export function getPlayerWeaponTier(unlockedResearchIds, config) {
  const table = config?.combat?.weaponTierByResearch ?? {}
  let tier = 1
  for (const id of unlockedResearchIds ?? []) {
    const t = table[id]
    if (typeof t === 'number' && t > tier) tier = t
  }
  return Math.min(5, Math.max(1, tier))
}
