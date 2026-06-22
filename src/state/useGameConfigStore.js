// 개발자 설정 관제실 상태 — DEFAULT_GAME_CONFIG를 localStorage("star_dev_config")에 저장/복원한다.
// 저장본은 DEFAULT 위에 deep-merge 되어, 구버전 저장본에도 신규 기본 키가 자동으로 채워진다.
// 전투 계산 순수함수는 React 없이 useGameConfigStore.getState().config 로 읽는다(요청서 32-1).
import { create } from 'zustand'
import { DEFAULT_GAME_CONFIG, DEFAULT_PRIORITY_RULES, GAME_CONFIG_VERSION } from '../data/defaultGameConfig'

const CONFIG_KEY = '7star_dev_config' // 요청서는 star_dev_config — 프로젝트 키 접두사(7star_)에 맞춤
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

// 깊은 복제(순수 데이터 — 함수/클래스 없음).
export function deepClone(value) {
  if (Array.isArray(value)) return value.map(deepClone)
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepClone(v)]))
  }
  return value
}

// base(기본값) 위에 patch(저장본)를 deep-merge — 배열/원시값은 patch가 통째로 대체.
// 항상 새 객체를 반환(불변).
export function deepMerge(base, patch) {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return deepClone(patch === undefined ? base : patch)
  }
  const out = {}
  for (const key of new Set([...Object.keys(base), ...Object.keys(patch)])) {
    if (key in patch) out[key] = deepMerge(base[key], patch[key])
    else out[key] = deepClone(base[key])
  }
  return out
}

// 'a.b.c' 경로에 value를 불변으로 설정한 새 객체를 반환. 숫자 키도 객체 키로 처리.
export function setIn(obj, path, value) {
  const keys = Array.isArray(path) ? path : String(path).split('.')
  if (keys.length === 0) return value
  const [head, ...rest] = keys
  const child = isPlainObject(obj) ? obj : {}
  return {
    ...child,
    [head]: rest.length === 0 ? value : setIn(child[head], rest, value),
  }
}

function loadRaw() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY) ?? 'null') } catch { return null }
}

function persist(config) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify({ version: GAME_CONFIG_VERSION, config })) } catch { /* localStorage 불가 환경 — 무시 */ }
}

// 저장본을 DEFAULT 위에 병합해 완전한 config를 만든다.
function hydrate() {
  const raw = loadRaw()
  const savedConfig = raw && isPlainObject(raw.config) ? raw.config : (isPlainObject(raw) ? raw : null)
  const merged = savedConfig ? deepMerge(DEFAULT_GAME_CONFIG, savedConfig) : deepClone(DEFAULT_GAME_CONFIG)
  // priorityRules는 항상 배열 유지 — 저장본에 없으면 기본 규칙.
  if (!Array.isArray(merged.priorityRules) || merged.priorityRules.length === 0) {
    merged.priorityRules = DEFAULT_PRIORITY_RULES.map((r) => ({ ...r }))
  }
  return merged
}

// import한 JSON이 최소한의 형태인지 검증(요청서: 외부 데이터 신뢰 금지).
export function validateImportedConfig(obj) {
  const cfg = isPlainObject(obj?.config) ? obj.config : obj
  if (!isPlainObject(cfg)) return { ok: false, error: 'JSON 최상위가 객체가 아닙니다.' }
  if (!isPlainObject(cfg.combat)) return { ok: false, error: 'config.combat 섹션이 없습니다.' }
  return { ok: true, config: cfg }
}

export const useGameConfigStore = create((set, get) => ({
  config: hydrate(),
  // 'current': 현재 전투에 즉시 반영, 'next': 다음 전투부터. 표시/동작 힌트.
  pendingScope: 'current',
  dirty: false, // 마지막 저장 이후 변경 여부

  // 경로 기반 불변 업데이트 (예: setPath('combat.accuracy.maxHitChance', 90)).
  setPath: (path, value) => set((s) => ({ config: setIn(s.config, path, value), dirty: true })),

  setPriorityRules: (rules) => set((s) => ({ config: { ...s.config, priorityRules: rules }, dirty: true })),

  // localStorage에 영구 저장.
  save: () => { persist(get().config); set({ dirty: false }) },

  // 전체 기본값으로 초기화(저장까지).
  resetAll: () => {
    const fresh = deepClone(DEFAULT_GAME_CONFIG)
    fresh.priorityRules = DEFAULT_PRIORITY_RULES.map((r) => ({ ...r }))
    persist(fresh)
    set({ config: fresh, dirty: false })
  },

  // 현재 config를 JSON 파일로 내보내기(브라우저 다운로드).
  exportJson: () => {
    const payload = JSON.stringify({ version: GAME_CONFIG_VERSION, config: get().config }, null, 2)
    try {
      const blob = new Blob([payload], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `star_dev_config_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch { /* 다운로드 불가 환경 — 무시 */ }
    return payload
  },

  // JSON 객체를 검증 후 DEFAULT 위에 병합해 적용(저장은 하지 않음 — 사용자가 Save).
  importJson: (obj) => {
    const result = validateImportedConfig(obj)
    if (!result.ok) return result
    const merged = deepMerge(DEFAULT_GAME_CONFIG, result.config)
    if (!Array.isArray(merged.priorityRules) || merged.priorityRules.length === 0) {
      merged.priorityRules = DEFAULT_PRIORITY_RULES.map((r) => ({ ...r }))
    }
    set({ config: merged, dirty: true })
    return { ok: true }
  },

  // 적용 범위 헬퍼 — 실제 전투 배선은 다음 단계, 여기선 저장 + 범위 플래그만.
  applyToCurrentBattle: () => { get().save(); set({ pendingScope: 'current' }) },
  applyNextBattleOnly:  () => { get().save(); set({ pendingScope: 'next' }) },
}))

// 비-React 접근 헬퍼 — combatMath 등 순수 함수에서 현재 config가 필요할 때.
export const getGameConfig = () => useGameConfigStore.getState().config
