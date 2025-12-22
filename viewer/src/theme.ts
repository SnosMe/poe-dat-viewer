import { computed, readonly, ref, watch } from 'vue'

export type ThemeName = 'light' | 'dark'
export type ThemePreference = ThemeName | 'system'

const isClient = typeof window !== 'undefined'
const prefersDark = isClient ? window.matchMedia('(prefers-color-scheme: dark)') : null
const storageKey = 'poe-dat-viewer:theme'

const systemTheme = ref<ThemeName>((prefersDark?.matches ?? false) ? 'dark' : 'light')
const stored = (isClient ? window.localStorage.getItem(storageKey) : null) as ThemeName | null

const preferenceRef = ref<ThemePreference>(stored ?? 'system')
const effectiveTheme = ref<ThemeName>(
  preferenceRef.value === 'system' ? systemTheme.value : preferenceRef.value
)

const applyTheme = () => {
  if (!isClient) return
  document.documentElement.dataset.theme = effectiveTheme.value
  document.documentElement.style.colorScheme = effectiveTheme.value
}

function setPreference (pref: ThemePreference) {
  preferenceRef.value = pref
  if (!isClient) return
  if (pref === 'system') {
    window.localStorage.removeItem(storageKey)
  } else {
    window.localStorage.setItem(storageKey, pref)
  }
  refreshEffectiveTheme()
}

function refreshEffectiveTheme () {
  const pref = preferenceRef.value
  effectiveTheme.value = (pref === 'system') ? systemTheme.value : pref
}

if (prefersDark) {
  const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
    systemTheme.value = event.matches ? 'dark' : 'light'
    if (preferenceRef.value === 'system') {
      refreshEffectiveTheme()
    }
  }

  if (typeof prefersDark.addEventListener === 'function') {
    prefersDark.addEventListener('change', handleChange)
  } else if (typeof prefersDark.addListener === 'function') {
    prefersDark.addListener(handleChange)
  }
}

watch(preferenceRef, () => {
  refreshEffectiveTheme()
}, { immediate: true })

watch(effectiveTheme, applyTheme, { immediate: true })

export const themePreference = readonly(preferenceRef)
export const theme = readonly(effectiveTheme)
export const isDarkTheme = computed(() => effectiveTheme.value === 'dark')

const preferenceOrder: ThemePreference[] = ['system', 'light', 'dark']

function cyclePreference () {
  const currentIdx = preferenceOrder.indexOf(preferenceRef.value)
  setPreference(preferenceOrder[(currentIdx + 1) % preferenceOrder.length])
}

function setTheme (pref: ThemePreference) {
  setPreference(pref)
}

export function useTheme () {
  return {
    theme,
    isDarkTheme,
    preference: themePreference,
    setTheme,
    cyclePreference
  }
}
