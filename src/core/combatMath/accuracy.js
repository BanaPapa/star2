// 명중률·회피율 계산 (요청서 14·15장).
// 거리 보정 없음, 별도 엄폐 보정 없음. 엄폐/성운/잔해는 명중률 또는 회피율 보정으로 처리.
//
// 최종 명중률 = 무기 기본 명중 + 공격자 장비 + 공격자 모듈 + 함선/기함 + 지형 − 대상 최종 회피율
//   (15~95% 클램프). 각 항목은 Priority Resolver에서 끄면 제외된다.
import { isRuleEnabled } from './priority'

/**
 * 방어자 최종 회피율 (요청서 15장).
 * @param {{ eva?:number }} defender - 함선 기본 회피율(eva)
 * @param {object} [context]
 * @param {number} [context.engineEvaMod]    - 엔진 회피 보정
 * @param {number} [context.shieldEvaMod]    - 쉴드 회피 보정
 * @param {number} [context.equipmentEvaMod] - 장비/모듈 회피 보정
 * @param {number} [context.terrainEvaMod]   - 지형 회피 보정(성운/잔해 — 방어자 위치 기준)
 * @param {number} [context.damageStateEvaMod] - 손상 단계 회피 보정
 * @param {boolean} [context.retreating]     - 후퇴 중이면 회피 페널티 적용
 * @param {object} config
 * @returns {number} 회피율(%)
 */
export function calculateEvasion(defender, context = {}, config) {
  const r = (id) => isRuleEnabled(config, id)
  let eva = defender?.eva ?? 0

  if (r('evasion_engine_bonus'))    eva += context.engineEvaMod ?? 0
  if (r('evasion_shield_bonus'))    eva += context.shieldEvaMod ?? 0
  if (r('evasion_equipment_bonus')) eva += context.equipmentEvaMod ?? 0
  if (r('evasion_terrain_bonus'))   eva += context.terrainEvaMod ?? 0

  // 손상 단계 회피 보정(경미 손상 -5 등) — 항상 적용.
  eva += context.damageStateEvaMod ?? 0

  // 후퇴 중 회피 페널티 (요청서 23장)
  if (context.retreating) eva += config?.combat?.retreat?.retreatingEvasionPenalty ?? 0

  return eva
}

/**
 * 공격 성공 확률(%) (요청서 14장). 15~95% 클램프.
 * @param {{ acc?:number }} attacker
 * @param {{ eva?:number }} defender
 * @param {{ accuracy?:number }} [weapon] - 무기 기본 명중 보정
 * @param {object} [context]
 * @param {number} [context.equipmentAccMod] - 공격자 장비 명중 보정
 * @param {number} [context.moduleAccMod]    - 공격자 모듈 명중 보정
 * @param {number} [context.flagshipAccMod]  - 함선/기함 명중 보정(아군 기함 격파 -5 등)
 * @param {number} [context.terrainAccMod]   - 지형 명중 보정(성운 밖→안 -20, 잔해 -50)
 * @param {number} [context.damageStateAccMod] - 공격자 손상 단계 명중 보정
 * @param {boolean} [context.attackerRetreating] - 공격자가 후퇴 중
 * @param {number} [context.defenderEvasion] - 미리 계산한 방어자 회피율(있으면 우선 사용)
 * @param {object} [context.evasionContext]  - defenderEvasion 미지정 시 calculateEvasion에 넘길 context
 * @param {object} config
 * @returns {{ hitChance:number, raw:number, evasion:number }}
 */
export function calculateHitChance(attacker, defender, weapon, context = {}, config) {
  const r = (id) => isRuleEnabled(config, id)
  const acc = config?.combat?.accuracy ?? {}

  let chance = 0
  if (r('accuracy_base_weapon'))        chance += (attacker?.acc ?? 0) + (weapon?.accuracy ?? 0)
  if (r('accuracy_attacker_equipment')) chance += context.equipmentAccMod ?? 0
  if (r('accuracy_attacker_module'))    chance += context.moduleAccMod ?? 0
  if (r('accuracy_ship_flagship'))      chance += context.flagshipAccMod ?? 0
  if (r('accuracy_terrain_penalty'))    chance += context.terrainAccMod ?? 0

  // 손상 단계 명중 보정(중파 -5, 대파 -10) — 규칙 토글 가능.
  if (r('accuracy_damage_state'))       chance += context.damageStateAccMod ?? 0

  // 후퇴 중 명중 페널티 (요청서 23장)
  if (r('accuracy_retreating_penalty') && context.attackerRetreating) {
    chance += config?.combat?.retreat?.retreatingAccuracyPenalty ?? 0
  }

  // 대상 최종 회피율 차감
  const evasion = context.defenderEvasion != null
    ? context.defenderEvasion
    : calculateEvasion(defender, context.evasionContext ?? {}, config)
  if (r('accuracy_subtract_evasion')) chance -= evasion

  const raw = chance
  if (r('accuracy_clamp')) {
    const min = acc.minHitChance ?? 15
    const max = acc.maxHitChance ?? 95
    chance = Math.min(max, Math.max(min, chance))
  }

  return { hitChance: Math.round(chance), raw: Math.round(raw), evasion: Math.round(evasion) }
}
