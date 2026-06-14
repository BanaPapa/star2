# 7★ STAR — UI 디자인 시스템: 홀로그래픽 글래스 UI (Holo-Glass UI)

> 동반 문서: `ui_mockups.html`(시각 목업), `src/index.css`(토큰·유틸리티 클래스 구현)
>
> 이 문서는 메인맵/전투맵/함대/무기정보 화면에 적용한 **"홀로그래픽 글래스 UI(Holo-Glass UI)"** 스타일의 정의, 핵심 토큰, 재사용 클래스, 적용 패턴을 정리한 디자인 레퍼런스입니다. 새 화면이나 컴포넌트를 만들 때 이 문서를 기준으로 동일한 톤을 유지합니다.

---

## 1. 스타일 정의

전문 용어로는 **글래스모피즘(Glassmorphism)** 기반의 **홀로그래픽 SF HUD(Holographic Sci-Fi HUD)** 스타일입니다.

- **글래스모피즘**: 반투명 배경 + `backdrop-filter: blur()` + 얇은 테두리로 "유리판이 떠 있는" 느낌.
- **홀로그래픽 SF HUD**: 시안/블루 계열 네온 글로우, 코너 브래킷(모서리 꺾쇠), 다이아몬드 불릿, 모노스페이스 폰트 등 SF 영화·게임 인터페이스(트론, 아이언맨 HUD 류)에서 흔한 요소.

두 가지를 결합해 "반투명하고 반짝거리는" 톤을 구현합니다.

---

## 2. 디자인 토큰 (`src/index.css` `:root`)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--bg-0` | `#060818` | 전체 배경(가장 어두운 톤) |
| `--panel` | `rgba(18, 26, 58, 0.72)` | 글래스 패널 기본 배경 |
| `--panel-2` | `rgba(10, 16, 42, 0.85)` | 더 진한 패널(모달 등) |
| `--cyan` | `#3ad6c4` | 주 강조색 — 글로우·테두리·진행바 |
| `--blue` | `#4fb8ff` | 보조 강조색 — 그라디언트 짝 |
| `--gold` | `#ffd166` | 주의/달성/자원 강조색 |
| `--amber` | `#ff7a3c` | 경고·보조 그라디언트 |
| `--red` | `#e23b4e` | 위험/적군/실패 |
| `--text` | `#cdd8f4` | 기본 텍스트 |
| `--dim` | `#6b7aa8` | 보조/비활성 텍스트 |
| `--line` | `rgba(79, 184, 255, 0.22)` | 기본 테두리 |
| `--line-strong` | `rgba(79, 184, 255, 0.5)` | 강조 테두리(상단바, 사이드패널 경계 등) |
| `--kr` | `'IBM Plex Sans KR', system-ui, sans-serif` | 본문 한글 폰트 |
| `--disp` | `'Chakra Petch', var(--kr), sans-serif` | 헤딩/버튼용 디스플레이 폰트(영문 SF 느낌) |
| `--mono` | `'Share Tech Mono', ui-monospace, Consolas, monospace` | 수치·라벨용 모노스페이스 |

---

## 3. 핵심 유틸리티 클래스 (`src/index.css`)

기존 컴포넌트 클래스(`fleet-card`, `map-info` 등)에 **추가(additive)** 로 붙여 쓰는 클래스들입니다. 컴포넌트 CSS는 중복되는 `background`/`border`/`border-radius`/`backdrop-filter`를 제거하고 이 클래스에 위임합니다.

### `.holo-panel`
가장 기본이 되는 글래스 패널.
- 반투명 그라디언트 배경 + `var(--panel)`
- `backdrop-filter: blur(10px)`
- `1px solid var(--line)` 테두리, `border-radius: 10px`
- `::after`로 시안색 **코너 브래킷**(모서리 꺾쇠 4개)을 그려 SF 패널 느낌 부여

**변형:**
- `.holo-panel--tight` — 코너 브래킷을 작게(8px) — 작은 카드/행에 사용
- `.holo-panel--gold` — 테두리·브래킷을 골드 톤으로(전직 완료, 강조 카드 등)

### `.holo-h`
섹션 헤더용. 시안 다이아몬드(◆) 불릿 + 자간 넓은 대문자 모노 라벨.

### `.holo-badge`
원형/사각 아이콘 뱃지 컨테이너. 시안 테두리 + radial 글로우 배경 + 외부/내부 글로우(box-shadow).
- `.holo-badge--circle` — 원형
- `.holo-badge--gold` — 골드 톤
- `.holo-badge--dim` — 글로우 없이 은은한 테두리만(보조 아이콘용)

