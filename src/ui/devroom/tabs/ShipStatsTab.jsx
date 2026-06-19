// 함선 스탯 탭 — ships.json 기본값 위에 config.overrides.shipStats[id]로 덮어쓴다.
// 입력값이 기본값과 같으면 override를 제거(데이터 깔끔 유지). 런타임 적용은 다음 단계.
import { useDataStore } from '../../../state/useDataStore'
import { useGameConfigStore } from '../../../state/useGameConfigStore'
import { Section } from '../controls'

const STATS = [
  { key: 'hp', label: 'HP' },
  { key: 'shield', label: 'Shield' },
  { key: 'armor', label: 'Armor' },
  { key: 'armorDurability', label: 'Armor내구' },
  { key: 'atk', label: 'ATK' },
  { key: 'def', label: 'DEF' },
  { key: 'acc', label: 'ACC' },
  { key: 'eva', label: 'EVA' },
  { key: 'ap', label: 'AP' },
  { key: 'mov', label: 'MOV' },
]

function StatCell({ shipId, stat, base }) {
  const override = useGameConfigStore((s) => s.config.overrides?.shipStats?.[shipId]?.[stat])
  const setPath = useGameConfigStore((s) => s.setPath)
  const value = override ?? base ?? ''
  const isOverridden = override != null && override !== base
  return (
    <input
      className={`scr-statcell${isOverridden ? ' scr-statcell--over' : ''}`}
      type="number"
      value={value}
      title={isOverridden ? `기본값 ${base}` : '기본값'}
      onChange={(e) => {
        const v = e.target.value === '' ? '' : Number(e.target.value)
        setPath(`overrides.shipStats.${shipId}.${stat}`, v === '' ? base ?? 0 : v)
      }}
    />
  )
}

export default function ShipStatsTab() {
  const ships = useDataStore((s) => s.data?.ships?.ships) ?? []

  return (
    <div className="scr-tabbody">
      <Section
        title="함선 스탯 (요청서 27장)"
        desc="ships.json 기본값을 관제실에서 덮어쓴다. 노란 칸 = 기본값과 다른 override. Shield/Armor 필드는 ships.json에 추가됨."
      >
        <div className="scr-table-wrap">
          <table className="scr-table">
            <thead>
              <tr>
                <th className="scr-table-name">함선</th>
                {STATS.map((s) => <th key={s.key}>{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {ships.map((ship) => (
                <tr key={ship.id}>
                  <td className="scr-table-name">{ship.name} <em>{ship.id}</em></td>
                  {STATS.map((s) => (
                    <td key={s.key}>
                      <StatCell shipId={ship.id} stat={s.key} base={ship[s.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
