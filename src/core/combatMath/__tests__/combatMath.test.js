import { describe, it, expect } from 'vitest'
import { DEFAULT_GAME_CONFIG } from '../../../data/defaultGameConfig'
import {
  getBattlefieldSizeByTier,
  getTerrainMoveCost,
  calculateFinalRange,
  isInWeaponRange,
  calculateHitChance,
  calculateEvasion,
  calculateDamage,
  applyShieldDamage,
  applyArmorReduction,
  resolveDamagePipeline,
  calculateDefenseReduction,
  calculateOverwatchChance,
  calculateFlagshipPower,
  calculateRetreatChance,
  calculateNegotiationChance,
  getDamageState,
} from '../index'

// 각 테스트는 기본 config를 깊은 복제해 격리한다(규칙 토글 테스트 등).
const cfg = () => JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG))

describe('battlefield', () => {
  it('티어별 전장 크기', () => {
    expect(getBattlefieldSizeByTier(1, cfg())).toEqual({ width: 10, height: 8 })
    expect(getBattlefieldSizeByTier(5, cfg())).toEqual({ width: 20, height: 16 })
  })
  it('범위를 벗어난 티어는 경계로 클램프', () => {
    expect(getBattlefieldSizeByTier(0, cfg())).toEqual({ width: 10, height: 8 })
    expect(getBattlefieldSizeByTier(9, cfg())).toEqual({ width: 20, height: 16 })
  })
})

describe('movement', () => {
  it('지형별 이동 비용', () => {
    expect(getTerrainMoveCost('space', cfg())).toBe(1)
    expect(getTerrainMoveCost('gravityAnomaly', cfg())).toBe(3)
    expect(getTerrainMoveCost('obstacle', cfg())).toBeNull()
  })
  it('미정의 지형은 baseMoveCost', () => {
    expect(getTerrainMoveCost('unknown_terrain', cfg())).toBe(1)
  })
})

describe('range', () => {
  it('장비 보정을 합산한 최종 사거리', () => {
    const ship = { rng: [2, 4] }
    expect(calculateFinalRange(ship, { range: 1 }, [], cfg())).toEqual({ min: 2, max: 5 })
  })
  it('직선 무기는 같은 행/열만', () => {
    const a = { x: 0, y: 0 }
    expect(isInWeaponRange(a, { x: 0, y: 3 }, { min: 1, max: 4 }, 'line')).toBe(true)
    expect(isInWeaponRange(a, { x: 2, y: 3 }, { min: 1, max: 4 }, 'line')).toBe(false)
  })
  it('대각선 무기는 |Δx|===|Δy|', () => {
    const a = { x: 0, y: 0 }
    expect(isInWeaponRange(a, { x: 3, y: 3 }, { min: 1, max: 4 }, 'diagonal')).toBe(true)
    expect(isInWeaponRange(a, { x: 3, y: 2 }, { min: 1, max: 4 }, 'diagonal')).toBe(false)
  })
})

describe('accuracy / evasion', () => {
  it('기본 명중률 = acc - eva', () => {
    const res = calculateHitChance({ acc: 80 }, { eva: 20 }, null, {}, cfg())
    expect(res.hitChance).toBe(60)
  })
  it('15~95% 클램프', () => {
    expect(calculateHitChance({ acc: 200 }, { eva: 0 }, null, {}, cfg()).hitChance).toBe(95)
    expect(calculateHitChance({ acc: 0 }, { eva: 200 }, null, {}, cfg()).hitChance).toBe(15)
  })
  it('성운: 공격자 명중 -20, 방어자 회피 +20', () => {
    expect(calculateEvasion({ eva: 20 }, { terrainEvaMod: 20 }, cfg())).toBe(40)
    const res = calculateHitChance({ acc: 80 }, { eva: 20 }, null,
      { terrainAccMod: -20, evasionContext: { terrainEvaMod: 20 } }, cfg())
    expect(res.hitChance).toBe(20) // 80 -20(성운조준) -40(회피20+20)
  })
  it('잔해: 공격자 명중 -50', () => {
    const res = calculateHitChance({ acc: 90 }, { eva: 0 }, null, { terrainAccMod: -50 }, cfg())
    expect(res.hitChance).toBe(40)
  })
  it('규칙 비활성 시 해당 보정 제외', () => {
    const c = cfg()
    c.priorityRules.find((r) => r.id === 'accuracy_terrain_penalty').enabled = false
    const res = calculateHitChance({ acc: 80 }, { eva: 20 }, null, { terrainAccMod: -50 }, c)
    expect(res.hitChance).toBe(60) // 지형 페널티 무시
  })
})

