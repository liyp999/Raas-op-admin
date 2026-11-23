import { computed, ref, watch } from 'vue'

export type AccentId = 'azure' | 'teal' | 'violet' | 'coral'

export interface AccentPreset {
  id: AccentId
  label: string
  cn: string
  accent: string
  hover: string
  pressed: string
  soft: string
  rgb: string
}

/** 四套浅色主题主色（橙/红等语义色不参与切换） */
export const ACCENTS: AccentPreset[] = [
  { id: 'azure', label: 'AZURE', cn: '云蓝', accent: '#2f7bff', hover: '#5c98ff', pressed: '#1b5fd9', soft: '#1c5fd6', rgb: '47, 123, 255' },
  { id: 'teal', label: 'TEAL', cn: '冰青', accent: '#0aa6c2', hover: '#3cc0d8', pressed: '#0889a3', soft: '#08758a', rgb: '10, 166, 194' },
  { id: 'violet', label: 'VIOLET', cn: '星紫', accent: '#7c5cff', hover: '#9d85ff', pressed: '#5f3fe0', soft: '#5b3ee6', rgb: '124, 92, 255' },
  { id: 'coral', label: 'CORAL', cn: '珊瑚', accent: '#ff7a59', hover: '#ff9b80', pressed: '#e05e3c', soft: '#c8471f', rgb: '255, 122, 89' }
]

const STORAGE_KEY = 'raas.hud.theme'
const AUTO_STEP = 12000

function readStored(): { id: AccentId; auto: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'auto') return { id: 'azure', auto: true }
    if (raw && ACCENTS.some((a) => a.id === raw)) return { id: raw as AccentId, auto: false }
  } catch {
    /* 忽略隐私模式下的存储异常 */
  }
  return { id: 'azure', auto: false }
}

const stored = readStored()
const currentId = ref<AccentId>(stored.id)
const autoMode = ref(stored.auto)
const accent = computed(() => ACCENTS.find((a) => a.id === currentId.value) ?? ACCENTS[0])

let timer: number | undefined

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, autoMode.value ? 'auto' : currentId.value)
  } catch {
    /* noop */
  }
}

function stopTimer() {
  if (timer !== undefined) {
    window.clearInterval(timer)
    timer = undefined
  }
}

function step() {
  const index = ACCENTS.findIndex((a) => a.id === currentId.value)
  currentId.value = ACCENTS[(index + 1) % ACCENTS.length].id
  applyVars()
  persist()
}

/** 把主色写到 :root 上，所有组件统一用 var(--hud-accent*) 取色 */
function applyVars() {
  if (typeof document === 'undefined') return
  const a = accent.value
  const root = document.documentElement.style
  root.setProperty('--hud-accent', a.accent)
  root.setProperty('--hud-accent-hover', a.hover)
  root.setProperty('--hud-accent-pressed', a.pressed)
  root.setProperty('--hud-accent-soft', a.soft)
  root.setProperty('--hud-accent-rgb', a.rgb)
}

function setAccent(id: AccentId) {
  autoMode.value = false
  stopTimer()
  currentId.value = id
  applyVars()
  persist()
}

function toggleAuto(force?: boolean) {
  autoMode.value = force ?? !autoMode.value
  if (autoMode.value) {
    step()
    timer = window.setInterval(step, AUTO_STEP)
  } else {
    stopTimer()
  }
  persist()
}

applyVars()
watch(autoMode, (on) => {
  stopTimer()
  if (on) {
    step()
    timer = window.setInterval(step, AUTO_STEP)
  }
})

/**
 * 全局唯一的动态主题状态：主色切换 + AUTO 自动轮换（12s/套）。
 * 任何组件调用都会拿到同一份状态。
 */
export function useHudTheme() {
  return {
    ACCENTS,
    accent,
    currentId,
    autoMode,
    setAccent,
    toggleAuto
  }
}
