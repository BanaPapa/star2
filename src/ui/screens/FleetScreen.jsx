import { useDataStore } from '../../state/useDataStore'
import { useFleetStore } from '../../state/useFleetStore'
import { getEffectiveShip, applyEquipment, getUnitFinishers, canPromote, xpToNextLevel } from '../../core/growth'
import AssetImage from '../components/AssetImage'
import EquipSlot from '../components/EquipSlot'
import './FleetScreen.css'

// 함대 편성 화면 — 보유 함선·에이스·레벨·XP·전직 상태를 확인하고 전직을 실행한다(MOD-5 DoD).
// MOD-7: 무기·모듈 장착 슬롯도 여기서 다룬다 — 장착/해제 시 getEffectiveShip 위에 applyEquipment를
// 더 합성해 "전투에 그대로 들어갈 최종 스탯"을 보여준다(BattleScene과 동일한 합성 순서).
// 수치는 useFleetStore(로스터: 레벨·XP·성장치·전직여부·장착)와 ships.json(베이스 스탯)을
// core/growth.js 순수함수로 합성해 그대로 보여준다 — 이 화면이 새 수치를 만들어내지 않는다.
export default function FleetScreen() {
  const ships = useDataStore((s) => s.data?.ships?.ships)
  const aces = useDataStore((s) => s.data?.aces?.aces)
  const skills = useDataStore((s) => s.data?.skills?.skills)
  const items = useDataStore((s) => s.data?.items)
  const roster = useFleetStore((s) => s.roster)
  const ownedItems = useFleetStore((s) => s.ownedItems)
  const promote = useFleetStore((s) => s.promote)

  if (!ships || !aces || !skills || !items) return null

  const shipsById = new Map(ships.map((ship) => [ship.id, ship]))
  const acesById = new Map(aces.map((ace) => [ace.id, ace]))
  const itemsById = new Map(['weapons', 'modules', 'consumables', 'uniques'].flatMap((cat) => items[cat] ?? []).map((i) => [i.id, i]))

  return (
    <div className="fleet-screen">
      <p className="fleet-hint">
        전투에서 승리하면 생존한 함선 전원이 경험치를 얻어 레벨업(스탯 성장)하고, 전직 조건(레벨)을
        만족하면 아래 카드의 <b>전직</b> 버튼이 활성화됩니다 — 전직하면 스탯이 강화되고 그 함선만의
        고유 필살기가 영구 해금되어, 에이스의 필살기와 함께 전투에서 사용할 수 있습니다.
      </p>
      <div className="fleet-roster">
        {roster.map((entry) => {
          const baseShip = shipsById.get(entry.shipId)
          if (!baseShip) return null

          const ship = applyEquipment(getEffectiveShip(baseShip, entry), entry, itemsById)
          const ace = entry.aceId ? acesById.get(entry.aceId) ?? null : null
          const finishers = getUnitFinishers({ ace, ship: baseShip, entry, allSkills: skills })
          const nextXp = xpToNextLevel(baseShip, entry.level)
          const xpRatio = Number.isFinite(nextXp) ? Math.min(1, entry.xp / nextXp) : 1
          const eligible = canPromote(baseShip, entry)

          return (
            <article className={`fleet-card${ship.promoted ? ' fleet-card--promoted' : ''}`} key={entry.instanceId}>
              <header className="fleet-card-head">
                <AssetImage assetKey={baseShip.sprite} alt={ship.name} className="fleet-card-icon" />
                <div>
                  <h3 className="fleet-card-name">
                    {ship.name} <span className="fleet-card-level">Lv.{ship.level}</span>
                    {ship.promoted && <span className="fleet-card-badge">전직 완료</span>}
                  </h3>
                  <p className="fleet-card-role">
                    {baseShip.role}
                    {ace && ` · 지휘관 ${ace.name} (${ace.personality})`}
                  </p>
                </div>
              </header>

              <div className="fleet-xp-row">
                <div className="fleet-xp-bar">
                  <div className="fleet-xp-fill" style={{ width: `${xpRatio * 100}%` }} />
                </div>
                <span className="fleet-xp-label">
                  XP {entry.xp} / {Number.isFinite(nextXp) ? nextXp : '—'}
                </span>
              </div>

              <table className="fleet-stat-table">
                <tbody>
                  <tr>
                    <th>HP</th><td>{baseShip.hp} → <b>{ship.hp}</b></td>
                    <th>ATK</th><td>{baseShip.atk} → <b>{ship.atk}</b></td>
                  </tr>
                  <tr>
                    <th>DEF</th><td>{baseShip.def} → <b>{ship.def}</b></td>
                    <th>ACC</th><td>{baseShip.acc} → <b>{ship.acc}</b></td>
                  </tr>
                  <tr>
                    <th>EVA</th><td>{baseShip.eva} → <b>{ship.eva}</b></td>
                    <th>MOV</th><td>{baseShip.mov} → <b>{ship.mov}</b></td>
                  </tr>
                </tbody>
              </table>

              <div className="equip-slots">
                <EquipSlot entry={entry} slot="weapon" itemsById={itemsById} ownedItems={ownedItems} />
                <EquipSlot entry={entry} slot="module" itemsById={itemsById} ownedItems={ownedItems} />
              </div>

              {finishers.length > 0 && (
                <ul className="fleet-finisher-list">
                  {finishers.map(({ skill, presenterName, source }) => (
                    <li key={skill.id}>
                      <span className={`fleet-finisher-tag fleet-finisher-tag--${source}`}>
                        {source === 'ace' ? '에이스 필살기' : '전직 고유 필살기'}
                      </span>
                      <strong>{skill.name}</strong>
                      <span className="fleet-finisher-desc"> — {skill.desc} ({presenterName})</span>
                    </li>
                  ))}
                </ul>
              )}

              {baseShip.promotion && !ship.promoted && (
                <button className="fleet-promote-btn" disabled={!eligible} onClick={() => promote(entry.instanceId)}>
                  {eligible
                    ? `✨ "${baseShip.promotion.name}"(으)로 전직!`
                    : `전직 조건 — Lv.${baseShip.promotion.requireLevel} 필요 (현재 Lv.${entry.level})`}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
