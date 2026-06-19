// 전장 크기 계산 (요청서 2장) — 플레이어 연구 단계(해금한 최고 무기 티어)별 전장 크기.
// 20×16은 Tier V 전용이며 초반부터 사용하지 않는다.

/**
 * 연구 티어(1~5)에 해당하는 전장 크기를 config에서 조회한다.
 * 범위를 벗어난 티어는 가장 가까운 경계 티어로 클램프한다.
 * @param {number} tier - 1~5
 * @param {object} config - DEFAULT_GAME_CONFIG 형태
 * @returns {{ width:number, height:number }}
 */
export function getBattlefieldSizeByTier(tier, config) {
  const table = config?.combat?.battlefieldSizeByTier ?? {}
  const tiers = Object.keys(table).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b)
  if (tiers.length === 0) return { width: 10, height: 8 }

  const min = tiers[0]
  const max = tiers[tiers.length - 1]
  const clamped = Math.min(max, Math.max(min, Math.round(tier ?? min)))
  const size = table[clamped] ?? table[min]
  return { width: size.width, height: size.height }
}
