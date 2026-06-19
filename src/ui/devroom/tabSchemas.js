// 핵심 전투 탭들의 선언적 스키마 — SchemaTab이 이 정의를 읽어 ConfigField를 렌더한다.
// path는 config 객체 기준. 숫자 키(티어/AP 등)도 객체 키로 그대로 사용한다.

const CLASSES = ['gunship', 'frigate', 'destroyer', 'cruiser', 'battlecruiser', 'dreadnought']
const TIERS = [1, 2, 3, 4, 5]
const OW_AP = [1, 2, 3, 4, 5]

export const COMBAT_RULES_SCHEMA = {
  sections: [
    {
      title: '전장 크기 (연구 티어별)',
      desc: '플레이어가 해금한 최고 무기 티어에 따라 전장 크기가 결정된다. 20×16은 Tier V 전용.',
      fields: TIERS.flatMap((t) => [
        { type: 'number', path: `combat.battlefieldSizeByTier.${t}.width`,  label: `Tier ${t} 가로`, min: 4, max: 40 },
        { type: 'number', path: `combat.battlefieldSizeByTier.${t}.height`, label: `Tier ${t} 세로`, min: 4, max: 40 },
      ]),
    },
    {
      title: '이동 / AP',
      fields: [
        { type: 'toggle', path: 'combat.movement.allowDiagonalMovement', label: '대각선 이동 허용', help: '기본 4방향' },
        { type: 'number', path: 'combat.movement.baseMoveCost', label: '기본 이동 비용', min: 1, max: 5, suffix: 'AP' },
        { type: 'number', path: 'combat.apCosts.movePerTile', label: '1칸 이동 AP', min: 1, max: 5, suffix: 'AP' },
      ],
    },
    {
      title: '함선 기본 AP',
      desc: '함선 등급별 기준 AP (요청서 4장).',
      fields: CLASSES.map((c) => ({ type: 'number', path: `combat.baseApByClass.${c}`, label: c, min: 1, max: 20, suffix: 'AP' })),
    },
    {
      title: '드레드노트 / 승패',
      fields: [
        { type: 'number', path: 'combat.dreadnought.maxPerBattle', label: '드레드노트 전투 중 최대', min: 0, max: 10 },
        { type: 'toggle', path: 'combat.victory.winOnAllEnemiesDestroyedOrSurrendered', label: '승리: 적 전멸/투항' },
        { type: 'toggle', path: 'combat.victory.loseOnAllAlliesDestroyedOrRetreated', label: '패배: 아군 전멸/후퇴' },
      ],
    },
  ],
}

export const TERRAIN_RULES_SCHEMA = {
  sections: [
    {
      title: '지형별 이동 비용',
      fields: [
        { type: 'number', path: 'combat.movement.terrainMoveCosts.space', label: '일반 우주', min: 1, max: 9, suffix: 'AP' },
        { type: 'number', path: 'combat.movement.terrainMoveCosts.asteroid', label: '소행성 지대', min: 1, max: 9, suffix: 'AP' },
        { type: 'number', path: 'combat.movement.terrainMoveCosts.nebula', label: '성운 지대', min: 1, max: 9, suffix: 'AP' },
        { type: 'number', path: 'combat.movement.terrainMoveCosts.debris', label: '잔해 지대', min: 1, max: 9, suffix: 'AP' },
        { type: 'number', path: 'combat.movement.terrainMoveCosts.gravityAnomaly', label: '중력 이상 지대', min: 1, max: 9, suffix: 'AP' },
      ],
    },
    {
      title: '성운 지대 효과',
      desc: '성운 밖 → 성운 안 공격에만 적용 (요청서 6장).',
      fields: [
        { type: 'number', path: 'combat.terrain.nebula.attackerAccuracyPenaltyFromOutside', label: '공격자 명중 보정', min: -100, max: 0, suffix: '%' },
        { type: 'number', path: 'combat.terrain.nebula.defenderEvasionBonusInside', label: '방어자 회피 보정', min: 0, max: 100, suffix: '%' },
      ],
    },
    {
      title: '잔해 지대 효과 (엄폐)',
      desc: 'UI는 "엄폐"로 표시하지만 내부적으로 공격자 명중률 감소로 처리 (요청서 7장).',
      fields: [
        { type: 'number', path: 'combat.terrain.debris.attackerAccuracyPenalty', label: '공격자 명중 보정', min: -100, max: 0, suffix: '%' },
      ],
    },
  ],
}

