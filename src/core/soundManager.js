// 사운드 매니저 싱글턴 — BGM/SFX 재생. 파일이 없으면 조용히 실패한다(MOD-13).
// 오디오 파일 위치: /public/assets/bgm_{key}.mp3, /public/assets/sfx_{key}.mp3
// useSettingsStore의 soundVolume(0~100)을 setVolume으로 연동한다.

const BGM_TRACKS = ['title', 'map', 'battle', 'boss']
const SFX_TRACKS = ['click', 'confirm', 'victory', 'finisher']

// 트랙이 여러 개인 BGM은 재생 시마다 무작위로 하나를 고른다 (예: 전투 BGM 2종 랜덤 재생).
const BGM_VARIANTS = {
  title: ['title_1'],
  battle: ['battle_1', 'battle_2'],
}

class SoundManager {
  constructor() {
    this._bgm = null     // HTMLAudioElement — 현재 재생 중인 BGM
    this._bgmKey = null  // 중복 재생 방지
    this._volume = 0.7
  }

  setVolume(pct) {
    this._volume = Math.max(0, Math.min(1, pct / 100))
    if (this._bgm) this._bgm.volume = this._volume
  }

  playBgm(key) {
    const variants = BGM_VARIANTS[key] ?? [key]
    const file = variants[Math.floor(Math.random() * variants.length)]
    if (this._bgmKey === file) return // 이미 재생 중
    this.stopBgm()
    const audio = new Audio(`/assets/bgm_${file}.mp3`)
    audio.loop = true
    audio.volume = this._volume
    // 파일이 없으면 재생 실패 — 조용히 무시
    audio.play().catch(() => {})
    this._bgm = audio
    this._bgmKey = file
  }

  stopBgm() {
    if (!this._bgm) return
    this._bgm.pause()
    this._bgm.currentTime = 0
    this._bgm = null
    this._bgmKey = null
  }

  playSfx(key) {
    const audio = new Audio(`/assets/sfx_${key}.mp3`)
    audio.volume = this._volume * 0.8
    audio.play().catch(() => {})
  }
}

export const soundManager = new SoundManager()
export { BGM_TRACKS, SFX_TRACKS }
