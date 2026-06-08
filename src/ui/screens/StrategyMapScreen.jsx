import { useState } from 'react'
import { useDataStore } from '../../state/useDataStore'
import { useProgressStore } from '../../state/useProgressStore'
import './StrategyMapScreen.css'

// 노드 시각 배치 좌표(0~100 퍼센트). systems.json에는 좌표가 없어 연결 그래프
// (s0→s1→s2→s3→{s4,s5}→s6→s7→s8, 데이터 사전 2장의 "선형+약간 분기" 설명)를 바탕으로 직접 설계했다 —
// 정복·잠금 판정과는 무관한 순수 표현용 데이터다.
const NODE_LAYOUT = {
  s0: { x: 6, y: 50 },
  s1: { x: 19, y: 50 },
  s2: { x: 32, y: 50 },
  s3: { x: 45, y: 50 },
  s4: { x: 60, y: 22 },
  s5: { x: 60, y: 78 },
  s6: { x: 75, y: 50 },
  s7: { x: 87, y: 50 },
  s8: { x: 97, y: 50 },
}

const ROLE_ICON = { home: '🏠', mission: '🪐', boss: '👹' }
const ROLE_LABEL = { home: '모항', mission: '미션 별계', boss: '성단 보스' }
const STATUS_LABEL = {
  current: '📍 현재 위치',
  conquered: '✅ 정복 완료',
  reachable: '🚀 진입 가능',
  locked: '🔒 잠김 — 인접 노드를 거쳐야 합니다',
}

function buildLinks(systems) {
  const links = []
  const seen = new Set()
  for (const node of systems) {
    for (const otherId of node.connections ?? []) {
      const key = [node.id, otherId].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      links.push([node.id, otherId])
    }
  }
  return links
}

// 정복 상태 모델(useProgressStore)은 "현재 위치의 connections에 포함되는가"만으로 이동·진입 가능 여부를
// 판정한다 — 정복할수록 현재 위치가 전진하고, 그만큼 인접한 새 노드가 자연히 열리는 단순한 프런티어 모델.
function statusOf(node, { currentNodeId, conqueredNodeIds, adjacentIds }) {
  if (node.id === currentNodeId) return 'current'
  if (conqueredNodeIds.includes(node.id)) return 'conquered'
  if (adjacentIds.has(node.id)) return 'reachable'
  return 'locked'
}

export default function StrategyMapScreen({ onEnterBattle }) {
  const systems = useDataStore((s) => s.data?.systems?.systems)
  const enemyDefs = useDataStore((s) => s.data?.enemies?.enemies)
  const bossDefs = useDataStore((s) => s.data?.enemies?.bosses)
  const currentNodeId = useProgressStore((s) => s.currentNodeId)
  const conqueredNodeIds = useProgressStore((s) => s.conqueredNodeIds)
  const moveTo = useProgressStore((s) => s.moveTo)

  const [selectedId, setSelectedId] = useState(null)

  if (!systems) return null

  const byId = new Map(systems.map((node) => [node.id, node]))
  const enemyById = new Map((enemyDefs ?? []).map((e) => [e.id, e]))
  const bossById = new Map((bossDefs ?? []).map((b) => [b.id, b]))
  const currentNode = byId.get(currentNodeId)
  const adjacentIds = new Set(currentNode?.connections ?? [])
  const links = buildLinks(systems)
  const selected = byId.get(selectedId) ?? currentNode

  function enemyName(id) {
    return enemyById.get(id)?.name ?? bossById.get(id)?.name ?? id
  }

  return (
    <div className="map-screen">
      <div className="map-canvas">
        <svg className="map-links" viewBox="0 0 100 100" preserveAspectRatio="none">
          {links.map(([a, b]) => {
            const pa = NODE_LAYOUT[a]
            const pb = NODE_LAYOUT[b]
            if (!pa || !pb) return null
            const cleared = conqueredNodeIds.includes(a) && conqueredNodeIds.includes(b)
            return (
              <line
                key={`${a}-${b}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                className={`map-link${cleared ? ' map-link--cleared' : ''}`}
              />
            )
          })}
        </svg>

        {systems.map((node) => {
          const pos = NODE_LAYOUT[node.id]
          if (!pos) return null
          const status = statusOf(node, { currentNodeId, conqueredNodeIds, adjacentIds })
          return (
            <button
              key={node.id}
              type="button"
              className={`map-node map-node--${status}${selectedId === node.id ? ' map-node--selected' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => setSelectedId(node.id)}
            >
              <span className="map-node-icon">{ROLE_ICON[node.role] ?? '🪐'}</span>
              <span className="map-node-status-icon">{STATUS_LABEL[status].split(' ')[0]}</span>
              <span className="map-node-label">{node.name}</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <aside className="map-info">
          {(() => {
            const status = statusOf(selected, { currentNodeId, conqueredNodeIds, adjacentIds })
            const enemyIds = [...(selected.enemy ?? []), selected.miniboss, selected.boss].filter(Boolean)

            return (
              <>
                <h3 className="map-info-name">
                  {ROLE_ICON[selected.role] ?? '🪐'} {selected.name}
                  <span className="map-info-theme"> · {selected.theme}</span>
                </h3>
                <p className="map-info-meta">
                  {ROLE_LABEL[selected.role] ?? selected.role}
                  {selected.terrain && selected.terrain !== 'none' ? ` · 지형: ${selected.terrain}` : ''}
                  {' · '}
                  <span className={`map-info-status map-info-status--${status}`}>{STATUS_LABEL[status]}</span>
                </p>

                {enemyIds.length > 0 && (
                  <p className="map-info-enemies">⚔️ 출현 전력: {enemyIds.map(enemyName).join(', ')}</p>
                )}
                {selected.reward && (
                  <p className="map-info-reward">
                    🎁 클리어 보상:{' '}
                    {selected.reward.ace && `에이스 "${selected.reward.ace}" 합류`}
                    {selected.reward.aceCondition && `에이스 "${selected.reward.aceCondition}" 합류 조건 달성`}
                    {selected.reward.resource && `자원 ${Object.entries(selected.reward.resource).map(([k, v]) => `${k} +${v}`).join(', ')}`}
                    {selected.reward.unlockShip && ` · 함선 "${selected.reward.unlockShip}" 해금`}
                    {selected.reward.ending && '엔딩 — 다음 은하 티저'}
                  </p>
                )}

                {status === 'current' && <p className="map-info-hint">현재 함대가 머무르고 있는 노드입니다.</p>}
                {status === 'locked' && (
                  <p className="map-info-hint">🔒 인접한 노드를 먼저 정복해야 이 별계로 가는 길이 열립니다.</p>
                )}
                {status === 'reachable' && (selected.role === 'home' || conqueredNodeIds.includes(selected.id)) && (
                  <button className="map-action-btn" onClick={() => moveTo(selected.id)}>
                    ➡ 이 노드로 이동
                  </button>
                )}
                {status === 'reachable' && selected.role !== 'home' && !conqueredNodeIds.includes(selected.id) && (
                  <button className="map-action-btn map-action-btn--enter" onClick={() => onEnterBattle(selected.id)}>
                    🚀 별계 진입 — 전투 시작
                  </button>
                )}
              </>
            )
          })()}
        </aside>
      )}
    </div>
  )
}
