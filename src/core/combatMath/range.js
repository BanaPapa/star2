// 사거리 규칙 (요청서 11장) — 기본 맨해튼 거리, 무기별 사거리 유형(직선/대각선/광역 등).
// 최종 사거리 = 기본 사거리 + 장비 사거리 보정 + 모듈 사거리 보정.
import { manhattanDistance } from '../grid'

/**
 * 무기/장비/모듈 보정을 합산한 최종 사거리를 계산한다.
 * @param {{ rng?: number[]|number }} ship - 함선 기본 사거리(rng=[min,max] 또는 number)
 * @param {{ range?: number, rangeBonus?: number }} [weapon]
 * @param {Array<{ rangeBonus?: number }>} [equipment] - 장착 장비/모듈 목록
 * @param {object} config
 * @returns {{ min:number, max:number }}
 */
export function calculateFinalRange(ship, weapon, equipment, config) {
  void config // 향후 config 기반 사거리 규칙 확장용 — 시그니처 일관성 유지
  const baseMin = Array.isArray(ship?.rng) ? ship.rng[0] : (ship?.rng ?? 1)
  const baseMax = Array.isArray(ship?.rng) ? ship.rng[1] : (ship?.rng ?? 1)

  const weaponBonus = (weapon?.range ?? 0) + (weapon?.rangeBonus ?? 0)
  const equipBonus = (equipment ?? []).reduce((sum, e) => sum + (e?.rangeBonus ?? 0), 0)
  const bonus = weaponBonus + equipBonus

  return {
    min: Math.max(1, baseMin),
    max: Math.max(Math.max(1, baseMin), baseMax + bonus),
  }
}

/**
 * 공격 유형별로 대상이 사거리·방향 조건을 만족하는지 판정한다.
 * @param {{x:number,y:number}} attacker
 * @param {{x:number,y:number}} target
 * @param {{ min:number, max:number }} range
 * @param {'normal'|'line'|'diagonal'|'aoe'} [pathType='normal']
 * @returns {boolean}
 */
export function isInWeaponRange(attacker, target, range, pathType = 'normal') {
  const dx = Math.abs(attacker.x - target.x)
  const dy = Math.abs(attacker.y - target.y)
  const dist = manhattanDistance(attacker, target)

  if (pathType === 'line') {
    if (dx !== 0 && dy !== 0) return false // 같은 행 또는 같은 열만
    return dist >= range.min && dist <= range.max
  }
  if (pathType === 'diagonal') {
    if (dx !== dy) return false // |Δx| === |Δy|
    return dx >= range.min && dx <= range.max
  }
  // normal / aoe: 맨해튼 거리
  return dist >= range.min && dist <= range.max
}
