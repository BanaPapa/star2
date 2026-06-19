// 'a.b.c' 경로의 값을 읽는다(관제실 ConfigField 바인딩용).
export function getIn(obj, path) {
  const keys = Array.isArray(path) ? path : String(path).split('.')
  let cur = obj
  for (const k of keys) {
    if (cur == null) return undefined
    cur = cur[k]
  }
  return cur
}
