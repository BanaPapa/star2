# STAR 전투 시스템 v1.0 — 작업 인계 문서

> 다른 PC / 다음 세션에서 전투 시스템 작업을 이어가기 위한 단일 인계 문서.
> 최종 업데이트: 2026-06-19 · 작성 환경: React 19 + Phaser 4 + Zustand + Vite (순수 JS)

---

## 0. 30초 요약

원본 기획서(전투 시스템 개발 요청서 v1.0)를 **2단계로 나눠** 구현 중.

- **1단계 (완료)**: 데이터 주도 config 백본 + 전투 계산 순수함수(combatMath) + 15탭 개발자 관제실(System Control Room) + Priority Resolver.
- **2단계 (완료)**: 핵심 전투 모델을 실제 전투(BattleScene)에 배선 — 무기 티어별 전장 크기, Shield/Armor 피해 파이프라인, 손상 단계.
- **3단계 (다음)**: 방어/경계 태세 행동, 기함 시스템, 필드효과, 후퇴·교섭 기함 기준 판정, 투항 보상 등.

전부 **비파괴(additive)** 원칙: 기존 코드/데이터 삭제 없음. 기존 `core/combat.js`(`resolveAttack`)는 필살기 경로에서 아직 사용 중이라 남겨둠.

---

## 1. 빠른 시작

```bash
git clone <repo>           # 또는 git pull
cd star2
npm install                # vitest 포함 (package.json에 추가됨)
npm run dev                # Vite 개발 서버
npm test                   # combatMath 단위 테스트 29개
npm run build              # 프로덕션 빌드 (전체 import 그래프 검증)
npm run lint               # ESLint (아래 "알려진 lint" 참고)
```

