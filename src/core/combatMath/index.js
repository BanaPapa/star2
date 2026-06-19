// 전투 계산 순수함수 모음 (요청서 32-3). 모두 config 인자를 받아 동작하며 UI 의존이 없다.
// 기존 core/combat.js(resolveAttack)는 그대로 두고, 다음 단계에서 BattleScene이 이 모듈을 호출하도록 전환한다.
export { getBattlefieldSizeByTier } from './battlefield'
export { getPlayerWeaponTier } from './playerTier'
export { getTerrainMoveCost, isDiagonalMovementAllowed } from './movement'
export { calculateFinalRange, isInWeaponRange } from './range'
export { calculateHitChance, calculateEvasion } from './accuracy'
export {
  calculateDamage,
  applyShieldDamage,
  applyArmorReduction,
  applyArmorDurabilityLoss,
  resolveDamagePipeline,
} from './damage'
export { calculateDefenseReduction, calculateOverwatchChance } from './stance'
export { calculateFlagshipPower, calculateRetreatChance, calculateNegotiationChance } from './flagship'
export { getDamageState } from './damageState'
export { isRuleEnabled, getRulesInOrder } from './priority'
