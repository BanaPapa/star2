// 관제실 공용 입력 컴포넌트 — config 경로(path)에 바인딩되어 useGameConfigStore에 즉시 반영한다.
import { useGameConfigStore } from '../../state/useGameConfigStore'
import { getIn } from './pathUtil'

export function Section({ title, desc, children }) {
  return (
    <section className="scr-section">
      <div className="scr-section-head">
        <h3 className="scr-section-title">{title}</h3>
        {desc && <p className="scr-section-desc">{desc}</p>}
      </div>
      <div className="scr-section-body">{children}</div>
    </section>
  )
}

// 숫자 필드 — path에 number를 쓴다.
export function NumberField({ path, label, help, min, max, step = 1, suffix }) {
  const value = useGameConfigStore((s) => getIn(s.config, path))
  const setPath = useGameConfigStore((s) => s.setPath)
  return (
    <label className="scr-field">
      <span className="scr-field-lbl">{label}{help && <em className="scr-field-help">{help}</em>}</span>
      <span className="scr-field-input">
        <input
          type="number"
          value={value ?? ''}
          min={min} max={max} step={step}
          onChange={(e) => {
            const v = e.target.value === '' ? '' : Number(e.target.value)
            setPath(path, v === '' ? 0 : v)
          }}
        />
        {suffix && <span className="scr-field-suffix">{suffix}</span>}
      </span>
    </label>
  )
}

// 불리언 토글.
export function ToggleField({ path, label, help }) {
  const value = useGameConfigStore((s) => getIn(s.config, path))
  const setPath = useGameConfigStore((s) => s.setPath)
  return (
    <label className="scr-field scr-field--toggle">
      <span className="scr-field-lbl">{label}{help && <em className="scr-field-help">{help}</em>}</span>
      <button
        type="button"
        className={`scr-toggle${value ? ' scr-toggle--on' : ''}`}
        onClick={() => setPath(path, !value)}
        aria-pressed={!!value}
      >
        <span className="scr-toggle-knob" />
        <span className="scr-toggle-txt">{value ? 'ON' : 'OFF'}</span>
      </button>
    </label>
  )
}

// 셀렉트.
export function SelectField({ path, label, help, options }) {
  const value = useGameConfigStore((s) => getIn(s.config, path))
  const setPath = useGameConfigStore((s) => s.setPath)
  return (
    <label className="scr-field">
      <span className="scr-field-lbl">{label}{help && <em className="scr-field-help">{help}</em>}</span>
      <select className="scr-select" value={value ?? ''} onChange={(e) => setPath(path, e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

// 읽기전용 텍스트(공식 등 문자열 필드).
export function TextField({ path, label, help }) {
  const value = useGameConfigStore((s) => getIn(s.config, path))
  const setPath = useGameConfigStore((s) => s.setPath)
  return (
    <label className="scr-field">
      <span className="scr-field-lbl">{label}{help && <em className="scr-field-help">{help}</em>}</span>
      <input className="scr-text" type="text" value={value ?? ''} onChange={(e) => setPath(path, e.target.value)} />
    </label>
  )
}