describe('damage pipeline', () => {
  it('calculateDamage = max(1, atk) * 배율', () => {
    expect(calculateDamage({ atk: 40 }, { atk: 10 }, { counterMultiplier: 1.25 }, cfg())).toBe(63)
  })
  it('Armor 감소 공식: 100 피해, Armor 50 → 66.6', () => {
    expect(applyArmorReduction(100, 50, cfg())).toBeCloseTo(66.67, 1)
  })
  it('Shield가 먼저 흡수', () => {
    expect(applyShieldDamage(50, 30)).toEqual({ shieldAfter: 20, overflow: 0, absorbed: 30 })
    expect(applyShieldDamage(50, 80)).toEqual({ shieldAfter: 0, overflow: 30, absorbed: 50 })
  })
  it('Shield→Armor→HP 전체 흐름', () => {
    const res = resolveDamagePipeline(
      { defender: { shield: 0, armor: 50, armorDurability: 100, hp: 200 }, finalDamage: 100 },
      cfg(),
    )
    expect(res.hpDamage).toBe(67)
    expect(res.hpAfter).toBe(133)
    expect(res.armorDurabilityAfter).toBe(80) // 100 - 100*0.2
    expect(res.destroyed).toBe(false)
  })
  it('Shield Pierce는 Shield 우회', () => {
    const res = resolveDamagePipeline(
      { defender: { shield: 100, armor: 0, armorDurability: 0, hp: 100 }, finalDamage: 50, shieldPierce: 0.4 },
      cfg(),
    )
    expect(res.shieldAfter).toBe(70) // 일반 30만 흡수
    expect(res.hpDamage).toBe(20)    // 관통 20은 HP로
    expect(res.hpAfter).toBe(80)
  })
  it('Armor 내구도 0이면 방어력 상실', () => {
    const res = resolveDamagePipeline(
      { defender: { shield: 0, armor: 50, armorDurability: 0, hp: 200 }, finalDamage: 100 },
      cfg(),
    )
    expect(res.hpDamage).toBe(100) // 감소 없음
  })
  it('방어 태세 감소율 적용', () => {
    const res = resolveDamagePipeline(
      { defender: { shield: 0, armor: 0, armorDurability: 0, hp: 200 }, finalDamage: 100, defenseReduction: 0.4 },
      cfg(),
    )
    expect(res.hpDamage).toBe(60)
  })
  it('치명타로 격파', () => {
    const res = resolveDamagePipeline(
      { defender: { shield: 0, armor: 0, armorDurability: 0, hp: 30 }, finalDamage: 100 },
      cfg(),
    )
    expect(res.destroyed).toBe(true)
  })
})

describe('defense / overwatch', () => {
  it('방어 감소 = AP×5%×효율', () => {
    expect(calculateDefenseReduction({ id: 'destroyer' }, 5, cfg())).toBeCloseTo(0.25, 5)
  })
  it('최대 40% 캡', () => {
    expect(calculateDefenseReduction({ id: 'dreadnought' }, 8, cfg())).toBeCloseTo(0.4, 5)
  })
  it('경계 AP별 효과', () => {
    expect(calculateOverwatchChance(null, 3, cfg())).toMatchObject({ radius: 3, chance: 60, accuracyPenalty: -10 })
    expect(calculateOverwatchChance(null, 7, cfg())).toMatchObject({ radius: 3, chance: 100, accuracyPenalty: -5 })
    expect(calculateOverwatchChance(null, 0, cfg())).toBeNull()
  })
})

describe('flagship / retreat / negotiation', () => {
  it('기함 전투력 공식', () => {
    const ship = { hp: 100, armor: 50, shield: 50, atk: 40, ap: 5, eva: 20 }
    expect(calculateFlagshipPower(ship, cfg())).toBeCloseTo(125, 5)
  })
  it('후퇴 확률 클램프', () => {
    const weak = { hp: 1, armor: 0, shield: 0, atk: 1, ap: 1, eva: 0 }
    const strong = { hp: 999, armor: 99, shield: 99, atk: 99, ap: 9, eva: 99 }
    expect(calculateRetreatChance(strong, weak, {}, cfg())).toBeLessThanOrEqual(90)
    expect(calculateRetreatChance(weak, strong, {}, cfg())).toBeGreaterThanOrEqual(15)
  })
  it('교섭 기본 25%', () => {
    const s = { hp: 100, armor: 10, shield: 10, atk: 20, ap: 4, eva: 10 }
    expect(calculateNegotiationChance(s, s, { enemyTotalHpRatio: 1 }, cfg())).toBe(25)
  })
  it('적 HP 30% 이하 시 교섭 보너스', () => {
    const s = { hp: 100, armor: 10, shield: 10, atk: 20, ap: 4, eva: 10 }
    expect(calculateNegotiationChance(s, s, { enemyTotalHpRatio: 0.25 }, cfg())).toBe(45)
  })
})

describe('damage state', () => {
  it('HP 비율별 손상 단계', () => {
    expect(getDamageState(1.0, cfg()).key).toBe('normal')
    expect(getDamageState(0.5, cfg()).key).toBe('light')
    expect(getDamageState(0.3, cfg()).key).toBe('medium')
    expect(getDamageState(0.1, cfg()).key).toBe('heavy')
    expect(getDamageState(0, cfg()).destroyed).toBe(true)
  })
  it('대파는 경계 불가, AP -2', () => {
    const s = getDamageState(0.1, cfg())
    expect(s.canOverwatch).toBe(false)
    expect(s.apMod).toBe(-2)
  })
})
