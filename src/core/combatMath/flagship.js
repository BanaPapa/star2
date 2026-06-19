// 기함 전투력 / 후퇴 / 교섭 (요청서 23·24장). 후퇴·교섭은 모두 기함 중심 시스템이다.
import { isRuleEnabled } from './priority'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * 기함 전투력 점수 (요청서 24장).
 * = HP×0.25 + Armor×0.2 + Shield×0.2 + 총무기공격력×0.25 + AP×8 + Evasion×1.5
 * @param {{ hp?:number, armor?:number, shield?:number, atk?:number, ap?:number, eva?:number }} ship
 * @param {object} config
 * @returns {number}
 */
export function calculateFlagshipPower(ship, config) {
  const w = config?.combat?.flagshipPower ?? {}
  return (
    (ship?.hp ?? 0)     * (w.hpWeight ?? 0.25) +
    (ship?.armor ?? 0)  * (w.armorWeight ?? 0.2) +
    (ship?.shield ?? 0) * (w.shieldWeight ?? 0.2) +
    (ship?.atk ?? 0)    * (w.weaponWeight ?? 0.25) +
    (ship?.ap ?? 0)     * (w.apWeight ?? 8) +
    (ship?.eva ?? 0)    * (w.evasionWeight ?? 1.5)
  )
}

/**
 * 후퇴 성공 확률(%) — 아군 기함 vs 적 기함 전투력 비교 (요청서 23장).
 * @param {object} playerFlagship
 * @param {object} enemyFlagship
 * @param {object} [context] - { enemyDamageRatio?:number } (적 전체 손상도 0~1)
 * @param {object} config
 * @returns {number}
 */
export function calculateRetreatChance(playerFlagship, enemyFlagship, context = {}, config) {
  const ret = config?.combat?.retreat ?? {}
  const r = (id) => isRuleEnabled(config, id)

  let chance = ret.baseChance ?? 0
  if (r('retreat_flagship_power')) {
    const pPower = calculateFlagshipPower(playerFlagship, config)
    const ePower = calculateFlagshipPower(enemyFlagship, config)
    const ratio = pPower / Math.max(1, pPower + ePower) // 0~1
    chance += ratio * 100
  }
  if (r('retreat_enemy_damage')) {
    chance += (context.enemyDamageRatio ?? 0) * 20 // 적이 손상될수록 후퇴 쉬움
  }

  const min = ret.minChance ?? 15
  const max = ret.maxChance ?? 90
  return Math.round(r('retreat_clamp') ? clamp(chance, min, max) : chance)
}

/**
 * 교섭/투항 요구 성공 확률(%) (요청서 24장).
 * = 기본 25% + 전력 우위 + 적 피해율 + 적 기함 피해 + 연구 보정 + 진영 보정.
 * @param {object} playerFlagship
 * @param {object} enemyFlagship
 * @param {object} [context]
 * @param {number} [context.enemyTotalHpRatio] - 적 전체 HP 비율 0~1
 * @param {number} [context.enemyFlagshipHpRatio] - 적 기함 HP 비율 0~1
 * @param {string[]} [context.researchUnlocked] - 해금 연구 키 목록
 * @param {boolean} [context.ionStartingPlanet]
 * @param {string} [context.enemyType] - 'boss' | 'fanatic' | 'pirate' | 'mercenary' | ...
 * @param {object} config
 * @returns {number}
 */
export function calculateNegotiationChance(playerFlagship, enemyFlagship, context = {}, config) {
  const neg = config?.combat?.negotiation ?? {}
  const b = neg.bonuses ?? {}
  const r = (id) => isRuleEnabled(config, id)

  let chance = neg.baseChance ?? 25

  if (r('retreat_flagship_power')) {
    const pPower = calculateFlagshipPower(playerFlagship, config)
    const ePower = calculateFlagshipPower(enemyFlagship, config)
    if (pPower > ePower) {
      const advantage = (pPower - ePower) / Math.max(1, ePower)
      chance += Math.min(b.flagshipPowerAdvantageMax ?? 20, advantage * (b.flagshipPowerAdvantageMax ?? 20))
    }
  }

  if (r('retreat_enemy_damage')) {
    const hpRatio = context.enemyTotalHpRatio ?? 1
    if (hpRatio <= 0.3) chance += b.enemyHpBelow30 ?? 20
    else if (hpRatio <= 0.5) chance += b.enemyHpBelow50 ?? 10
    if ((context.enemyFlagshipHpRatio ?? 1) <= 0.3) chance += b.enemyFlagshipHpBelow30 ?? 15
  }

  if (r('retreat_research_bonus')) {
    const research = context.researchUnlocked ?? []
    if (research.includes('communications'))      chance += b.researchCommunications ?? 10
    if (research.includes('signal_intercept'))    chance += b.researchSignalIntercept ?? 5
    if (research.includes('diplomatic_channel'))  chance += b.researchDiplomaticChannel ?? 15
    if (context.ionStartingPlanet) chance += b.ionStartingPlanet ?? 5
    if (context.enemyType === 'boss' || context.enemyType === 'fanatic') chance += b.enemyBossOrFanatic ?? -30
    if (context.enemyType === 'pirate' || context.enemyType === 'mercenary') chance += b.enemyPirateOrMercenary ?? 10
  }

  const min = neg.minChance ?? 5
  const max = neg.maxChance ?? 85
  return Math.round(r('retreat_clamp') ? clamp(chance, min, max) : chance)
}