### `.holo-bar` / `.holo-bar-fill`
글로우 진행바. 트랙(`.holo-bar`)은 어두운 반투명 배경, 채움(`.holo-bar-fill`)은 시안→블루 그라디언트 + 글로우.
- `.holo-bar-fill--gold` — 골드 그라디언트(예: XP)
- `.holo-bar-fill--red` — 앰버→레드 그라디언트(예: 위험 수치)
- 색상이 동적으로 바뀌는 바(HP/AP/TP 등)는 인라인 `style`로 `background`+`boxShadow`를 함께 지정해 글로우 색을 맞춤

### `.holo-pill`
캡슐형 태그/칩. 기본은 외곽선 스타일.
- `.holo-pill--cyan` / `.holo-pill--gold` — 배경이 채워진 강조 칩(완료/배정 표시 등)
- `.holo-pill--outline-gold` — 골드 외곽선 칩

---

## 4. 버튼: 코너컷(Corner-Cut) 글로우 버튼

패널과 별개로, **클릭 가능한 액션 버튼**은 `clip-path: polygon(...)`으로 모서리를 비스듬히 잘라낸 "코너컷" 형태를 사용합니다(둥근 모서리 대신).

```css
.act {
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  transition: 0.18s;
}
.act:hover:not(:disabled) {
  color: var(--bg-0);
  background: linear-gradient(135deg, var(--cyan), var(--blue));
  box-shadow: 0 0 18px rgba(58, 214, 196, 0.5);
  border-color: transparent;
}
```

- 평상시: 옅은 테두리 + 투명 배경
- 호버 시: 시안→블루(또는 골드 계열) 그라디언트로 채워지며 강한 글로우(`box-shadow`)
- 비활성: `opacity: 0.35`

적용 예: `.act`(맵 액션바), `.map-action-btn`, `.fleet-promote-btn`, `.bnav-action-btn`, `.btl-btn`, `.app-topbar-burger`

---

## 5. 적용 화면 및 패턴

| 화면/영역 | 적용 요소 |
|-----------|-----------|
| **함대(Fleet)** | 함선 카드(`fleet-card`)·에이스 카드(`hub-card`) → `holo-panel`(전직/배정 완료 시 `--gold`), 함선 아이콘 → `holo-badge`, XP 바 → `holo-bar`, 전직/영입 태그 → `holo-pill`, 스탯은 `fleet-stat-grid`(2열 카드형, 기존 표 대체) |
| **무기/모듈 정보** | `EquipSlot` → `holo-panel holo-panel--tight`, 장착 아이템 아이콘 → `holo-badge` |
| **메인맵(StrategyMap)** | 정보 사이드바 글래스 배경, 액션바·뷰탭·툴팁 → `holo-panel`(+`--tight`), 함대/타겟 아이콘 → `holo-badge--circle`, 진입/개발 버튼 → 코너컷 글로우 버튼, 상세정보 헤더 → `holo-h` |
| **전투맵(Battle)** | 좌/우 사이드패널 글래스 배경(`box-shadow`로 안쪽 발광), 유닛 카드 → `holo-panel--tight`, HP/AP/TP 바 → 글로우 색상 인라인 적용, 지형 범례 행 → `holo-panel--tight` + 글리프 아이콘 `holo-badge--dim`, 액션 버튼·모달 버튼 → 코너컷 글로우, 협상 옵션 카드 → `holo-panel--tight` |
| **상단바/자원 HUD** | 상단바 전체 글래스 배경 + 하단 시안 글로우 라인, 자원/턴/함대 표시 → 캡슐형 칩(`resource-hud-item`, `app-topbar-stat`) + 값에 텍스트 글로우, 햄버거 버튼 → 코너컷, 내비 드로어 → `holo-panel` |

---

## 6. 새 화면에 적용할 때 체크리스트

1. 패널이 될 컨테이너에 `holo-panel`(또는 `--tight`/`--gold`) 클래스를 추가하고, 해당 CSS 규칙에서 `background`/`border`/`border-radius`/`backdrop-filter`를 제거한다.
2. 아이콘 컨테이너는 `holo-badge`(원형이면 `--circle`, 보조 아이콘이면 `--dim`)로 감싼다.
3. 진행바는 트랙에 `holo-bar`, 채움에 `holo-bar-fill`(고정 색이면 `--gold`/`--red`, 동적 색이면 인라인 `background`+`boxShadow`로 글로우 매칭).
4. 상태 태그/배지는 `holo-pill`(+ 색상 변형).
5. 클릭 버튼은 둥근 모서리 대신 `clip-path` 코너컷 + 호버 시 그라디언트/글로우 패턴을 따른다.
6. 섹션 제목은 `holo-h`로 다이아몬드 불릿 + 모노 라벨 스타일을 맞춘다.
7. 색상은 항상 `:root` 토큰(`--cyan`, `--blue`, `--gold`, `--red` 등)을 사용해 전체 화면과 일관성을 유지한다.
