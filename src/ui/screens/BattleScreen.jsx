import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import BattleScene from '../../game/scenes/BattleScene'
import { useDataStore } from '../../state/useDataStore'
import { useProgressStore } from '../../state/useProgressStore'

const WIDTH = 1200
const HEIGHT = 850

// MOD-6: 더 이상 고정 대진이 아니라, 전략맵에서 선택한 노드(nodeId)의 적 구성으로 전투에 진입한다.
// 승리 시 useProgressStore.conquer로 정복 상태를 갱신하고, "맵으로 복귀" 시 onExit으로 화면을 되돌린다.
export default function BattleScreen({ nodeId, onExit }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const onExitRef = useRef(onExit)
  useEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  const ships = useDataStore((s) => s.data?.ships?.ships)
  const combatRules = useDataStore((s) => s.data?.ships?.combatRules)
  const skills = useDataStore((s) => s.data?.skills?.skills)
  const aces = useDataStore((s) => s.data?.aces?.aces)
  const enemies = useDataStore((s) => s.data?.enemies)
  const items = useDataStore((s) => s.data?.items)
  const systems = useDataStore((s) => s.data?.systems?.systems)
  const conquer = useProgressStore((s) => s.conquer)

  const node = systems?.find((s) => s.id === nodeId) ?? null

  useEffect(() => {
    if (!ships || !combatRules || !skills || !aces || !enemies || !items || !node || !containerRef.current || gameRef.current) return

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: '#0a0e27',
    })
    game.scene.add('BattleScene', BattleScene, true, {
      ships,
      combatRules,
      skills,
      aces,
      enemies,
      items,
      node,
      onVictory: (clearedNode) => conquer(clearedNode.id),
      onExit: () => onExitRef.current?.(),
    })
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [ships, combatRules, skills, aces, enemies, items, node, conquer])

  return <div className="battle-screen" ref={containerRef} />
}
