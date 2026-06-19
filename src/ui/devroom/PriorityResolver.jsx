// 우선순위 충돌 해결 (요청서 28~30장) — native HTML5 Drag and Drop으로 계산 단계 순서를 조정한다.
// 그룹별 리스트에서 드래그로 priority 재정렬, enable/disable 토글, 위험 순서에 경고 표시.
import { useState } from 'react'
import { useGameConfigStore } from '../../state/useGameConfigStore'

const GROUPS = [
  { id: 'accuracy', label: '1. Accuracy Priority' },
  { id: 'evasion',  label: '2. Evasion Priority' },
  { id: 'damage',   label: '3. Damage / Shield / Armor Priority' },
  { id: 'movement', label: '4. Movement Cost Priority' },
  { id: 'field',    label: '5. Field Effect Priority' },
  { id: 'retreat',  label: '6. Retreat / Negotiation Priority' },
  { id: 'reward',   label: '7. Reward / Surrender Priority' },
]

// 위험한 순서 검사 — 특정 규칙이 다른 규칙보다 앞서면 계산이 깨질 수 있다(요청서 30장).
// [beforeId, afterId]: before가 after보다 먼저 와야 정상. 어기면 경고.
const ORDER_WARNINGS = [
  { before: 'damage_shield_absorb', after: 'damage_hp_apply',
    msg: 'Shield Absorption보다 Apply HP Damage가 먼저 실행되면 피해 계산이 비정상적으로 작동할 수 있습니다.' },
  { before: 'damage_armor_reduction', after: 'damage_hp_apply',
    msg: 'Armor Damage Reduction이 Apply HP Damage보다 뒤에 오면 장갑 감소가 무시됩니다.' },
  { before: 'damage_hp_apply', after: 'ship_destroyed_check',
    msg: 'Apply HP Damage보다 Ship Destroyed Check가 먼저 오면 격파 판정이 한 박자 늦습니다.' },
  { before: 'accuracy_subtract_evasion', after: 'accuracy_clamp',
    msg: 'Clamp가 회피 차감보다 먼저 오면 명중률 상/하한이 잘못 적용됩니다.' },
]

function warningsFor(rules) {
  const out = []
  const idx = (id) => rules.findIndex((r) => r.id === id)
  for (const w of ORDER_WARNINGS) {
    const bi = idx(w.before)
    const ai = idx(w.after)
    if (bi !== -1 && ai !== -1 && bi > ai) out.push(w.msg)
  }
  return out
}

export default function PriorityResolver() {
  const rules = useGameConfigStore((s) => s.config.priorityRules) ?? []
  const setPriorityRules = useGameConfigStore((s) => s.setPriorityRules)
  const [dragId, setDragId] = useState(null)

  // 그룹 내에서 dragId를 targetId 위치로 이동 후 priority를 10단위로 재부여.
  function reorder(group, targetId) {
    if (!dragId || dragId === targetId) return
    const groupRules = rules.filter((r) => r.group === group).sort((a, b) => a.priority - b.priority)
    const fromIdx = groupRules.findIndex((r) => r.id === dragId)
    const toIdx = groupRules.findIndex((r) => r.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const next = groupRules.slice()
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    next.forEach((r, i) => { r.priority = (i + 1) * 10 })

    const byId = new Map(next.map((r) => [r.id, r]))
    setPriorityRules(rules.map((r) => byId.get(r.id) ?? r))
  }

  function toggle(id) {
    setPriorityRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const allWarnings = warningsFor(rules)

  return (
    <div className="scr-tabbody">
      <div className="scr-pr-intro">
        <h3 className="scr-section-title">Priority Resolver</h3>
        <p className="scr-section-desc">
          계산 파이프라인 단계별 우선순위를 드래그로 조정합니다(위 → 아래 = 먼저 → 나중).
          규칙을 OFF하면 해당 보정이 계산에서 제외됩니다.
        </p>
        {allWarnings.length > 0 && (
          <div className="scr-pr-warnbox">
            {allWarnings.map((w, i) => <div key={i} className="scr-pr-warn">⚠ {w}</div>)}
          </div>
        )}
      </div>

      <div className="scr-pr-groups">
        {GROUPS.map((g) => {
          const groupRules = rules.filter((r) => r.group === g.id).sort((a, b) => a.priority - b.priority)
          if (groupRules.length === 0) return null
          return (
            <div key={g.id} className="scr-pr-group">
              <div className="scr-pr-group-title">{g.label}</div>
              <ul className="scr-pr-list">
                {groupRules.map((r) => (
                  <li
                    key={r.id}
                    className={`scr-pr-item${r.enabled ? '' : ' scr-pr-item--off'}${dragId === r.id ? ' scr-pr-item--drag' : ''}`}
                    draggable
                    onDragStart={() => setDragId(r.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => reorder(g.id, r.id)}
                  >
                    <span className="scr-pr-grip">⠿</span>
                    <span className="scr-pr-prio">{r.priority}</span>
                    <span className="scr-pr-label">{r.label}{r.description && <em>{r.description}</em>}</span>
                    <button
                      type="button"
                      className={`scr-toggle scr-toggle--sm${r.enabled ? ' scr-toggle--on' : ''}`}
                      onClick={() => toggle(r.id)}
                    >
                      <span className="scr-toggle-knob" />
                      <span className="scr-toggle-txt">{r.enabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