**개발자 관제실 열기**: 게임 실행 후 **F9** 또는 백틱(`` ` ``) 키, 또는 상단바 **⚙ 관제실** 버튼. **Esc**로 닫기.

> ⚠️ 설정은 브라우저 **localStorage**(`7star_dev_config`)에 저장된다. **PC가 바뀌면 관제실에서 조정한 값은 따라오지 않는다.** 옮기려면 관제실 → Debug/Export 탭 → **Export JSON**으로 파일을 받아 새 PC에서 **Import JSON** 후 Save. 코드 기본값(`defaultGameConfig.js`)은 git으로 동기화됨.

---

## 2. 작업 상태 — 기획서 33장 완료 기준 대비

| # | 항목 | 상태 |
|---|------|------|
| 1 | 연구 티어별 전장 크기 | ✅ 배선됨 (`BattleScreen.jsx`) |
| 2 | Command Center 보유량만 출격 규모 결정 | ✅ 기존 구조 유지(별도 제한 없음) |
| 3 | 지형별 이동 AP | ⚠️ config/함수 준비, BattleScene `grid.js`는 아직 1AP 고정 → 3단계 |
| 4 | 성운/잔해 명중·회피 반영 | ✅ `resolveCombat`이 combatMath로 처리(기존 terrain.js evaMod/accMod 사용) |
| 5 | 무기 슬롯 1개 단위 공격 | ⚠️ 기존 단일 공격 구조 유지(다중 슬롯 미구현, config `multiSlotAttackEnabled:false`) |
| 6 | AP 부족 무기 비활성화 | 기존 AP 비용 1 고정 — 무기별 AP는 3단계 |
| 7 | 쿨타임 기본 비활성 | ✅ config `weapon.cooldownEnabled:false` |
| 8 | 명중률 = 무기 명중 − 회피 중심 | ✅ `calculateHitChance` (15~95 클램프) |
| 9 | **Armor = 피해 감소 방어력** | ✅ `resolveDamagePipeline` (HP 앞 체력층 아님) |
| 10 | Shield 전투 중 자동 회복 안 함 | ✅ config `autoRechargeDuringBattle:false` |
| 11 | Shield 전투 간 이월 | ❌ 현재 매 전투 최대치로 시작 → 3단계(로스터에 shield 저장 필요) |
| 12 | 상태이상 미구현 | ✅ config `statusEffects.enabled:false` |
| 13 | 지뢰/포탈/잔열/중력장 FieldEffect | ⚠️ config 구조만, 런타임 미구현 → 3단계 |
| 14 | HP 비율 손상 단계 | ✅ `getDamageState` + `resolveCombat`/`refillAp` 적용 |
| 15 | 아군 격파 시 함대 삭제 | ✅ 기존 `destroyUnit`이 로스터에서 제거 |
| 16 | 적 손상 시 투항 | ❌ 3단계 |
| 17 | 투항 함선 = 함선 자체 보상 | ❌ 3단계 |
| 18 | 후퇴 기함 기준·다음 라운드 이탈 | ⚠️ 함수(`calculateRetreatChance`) 준비, BattleScreen은 임시 공식 사용 → 3단계 |
| 19 | 후퇴/교섭 실패 시 기함 AP 0 | ❌ 3단계 |
| 20 | 관제실에서 수치 조정 | ✅ 15탭 + Priority Resolver |
| 21 | Priority Resolver 드래그 우선순위 | ✅ native HTML5 DnD + 위험 순서 경고 |
| 22 | LocalStorage 저장 + JSON Export/Import | ✅ |

범례: ✅ 완료 · ⚠️ 부분(함수/데이터는 준비, 라이브 배선 일부) · ❌ 미착수

---

## 3. 파일 맵

### 신규 생성 (1단계)
```
src/data/defaultGameConfig.js        # DEFAULT_GAME_CONFIG, BATTLEFIELD_SIZE_BY_TIER, DEFAULT_PRIORITY_RULES, weaponTierByResearch
src/state/useGameConfigStore.js      # Zustand store, localStorage '7star_dev_config', deepMerge/setPath/export/import
                                     #   비-React 접근: getGameConfig()
src/core/combatMath/                 # 전투 계산 순수함수 (config 인자 기반, UI 의존 없음)
  ├─ index.js                        #   re-export
  ├─ battlefield.js                  #   getBattlefieldSizeByTier
  ├─ playerTier.js                   #   getPlayerWeaponTier (해금 연구 → 무기 티어)
  ├─ movement.js                     #   getTerrainMoveCost, isDiagonalMovementAllowed
  ├─ range.js                        #   calculateFinalRange, isInWeaponRange
  ├─ accuracy.js                     #   calculateHitChance, calculateEvasion
  ├─ damage.js                       #   calculateDamage, applyShield/Armor*, resolveDamagePipeline  ← 핵심
  ├─ stance.js                       #   calculateDefenseReduction, calculateOverwatchChance
  ├─ flagship.js                     #   calculateFlagshipPower, calculateRetreat/NegotiationChance
  ├─ damageState.js                  #   getDamageState (정상/경미/중파/대파/격파)
  ├─ priority.js                     #   isRuleEnabled, getRulesInOrder
  └─ __tests__/combatMath.test.js    #   vitest 29개

src/ui/devroom/                      # 개발자 설정 관제실
  ├─ SystemControlRoom.jsx           #   셸 + 15탭 레지스트리 + 상단 액션바
  ├─ SystemControlRoom.css
  ├─ controls.jsx                    #   NumberField/ToggleField/SelectField/TextField/Section
  ├─ pathUtil.js                     #   getIn (경로 읽기)
  ├─ tabSchemas.js                   #   7개 핵심 탭의 선언적 스키마
  ├─ PriorityResolver.jsx            #   native HTML5 DnD + 위험 순서 경고
  └─ tabs/
       ├─ SchemaTab.jsx              #   스키마 → 폼 렌더
       ├─ ShipStatsTab.jsx           #   ships.json override 테이블
       ├─ WeaponStatsTab.jsx         #   items.json 무기 override
       ├─ OverrideTab.jsx            #   건물/연구/자원/적 JSON override (제네릭)
       └─ DebugExportTab.jsx         #   Export/Import/Reset/검증 + config 원본
```

### 수정 (비파괴)
```
package.json                  # "test"/"test:watch" 스크립트 + vitest devDep
src/data/ships.json           # 각 함선에 shield/maxShield/armor/armorDurability/maxArmorDurability 추가
src/App.jsx                   # devRoomOpen state + F9/백틱/Esc 단축키 + <SystemControlRoom> 오버레이
src/App.css                   # .app-topbar-devbtn 스타일
src/ui/components/TopStatusBar.jsx  # ⚙ 관제실 버튼 (onOpenDevRoom)
src/ui/screens/BattleScreen.jsx     # 전장 크기 무기 티어 기준 전환 + 유닛 카드 Shield(SH) 행
src/game/scenes/BattleScene.js      # 2단계 핵심 배선 (아래 §4)
```

---

## 4. BattleScene.js 배선 상세 (현재 라인 번호)

| 함수 | 라인 | 변경 내용 |
|------|------|-----------|
| 상단 import | 1–18 | `lookupCounterMultiplier`, `calculateHitChance/calculateDamage/resolveDamagePipeline/getDamageState`, `getGameConfig` 추가. 색상 상수 `SHIELD_BAR_COLOR`, `SHIELD_TEXT_COLOR` 추가 |
| `spawnUnit` | 571 | config override 읽어 Shield 바 생성, 유닛에 `shield/maxShield/armor/armorDurability/maxArmorDurability/defenseReduction` 주입 |
| `resolveCombat` | 1246 | **핵심**. `resolveAttack` → `calculateHitChance` + `resolveDamagePipeline`(Shield→Armor→HP). 측면(±2칸 25%)·크리티컬(15% 1.8×)은 `damageMultiplier`로, 소프트 상성은 `lookupCounterMultiplier`로 보존. 손상 단계 명중/회피 보정 동적 적용. 실드 흡수/HP 피해 분리 표시 |
| `updateShieldBar` | 1482 | Shield 바 폭 갱신 |
| `refillAp` | 1787 | 손상 단계 AP 페널티(중파 −1, 대파 −2) 적용 |
| `syncUnitsToStore` | 1815 | React 카드용으로 `shield/maxShield/armor` 추가 전달 |

**모든 공격 경로가 `resolveCombat` 통과**: 플레이어(라인 ~748), 적 턴(~1942), 아군 자동(~2018).

> 주의: 필살기/스킬 피해는 라인 ~1096의 `resolveAttack`(구 모델)을 그대로 사용 → HP에 직접 적용(실드 관통). 3단계에서 통일 여부 결정.

---

## 5. 핵심 아키텍처 원칙

1. **데이터 주도**: 전투 수치는 코드에 하드코딩하지 않고 `config`에서 읽는다.
   순수 함수는 `config` 인자를 받고, 비-React 코드(BattleScene)는 `getGameConfig()`로 현재 config를 얻는다.
   ```
   defaultGameConfig.js → useGameConfigStore → (UI 편집) / (combatMath가 config 참조)
   ```
2. **순수 함수 분리**: 모든 전투 계산은 `src/core/combatMath/`에 UI 의존 없이 존재 → 단위 테스트 가능.
3. **Priority Resolver**: 계산 단계 on/off 및 순서가 `config.priorityRules`에 있고, combatMath의 `isRuleEnabled()`가 이를 참조한다. 규칙을 끄면 해당 보정이 실제로 제외된다.
4. **비파괴**: 기존 필드/코드 삭제 금지. 미사용 필드는 config 토글로 비활성화(예: `cooldownEnabled:false`).

### 피해 파이프라인 (기획서 18장 = `resolveDamagePipeline`)
```
finalDamage = max(1, atk) × 상성배율 × (측면×크리티컬)
  → Shield Pierce 분할 (기본 Shield 우회)
  → Shield 흡수 (일반 피해)
  → Armor 감소: HP피해 = 피해 × 100/(100+armor)  (armorDurability 0이면 방어력 상실)
  → 방어 태세 감소 (defenseReduction)
  → HP 적용
  → Armor 내구도 감소 = HP적용전 피해 × 20%
  → 격파 판정
```

---

## 6. 다음 작업 (3단계) — 우선순위 순

준비된 자산을 활용해 BattleScene/BattleScreen에 행동을 연결하는 작업이 대부분.

1. **방어 태세 / 경계 태세 행동** — 함수 준비됨(`calculateDefenseReduction`, `calculateOverwatchChance`), 유닛에 `defenseReduction` 필드 있음.
   남은 AP 전부 소모(기획 16·17장), 버튼/액션 메뉴 연결, 경계 반격 트리거 로직.
2. **기함 시스템** — 플레이어 출전 전 1척 지정 + 적 자동 지정, 격파 효과(기획 25장). `calculateFlagshipPower` 준비됨.
3. **후퇴·교섭 기함 기준 전환** — 현재 `BattleScreen.jsx`의 `fleePct`/`payChance` 등은 이동력·공격력 기반 **임시 공식**. `calculateRetreatChance`/`calculateNegotiationChance`로 교체, 후퇴 성공 시 "다음 라운드 시작 이탈" 타이밍, 실패 시 기함 AP 0(기획 23·24장).
4. **필드효과 런타임** — config `fieldEffects` 구조 활용해 지뢰/포탈/잔열/중력장 진입·지속 피해(기획 13장). 기존 `terrain.js`에 일부 유사 효과 있음 — 통합 검토.
5. **투항 → 함선 획득 보상** (기획 22장), **Shield 전투 간 이월**(기획 19장, 로스터에 shield 저장 필요).
6. **무기별 AP·사거리·관통** — `items.json` 무기에 필드 추가(또는 관제실 `overrides.weaponStats` 런타임 적용), 무기 슬롯 선택 UI.
7. **관제실 override 런타임 적용** — buildings/research/resources/enemyScaling 탭의 override를 실제 시스템에 반영(현재는 편집/저장까지만).

---

## 7. 검증 체크리스트

```bash
npm test        # combatMath 29개 통과해야 함
npm run build   # 성공 (Phaser 청크 크기 경고는 기존부터 있던 것 — 무시)
npm run lint    # 아래 "알려진 lint" 외에 신규 에러 없어야 함
npm run dev     # 콘솔 에러 없이 부팅
```

수동 확인:
- F9 → 관제실 → Attack 탭에서 maxHitChance 변경 → Save → 새로고침 시 유지
- Priority Resolver에서 규칙 드래그/토글 → 위험 순서 시 경고 배지
- 전투 진입 → 함선에 시안 Shield 바 표시, 피해 시 Shield 먼저 닳고 HP로 넘어감
- 연구 진행도(무기 티어)에 따라 전장 크기 변화

### 알려진 lint (기존 코드, 이번 작업과 무관 — 건드리지 말 것)
`npm run lint`은 17개 문제 보고(모두 `StrategyMapScreen.jsx`, `BattleScreen.jsx` 기존 부분, `useSaveStore.js`). 이번에 추가한 파일들은 0 에러. 신규 작업 시 이 17개가 늘지 않는지만 확인.

---

## 8. 참고 데이터/문서

- 원본 기획서: 사용자가 제공한 "STAR 프로젝트 전투 시스템 개발 요청서 v1.0" (이 저장소 외부 — 대화 기록 참조). 장(章) 번호는 위 표/주석에서 "기획 N장"으로 인용.
- 기존 게임 데이터: `src/data/*.json` (ships, items, research, enemies, systems …), `src/data/buildings.js`.
- 기존 전투 흐름 문서: `docs/7star_systems_world_design.md`, `docs/game_data_dictionary.md`.

---

## 9. 커밋 안내 (아직 커밋 안 됨)

현재 변경분은 **커밋되지 않은 상태**다. 다른 PC로 옮기려면 먼저 커밋·푸시 필요:

```bash
git add -A
git commit -m "feat: 전투 v1.0 1·2단계 — config 백본 + combatMath + 관제실 + BattleScene 배선"
git push
```

신규 디렉터리: `src/core/combatMath/`, `src/data/defaultGameConfig.js`, `src/state/useGameConfigStore.js`, `src/ui/devroom/`, `docs/COMBAT_SYSTEM_HANDOFF.md`.