export const ATTACK_RULES_SCHEMA = {
  sections: [
    {
      title: '명중률 한계',
      fields: [
        { type: 'number', path: 'combat.accuracy.minHitChance', label: '최소 명중률', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.accuracy.maxHitChance', label: '최대 명중률', min: 0, max: 100, suffix: '%' },
      ],
    },
    {
      title: '비활성 규칙 (요청서 14장)',
      fields: [
        { type: 'toggle', path: 'combat.accuracy.useDistancePenalty', label: '거리 보정 사용', help: '기본 OFF' },
        { type: 'toggle', path: 'combat.accuracy.useCoverSystem', label: '별도 엄폐 시스템 사용', help: '기본 OFF' },
      ],
    },
    {
      title: '쿨타임 / 다중 공격',
      fields: [
        { type: 'toggle', path: 'combat.weapon.cooldownEnabled', label: '무기 쿨타임 사용', help: 'v1.0 기본 OFF' },
        { type: 'toggle', path: 'combat.weapon.multiSlotAttackEnabled', label: '다중 슬롯 동시 발사', help: '기본 OFF' },
        { type: 'number', path: 'combat.weapon.maxAttacksPerTurnDefault', label: '턴당 기본 공격 횟수', min: 1, max: 5 },
      ],
    },
  ],
}

export const DAMAGE_RULES_SCHEMA = {
  sections: [
    {
      title: 'Armor 처리',
      desc: 'Armor는 HP 앞 체력층이 아니라 HP 피해 감소 방어력 (요청서 18장).',
      fields: [
        { type: 'toggle', path: 'combat.damage.armorIsHpLayer', label: 'Armor를 HP 체력층으로', help: '기본 OFF' },
        { type: 'toggle', path: 'combat.damage.armorIsDamageReduction', label: 'Armor를 피해 감소로', help: '기본 ON' },
        { type: 'text',   path: 'combat.damage.armorReductionFormula', label: 'Armor 감소 공식' },
        { type: 'number', path: 'combat.damage.armorDurabilityLossRate', label: 'Armor 내구도 감소율', min: 0, max: 1, step: 0.05 },
      ],
    },
    {
      title: 'Shield Pierce',
      fields: [
        { type: 'toggle', path: 'combat.damage.shieldPierceBypassesShield', label: 'Shield 우회', help: '기본 ON' },
        { type: 'toggle', path: 'combat.damage.shieldPierceBypassesArmor', label: 'Armor도 우회', help: '기본 OFF' },
      ],
    },
    {
      title: 'Shield 규칙 (요청서 19장)',
      fields: [
        { type: 'toggle', path: 'combat.shield.autoRechargeDuringBattle', label: '전투 중 자동 회복', help: '기본 OFF' },
        { type: 'toggle', path: 'combat.shield.itemRechargeAllowed', label: '아이템 재충전 허용' },
        { type: 'toggle', path: 'combat.shield.carryOverBetweenBattles', label: '다음 전투로 이월' },
        { type: 'number', path: 'combat.shield.minimumRechargeIfDepletedNextBattle', label: '방전 시 다음 전투 최소 회복', min: 0, max: 1, step: 0.05 },
      ],
    },
    {
      title: '상태이상',
      fields: [
        { type: 'toggle', path: 'combat.statusEffects.enabled', label: '상태이상 시스템', help: '기본 OFF (요청서 20장)' },
      ],
    },
  ],
}

export const DEFENSE_OVERWATCH_SCHEMA = {
  sections: [
    {
      title: '방어 태세 (요청서 16장)',
      desc: '버튼을 누르면 남은 AP를 전부 소모. 감소율 = 사용 AP × %/AP × 함선 효율.',
      fields: [
        { type: 'toggle', path: 'combat.defense.consumeAllRemainingAp', label: '남은 AP 전부 소모' },
        { type: 'number', path: 'combat.defense.damageReductionPerAp', label: 'AP당 피해 감소', min: 0, max: 50, suffix: '%' },
        { type: 'number', path: 'combat.defense.maxDamageReduction', label: '최대 피해 감소', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.defense.frigateAdaptiveCombatArmorBonus', label: '프리깃 Adaptive Combat Armor', min: 0, max: 1, step: 0.05 },
      ],
    },
    {
      title: '함선 방어 효율',
      fields: CLASSES.map((c) => ({ type: 'number', path: `combat.defense.shipDefenseEfficiency.${c}`, label: c, min: 0, max: 3, step: 0.05 })),
    },
    {
      title: '경계 태세 (요청서 17장)',
      fields: [
        { type: 'number', path: 'combat.overwatch.maxTriggersPerTurn', label: '턴당 최대 반격', min: 0, max: 10 },
        { type: 'number', path: 'combat.overwatch.damageMultiplier', label: '반격 피해 배율', min: 0, max: 2, step: 0.05 },
        ...OW_AP.flatMap((ap) => [
          { type: 'number', path: `combat.overwatch.rulesByAp.${ap}.radius`, label: `AP${ap} 경계 반경`, min: 0, max: 10 },
          { type: 'number', path: `combat.overwatch.rulesByAp.${ap}.chance`, label: `AP${ap} 반격 확률`, min: 0, max: 100, suffix: '%' },
          { type: 'number', path: `combat.overwatch.rulesByAp.${ap}.accuracyPenalty`, label: `AP${ap} 반격 명중 보정`, min: -100, max: 0, suffix: '%' },
        ]),
      ],
    },
  ],
}

export const RETREAT_NEGOTIATION_SCHEMA = {
  sections: [
    {
      title: '후퇴 (요청서 23장)',
      desc: '기함 기준 즉시 판정. 성공해도 다음 라운드 시작 시 이탈.',
      fields: [
        { type: 'number', path: 'combat.retreat.minChance', label: '최소 확률', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.retreat.maxChance', label: '최대 확률', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.retreat.retreatingAccuracyPenalty', label: '후퇴 중 명중', min: -100, max: 0, suffix: '%' },
        { type: 'number', path: 'combat.retreat.retreatingEvasionPenalty', label: '후퇴 중 회피', min: -100, max: 0, suffix: '%' },
        { type: 'toggle', path: 'combat.retreat.retreatingCannotDefend', label: '후퇴 중 방어 불가' },
        { type: 'toggle', path: 'combat.retreat.retreatingCannotOverwatch', label: '후퇴 중 경계 불가' },
        { type: 'toggle', path: 'combat.retreat.allAlliesRetreatedIsDefeat', label: '전원 후퇴 = 패배' },
      ],
    },
    {
      title: '교섭 (요청서 24장)',
      fields: [
        { type: 'number', path: 'combat.negotiation.baseChance', label: '기본 확률', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.minChance', label: '최소 확률', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.maxChance', label: '최대 확률', min: 0, max: 100, suffix: '%' },
      ],
    },
    {
      title: '교섭 보정값',
      fields: [
        { type: 'number', path: 'combat.negotiation.bonuses.flagshipPowerAdvantageMax', label: '전력 우위 최대', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.bonuses.enemyHpBelow50', label: '적 HP 50% 이하', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.bonuses.enemyHpBelow30', label: '적 HP 30% 이하', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.bonuses.enemyFlagshipHpBelow30', label: '적 기함 HP 30% 이하', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.bonuses.researchCommunications', label: 'Communications 연구', min: -100, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.bonuses.enemyBossOrFanatic', label: '보스/광신도', min: -100, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.negotiation.bonuses.enemyPirateOrMercenary', label: '해적/용병', min: -100, max: 100, suffix: '%' },
      ],
    },
    {
      title: '기함 전투력 공식 가중치 (요청서 24장)',
      fields: [
        { type: 'number', path: 'combat.flagshipPower.hpWeight', label: 'HP', min: 0, max: 5, step: 0.05 },
        { type: 'number', path: 'combat.flagshipPower.armorWeight', label: 'Armor', min: 0, max: 5, step: 0.05 },
        { type: 'number', path: 'combat.flagshipPower.shieldWeight', label: 'Shield', min: 0, max: 5, step: 0.05 },
        { type: 'number', path: 'combat.flagshipPower.weaponWeight', label: '무기', min: 0, max: 5, step: 0.05 },
        { type: 'number', path: 'combat.flagshipPower.apWeight', label: 'AP', min: 0, max: 30, step: 0.5 },
        { type: 'number', path: 'combat.flagshipPower.evasionWeight', label: 'Evasion', min: 0, max: 5, step: 0.05 },
      ],
    },
  ],
}

export const FIELD_EFFECTS_SCHEMA = {
  sections: [
    {
      title: '필드 효과 (요청서 13장)',
      desc: '상태이상 대신 지뢰/포탈/잔열/중력장 등을 FieldEffect로 처리. 수치는 최대 HP 대비 %.',
      fields: [
        { type: 'toggle', path: 'combat.fieldEffects.enabled', label: '필드 효과 시스템' },
        { type: 'number', path: 'combat.fieldEffects.params.mine.entryDamagePct', label: '지뢰 진입 피해', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.fieldEffects.params.portal.periodicDamagePct', label: '포탈 지속 피해', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.fieldEffects.params.residual_heat.periodicDamagePct', label: '잔열 지속 피해', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.fieldEffects.params.gravity_well.extraMoveCost', label: '중력장 추가 이동 비용', min: 0, max: 9, suffix: 'AP' },
        { type: 'number', path: 'combat.fieldEffects.params.black_hole.periodicDamagePct', label: '블랙홀 지속 피해', min: 0, max: 100, suffix: '%' },
        { type: 'number', path: 'combat.fieldEffects.params.energy_storm.periodicDamagePct', label: '에너지 폭풍 지속 피해', min: 0, max: 100, suffix: '%' },
      ],
    },
  ],
}
