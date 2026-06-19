// 타 시스템(건물/연구/자원/적 스케일링) override 탭 — 기존 데이터를 참조로 보여주고,
// config.overrides[key]에 JSON override를 편집/저장한다. 런타임 적용은 다음 단계(요청서 32-2 최소 침습).
import { useState } from 'react'
import { useGameConfigStore } from '../../../state/useGameConfigStore'
import { Section } from '../controls'

export default function OverrideTab({ title, desc, overrideKey, sourceData, sourceLabel }) {
  const override = useGameConfigStore((s) => s.config.overrides?.[overrideKey]) ?? {}
  const setPath = useGameConfigStore((s) => s.setPath)

  const [text, setText] = useState(() => JSON.stringify(override, null, 2))
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)

  function commit() {
    try {
      const parsed = text.trim() === '' ? {} : JSON.parse(text)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('최상위는 객체(JSON object)여야 합니다.')
        return
      }
      setPath(`overrides.${overrideKey}`, parsed)
      setError(null)
      setDirty(false)
    } catch (e) {
      setError(`JSON 파싱 오류: ${e.message}`)
    }
  }

  function resetText() {
    setText(JSON.stringify(override, null, 2))
    setError(null)
    setDirty(false)
  }

  return (
    <div className="scr-tabbody">
      <Section title={title} desc={desc}>
        <div className="scr-override">
          <div className="scr-override-edit">
            <div className="scr-override-head">
              <span>override JSON (config.overrides.{overrideKey})</span>
              <span className="scr-override-actions">
                <button className="scr-mini-btn" onClick={commit} disabled={!dirty}>적용</button>
                <button className="scr-mini-btn" onClick={resetText} disabled={!dirty}>되돌리기</button>
              </span>
            </div>
            <textarea
              className={`scr-json${error ? ' scr-json--err' : ''}`}
              spellCheck={false}
              value={text}
              onChange={(e) => { setText(e.target.value); setDirty(true) }}
            />
            {error && <p className="scr-override-err">{error}</p>}
            {!error && dirty && <p className="scr-override-hint">변경됨 — "적용" 후 상단 Save로 영구 저장.</p>}
          </div>

          <div className="scr-override-ref">
            <div className="scr-override-head">참조 데이터 ({sourceLabel}) — 읽기 전용</div>
            <pre className="scr-json scr-json--ro">{JSON.stringify(sourceData ?? {}, null, 2)}</pre>
          </div>
        </div>
      </Section>
    </div>
  )
}
