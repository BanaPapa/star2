// 이동 규칙 (요청서 5장) — 기본 4방향, 대각선 불가(설정으로 토글).
// 지형별 이동 AP는 config.combat.movement.terrainMoveCosts에서 읽는다.

/**
 * 지형 타입의 이동 AP 비용을 config에서 조회한다.
 * 통과 불가 지형(비용 null)은 그대로 null 반환 — 호출부에서 이동 불가로 처리.
 * 표에 없는 지형은 baseMoveCost를 사용한다.
 * @param {string} terrainType - 'space' | 'asteroid' | 'nebula' | 'debris' | 'gravityAnomaly' | 'obstacle'
 * @param {object} config
 * @returns {number|null} 진입에 필요한 AP, 통과 불가면 null
 */
export function getTerrainMoveCost(terrainType, config) {
  const move = config?.combat?.movement ?? {}
  const costs = move.terrainMoveCosts ?? {}
  if (terrainType in costs) return costs[terrainType]
  return move.baseMoveCost ?? 1
}

/**
 * 대각선 이동 허용 여부.
 * @param {object} config
 * @returns {boolean}
 */
export function isDiagonalMovementAllowed(config) {
  return Boolean(config?.combat?.movement?.allowDiagonalMovement)
}
