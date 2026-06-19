// 피해 / Shield / Armor / HP 처리 (요청서 18장).
// 핵심: Armor는 HP 앞의 별도 체력층이 아니라 HP 피해를 줄이는 "피해 감소 방어력"이다.
// 처리 순서: Shield 흡수 → (Shield Pierce 분할) → Armor 감소 → 방어 태세 감소 → HP 적용 → Armor 내구도 감소 → 격파 판정.
// 각 단계는 Priority Resolver(group 'damage')에서 끄면 제외된다.
import { isRuleEnabled } from './priority'

/**
 * 방어/감소 적용 전 "최종 피해량"을 계산한다.
 * 신 모델에서 HP 피해 감소는 Armor가 담당하므로 def는 차감하지 않는다.
 * @param {{ atk?:number }} attacker
 * @param {{ atk?:number }} [weapon] - 무기 공격력 보정
 * @param {object} [context]
 * @param {number} [context.counterMultiplier=1] - 상성 배율
 * @param {number} [context.damageMultiplier=1]  - 필살기 등 추가 배율
 * @param {object} config
 * @returns {number} 최소 1 이상의 정수 피해
 */
export function calculateDamage(attacker, weapon, context = {}, config) {
  const basePower = (attacker?.atk ?? 0) + (weapon?.atk ?? 0)
  const counter = context.counterMultiplier ?? 1
  const mult = context.damageMultiplier ?? 1
  void config
  return Math.round(Math.max(1, basePower) * counter * mult)
}

/**
 * Shield가 피해를 먼저 흡수한다.
 * @returns {{ shieldAfter:number, overflow:number, absorbed:number }}
 */
export function applyShieldDamage(shield, damage) {
  const s = Math.max(0, shield ?? 0)
  const absorbed = Math.min(s, damage)
  return { shieldAfter: s - absorbed, overflow: damage - absorbed, absorbed }
}

/**
 * Armor 피해 감소: HP 적용 피해 = 피해 × (100 / (100 + armor)).
 * armor <= 0이면 감소 없음.
 * @returns {number} 감소된 피해(float — 호출부에서 합산 후 반올림)
 */
export function applyArmorReduction(damage, armor, config) {
  void config
  const a = Math.max(0, armor ?? 0)
  if (a === 0) return damage
  return damage * (100 / (100 + a))
}

/**
 * Armor 내구도 감소량 = HP 적용 전 남은 피해 × armorDurabilityLossRate.
 * @returns {number} 내구도 감소량(정수)
 */
export function applyArmorDurabilityLoss(rawHpBoundDamage, config) {
  const rate = config?.combat?.damage?.armorDurabilityLossRate ?? 0.2
  return Math.round(Math.max(0, rawHpBoundDamage) * rate)
}

/**
 * 전체 피해 파이프라인. 방어자 상태(shield/armor/armorDurability/hp)를 입력받아
 * 적용 후 새 상태와 격파 여부를 반환한다(불변 — 입력을 변경하지 않음).
 *
 * @param {object} input
 * @param {{ shield?:number, armor?:number, armorDurability?:number, hp:number }} input.defender
 * @param {number} input.finalDamage - calculateDamage 결과
 * @param {number} [input.shieldPierce=0] - 0~1 (Shield Pierce 비율)
 * @param {number} [input.defenseReduction=0] - 0~1 (방어 태세 피해 감소율)
 * @param {object} config
 * @returns {{ shieldAfter:number, armorDurabilityAfter:number, hpAfter:number, hpDamage:number, destroyed:boolean, breakdown:object }}
 */
export function resolveDamagePipeline({ defender, finalDamage, shieldPierce = 0, defenseReduction = 0 }, config) {
  const dmgCfg = config?.combat?.damage ?? {}
  const r = (id) => isRuleEnabled(config, id)

  const shield = Math.max(0, defender.shield ?? 0)
  const armorDurability = Math.max(0, defender.armorDurability ?? 0)
  const baseArmor = Math.max(0, defender.armor ?? 0)
  const hp = defender.hp ?? 0

  // 1. Shield Pierce 분할 — pierce 피해는 Shield를 우회한다(기본).
  const pierceBypassesShield = dmgCfg.shieldPierceBypassesShield !== false
  let pierceDamage = 0
  let normalDamage = finalDamage
  if (r('damage_shield_pierce_split') && pierceBypassesShield && shieldPierce > 0) {
    pierceDamage = finalDamage * Math.min(1, Math.max(0, shieldPierce))
    normalDamage = finalDamage - pierceDamage
  }

  // 2. Shield 흡수 — 일반 피해만.
  let shieldAfter = shield
  let shieldOverflow = normalDamage
  if (r('damage_shield_absorb')) {
    const res = applyShieldDamage(shield, normalDamage)
    shieldAfter = res.shieldAfter
    shieldOverflow = res.overflow
  }

  // HP 적용 전, 장갑 단계로 들어가는 총 피해(내구도 감소 산정 기준).
  const rawHpBound = shieldOverflow + pierceDamage

  // 3. Armor 감소 — 내구도가 0이면 방어력 상실.
  const armorActive = r('damage_armor_reduction') && armorDurability > 0
  const armor = armorActive ? baseArmor : 0
  const pierceBypassesArmor = dmgCfg.shieldPierceBypassesArmor === true
  const hpFromNormal = applyArmorReduction(shieldOverflow, armor, config)
  const hpFromPierce = applyArmorReduction(pierceDamage, pierceBypassesArmor ? 0 : armor, config)
  let hpDamage = hpFromNormal + hpFromPierce

  // 4. 방어 태세 감소.
  if (r('damage_defense_stance') && defenseReduction > 0) {
    hpDamage *= (1 - Math.min(1, Math.max(0, defenseReduction)))
  }
  hpDamage = Math.round(hpDamage)

  // 5. HP 적용.
  const hpAfter = r('damage_hp_apply') ? hp - hpDamage : hp

  // 6. Armor 내구도 감소.
  let armorDurabilityAfter = armorDurability
  if (r('damage_armor_durability') && armorActive) {
    armorDurabilityAfter = Math.max(0, armorDurability - applyArmorDurabilityLoss(rawHpBound, config))
  }

  // 7. 격파 판정.
  const destroyed = r('ship_destroyed_check') ? hpAfter <= 0 : false

  return {
    shieldAfter,
    armorDurabilityAfter,
    hpAfter,
    hpDamage,
    destroyed,
    breakdown: { pierceDamage, normalDamage, shieldOverflow, rawHpBound, armorApplied: armor, hpFromNormal, hpFromPierce, defenseReduction },
  }
}
