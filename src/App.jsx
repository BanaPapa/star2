import { useEffect, useState } from 'react'
import { useDataStore } from './state/useDataStore'
import { useSettingsStore } from './state/useSettingsStore'
import { soundManager } from './core/soundManager'
import LoadingScreen from './ui/screens/LoadingScreen'
import TitleScreen from './ui/screens/TitleScreen'
import StrategyMapScreen from './ui/screens/StrategyMapScreen'
import BattleScreen from './ui/screens/BattleScreen'
import FleetScreen from './ui/screens/FleetScreen'
import MaintenanceHubScreen from './ui/screens/MaintenanceHubScreen'
import EndingScreen from './ui/screens/EndingScreen'
import SaveScreen from './ui/screens/SaveScreen'
import ResourceHud from './ui/components/ResourceHud'
import './App.css'

const BGM_FOR_VIEW = {
  title: 'title',
  map: 'map',
  fleet: 'map',
  hub: 'map',
  save: 'map',
  battle: 'battle',
  ending: 'map',
}

function App() {
  const status = useDataStore((s) => s.status)
  const progress = useDataStore((s) => s.progress)
  const currentKey = useDataStore((s) => s.currentKey)
  const init = useDataStore((s) => s.init)
  const soundVolume = useSettingsStore((s) => s.soundVolume)
  const [view, setView] = useState('title')
  const [prevView, setPrevView] = useState(null)
  const [activeNodeId, setActiveNodeId] = useState(null)

  function navigate(next) {
    setPrevView(view)
    setView(next)
  }

  useEffect(() => { init() }, [init])

  useEffect(() => {
    soundManager.setVolume(soundVolume)
  }, [soundVolume])

  useEffect(() => {
    const bgmKey = BGM_FOR_VIEW[view]
    if (bgmKey) soundManager.playBgm(bgmKey)
  }, [view])

  if (status !== 'ready') {
    return <LoadingScreen progress={progress} currentKey={currentKey} status={status} />
  }

  function handleNewGame() { navigate('map') }
  function handleContinue() { navigate('save') }
  function handleSettings()  { navigate('save') }
  function handleGameOver()  { navigate('gameover') }

  function handleEnterBattle(nodeId) {
    setActiveNodeId(nodeId)
    navigate('battle')
  }

  function handleExitBattle() {
    setActiveNodeId(null)
    navigate('map')
  }

  function handleEnding() {
    setActiveNodeId(null)
    navigate('ending')
  }

  const isShell = view === 'title' || view === 'battle' || view === 'ending'

  return (
    <>
      {view === 'title' && (
        <TitleScreen
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onSettings={handleSettings}
        />
      )}

      {view === 'gameover' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#05020a', gap: 24 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 52, color: '#dc2626', textShadow: '0 0 40px rgba(220,38,38,0.6)' }}>💥 GAME OVER</div>
          <p style={{ fontFamily: 'var(--mono)', color: '#cdd8f4', fontSize: 18, margin: 0 }}>함대가 전멸했습니다. 처음부터 다시 도전하세요.</p>
          <button onClick={() => window.location.reload()} style={{ fontFamily: 'var(--mono)', fontSize: 16, padding: '12px 32px', background: 'rgba(220,38,38,0.18)', border: '2px solid #dc2626', borderRadius: 10, color: '#ffd166', cursor: 'pointer', letterSpacing: 1 }}>
            🔄 새 게임 시작
          </button>
        </div>
      )}

      {view !== 'title' && view !== 'gameover' && (
        <div className="dev-screen">
          {view !== 'map' && <h1>7<span className="accent">★</span> STAR</h1>}
          {view !== 'map' && <p className="subtitle">MOD-13 COMPLETE · 1성단 수직 슬라이스</p>}

          {!isShell && <ResourceHud />}

          {!isShell && (
            <div className="fleet-toggle">
              <button
                className={`fleet-toggle-btn${view === 'map' ? ' active' : ''}`}
                onClick={() => navigate('map')}
              >
                🌌 성단 맵
              </button>
              <button
                className={`fleet-toggle-btn${view === 'fleet' ? ' active' : ''}`}
                onClick={() => navigate('fleet')}
              >
                🚀 함대 편성
              </button>
              <button
                className={`fleet-toggle-btn${view === 'hub' ? ' active' : ''}`}
                onClick={() => navigate('hub')}
              >
                🔧 정비 허브
              </button>
              <button
                className={`fleet-toggle-btn${view === 'save' ? ' active' : ''}`}
                onClick={() => navigate('save')}
              >
                💾 저장/설정
              </button>
            </div>
          )}

          {view === 'map' && (
            <StrategyMapScreen onEnterBattle={handleEnterBattle} onGameOver={handleGameOver} />
          )}

          {view === 'battle' && (
            <BattleScreen nodeId={activeNodeId} onExit={handleExitBattle} onEnding={handleEnding} onGameOver={handleGameOver} />
          )}

          {view === 'save' && (
            <SaveScreen
              onBack={prevView === 'title' ? () => navigate('title') : undefined}
              onLoaded={() => navigate('map')}
            />
          )}

          {view === 'ending' && <EndingScreen onRestart={() => window.location.reload()} />}

          {view === 'fleet' && <FleetScreen />}

          {view === 'hub' && <MaintenanceHubScreen />}
        </div>
      )}
    </>
  )
}

export default App
