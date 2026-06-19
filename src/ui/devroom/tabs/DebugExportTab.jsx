// Debug / Export 탭 — JSON 내보내기/불러오기/초기화/검증 + 현재 config 원본 보기.
import { useRef, useState } from 'react'
import { useGameConfigStore } from '../../../state/useGameConfigStore'
import { Section } from '../controls'

export default function DebugExportTab() {
  const config = useGameConfigStore((s) => s.config)
  const exportJson = useGameConfigStore((s) => s.exportJson)
  const importJson = useGameConfigStore((s) => s.importJson)
  const resetAll = useGameConfigStore((s) => s.resetAll)
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)

  function onPickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result))
        const res = importJson(obj)
        setMsg(res.ok ? { ok: true, text: '불러오기 완료 — 상단 Save로 영구 저장하세요.' } : { ok: false, text: res.error })
      } catch (err) {
        setMsg({ ok: false, text: `JSON 파싱 오류: ${err.message}` })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function validate() {
    const issues = []
    const acc = config?.combat?.accuracy ?? {}
    if (acc.minHitChance > acc.maxHitChance) issues.push('명중률 최소값이 최대값보다 큽니다.')
    if ((config?.combat?.defense?.maxDamageReduction ?? 0) > 100) issues.push('방어 최대 감소율이 100%를 초과합니다.')
    const ids = (config?.priorityRules ?? []).map((r) => r.id)
    if (new Set(ids).size !== ids.length) issues.push('priorityRules에 중복 id가 있습니다.')
    setMsg(issues.length ? { ok: false, text: issues.join(' / ') } : { ok: true, text: '검증 통과 — 문제 없음.' })
  }

  return (
    <div className="scr-tabbody">
      <Section title="Export / Import / 검증">
        <div className="scr-btn-row">
          <button className="scr-btn" onClick={() => exportJson()}>⬇ Export JSON</button>
          <button className="scr-btn" onClick={() => fileRef.current?.click()}>⬆ Import JSON</button>
          <button className="scr-btn" onClick={validate}>✓ 검증</button>
          <button
            className="scr-btn scr-btn--danger"
            onClick={() => { if (window.confirm('모든 설정을 기본값으로 초기화할까요?')) { resetAll(); setMsg({ ok: true, text: '기본값으로 초기화됨.' }) } }}
          >↺ 전체 초기화</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onPickFile} />
        </div>
        {msg && <p className={`scr-msg${msg.ok ? ' scr-msg--ok' : ' scr-msg--err'}`}>{msg.text}</p>}
      </Section>

      <Section title="현재 config (읽기 전용)" desc="localStorage 키: 7star_dev_config">
        <pre className="scr-json scr-json--ro scr-json--tall">{JSON.stringify(config, null, 2)}</pre>
      </Section>
    </div>
  )
}
