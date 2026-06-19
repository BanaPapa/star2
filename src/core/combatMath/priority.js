// 우선순위 규칙 조회 헬퍼 — config.priorityRules에서 특정 규칙의 enable 여부/순서를 읽는다.
// 관제실 Priority Resolver에서 규칙을 끄면 해당 계산 항목이 제외되도록 계산 함수가 이를 참조한다.

/**
 * 규칙 id가 활성(enabled)인지 — 규칙이 없으면 기본 활성(true)으로 간주.
 * @param {object} config
 * @param {string} ruleId
 * @returns {boolean}
 */
export function isRuleEnabled(config, ruleId) {
  const rules = config?.priorityRules
  if (!Array.isArray(rules)) return true
  const rule = rules.find((r) => r.id === ruleId)
  return rule ? rule.enabled !== false : true
}

/**
 * 그룹의 규칙들을 priority 오름차순으로 반환한다(계산 단계 순서).
 * @param {object} config
 * @param {string} group
 * @returns {Array}
 */
export function getRulesInOrder(config, group) {
  const rules = config?.priorityRules
  if (!Array.isArray(rules)) return []
  return rules
    .filter((r) => r.group === group)
    .slice()
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
}
