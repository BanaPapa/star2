import { useEffect, useState } from 'react'
import { useDataStore } from './state/useDataStore'
import LoadingScreen from './ui/screens/LoadingScreen'
import StrategyMapScreen from './ui/screens/StrategyMapScreen'
import BattleScreen from './ui/screens/BattleScreen'
import FleetScreen from './ui/screens/FleetScreen'
import MaintenanceHubScreen from './ui/screens/MaintenanceHubScreen'
import './App.css'

function App() {
  const status = useDataStore((s) => s.status)
  const progress = useDataStore((s) => s.progress)
  const currentKey = useDataStore((s) => s.currentKey)
  const init = useDataStore((s) => s.init)
  const [view, setView] = useState('map')
  const [activeNodeId, setActiveNodeId] = useState(null)

  useEffect(() => {
    init()
  }, [init])

  if (status !== 'ready') {
    return <LoadingScreen progress={progress} currentKey={currentKey} status={status} />
  }

  function handleEnterBattle(nodeId) {
    setActiveNodeId(nodeId)
    setView('battle')
  }

  function handleExitBattle() {
    setActiveNodeId(null)
    setView('map')
  }

  return (
    <div className="dev-screen">
      <h1>
        7<span className="accent">★</span> STAR
      </h1>
      <p className="subtitle">MOD-6 · 전략맵(성단) & 별계 진입 확인</p>

      {view !== 'battle' && (
        <div className="fleet-toggle">
          <button
            className={`fleet-toggle-btn${view === 'map' ? ' active' : ''}`}
            onClick={() => setView('map')}
          >
            🌌 성단 맵
          </button>
          <button
            className={`fleet-toggle-btn${view === 'fleet' ? ' active' : ''}`}
            onClick={() => setView('fleet')}
          >
            🚀 함대 편성
          </button>
          <button
            className={`fleet-toggle-btn${view === 'hub' ? ' active' : ''}`}
            onClick={() => setView('hub')}
          >
            🔧 정비 허브
          </button>
        </div>
      )}

      {view === 'map' && (
        <>
          <p className="hint">
            성단 맵에서 노드를 클릭하면 정보 패널이 열립니다. 인접한 미정복 별계는 &ldquo;🚀 별계
            진입&rdquo; 버튼으로 전투에 들어갈 수 있고, 정복했거나 모항인 인접 노드는 &ldquo;➡ 이동&rdquo;으로
            현재 위치를 옮길 수 있습니다. 별계를 정복하면(전투 승리) 그 자리로 전진하며, 그만큼 인접한
            새 노드의 잠금이 풀립니다.
          </p>
          <StrategyMapScreen onEnterBattle={handleEnterBattle} />
        </>
      )}

      {view === 'battle' && (
        <>
          <p className="hint">
            전투에서 승리하면 생존한 함선이 경험치를 얻어 레벨업하고, 레벨 조건을 채우면 전직해 전용
            필살기를 영구 해금합니다 — &ldquo;🚀 함대 편성&rdquo; 탭에서 로스터의 레벨·XP·전직 상태와
            보유 필살기를 확인하고 전직을 진행할 수 있습니다. 유닛을 선택하면 HUD 아래에 필살기 칩이
            표시되고, <b>TP가 100%</b>가 되면 황금색으로 점멸하며 클릭해 발동할 수 있습니다(TP 전액 소모).
            전투에서 승리하면 노드 정복 상태가 갱신되고, &ldquo;🌌 성단 맵으로 복귀&rdquo; 버튼으로 맵으로
            돌아갈 수 있습니다. 그 외 이동·공격·턴 진행은 이전과 동일합니다(스페이스바: 턴 종료).
          </p>
          <BattleScreen nodeId={activeNodeId} onExit={handleExitBattle} />
        </>
      )}

      {view === 'fleet' && <FleetScreen />}

      {view === 'hub' && (
        <>
          <p className="hint">
            모항 정비 허브 — <b>연구</b> 탭에서 자원을 들여 기술을 해금하면 새 무기·모듈·함선·기능이
            풀립니다. <b>상점</b> 탭에서 해금된 장비를 구매해 보유 인벤토리에 채우고, <b>조합</b> 탭에서는
            연구로 해금한 레시피의 재료를 모아 상점에 없는 신무기를 직접 제작할 수 있습니다. 구매·제작한
            장비는 &ldquo;🚀 함대 편성&rdquo; 탭의 각 함선 카드에서 무기·모듈 슬롯에 장착하면 즉시 전투
            스탯에 반영됩니다.
          </p>
          <MaintenanceHubScreen />
        </>
      )}
    </div>
  )
}

export default App
