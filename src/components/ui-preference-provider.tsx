'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { ContentLanguageBridge } from '@/components/content-language-bridge'

export type UILanguage = 'zh' | 'en'
export type UIThemeMode = 'light' | 'dark' | 'system'
export type UIThemeResolved = 'light' | 'dark'

interface UIPreferenceContextValue {
  language: UILanguage
  themeMode: UIThemeMode
  resolvedTheme: UIThemeResolved
  ready: boolean
  setLanguage: (value: UILanguage) => void
  toggleLanguage: () => void
  setThemeMode: (value: UIThemeMode) => void
  text: (zh: string, en: string) => string
}

const LANGUAGE_STORAGE_KEY = 'sk-ui-language'
const THEME_MODE_STORAGE_KEY = 'sk-ui-theme-mode'

const normalizeLanguage = (value: string | null): UILanguage => (value === 'en' ? 'en' : 'zh')

const normalizeThemeMode = (value: string | null): UIThemeMode => {
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

const getSystemTheme = (): UIThemeResolved => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const resolveTheme = (mode: UIThemeMode): UIThemeResolved => (mode === 'system' ? getSystemTheme() : mode)

const applyPreferenceToDocument = (
  language: UILanguage,
  themeMode: UIThemeMode,
  resolvedTheme: UIThemeResolved
) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.lang = language === 'en' ? 'en' : 'zh-CN'
  root.dataset.uiLanguage = language
  root.dataset.themeMode = themeMode
  root.dataset.themeResolved = resolvedTheme
  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.style.colorScheme = resolvedTheme
}

const UIPreferenceContext = createContext<UIPreferenceContextValue | null>(null)

const useUIPreferenceStateModel = () => {
  const [language, setLanguageState] = useState<UILanguage>('zh')
  const [themeMode, setThemeModeState] = useState<UIThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<UIThemeResolved>('dark')
  const [ready, setReady] = useState(false)

  const setLanguage = useCallback((value: UILanguage) => {
    setLanguageState(value)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === 'zh' ? 'en' : 'zh'))
  }, [])

  const setThemeMode = useCallback((value: UIThemeMode) => {
    setThemeModeState(value)
  }, [])

  const text = useCallback(
    (zh: string, en: string) => (language === 'en' ? en : zh),
    [language]
  )

  return {
    language,
    themeMode,
    resolvedTheme,
    ready,
    setReady,
    setLanguageState,
    setThemeModeState,
    setResolvedTheme,
    setLanguage,
    toggleLanguage,
    setThemeMode,
    text,
  }
}

const useUIPreferenceBootstrap = (
  setLanguageState: (value: UILanguage) => void,
  setThemeModeState: (value: UIThemeMode) => void,
  setResolvedTheme: (value: UIThemeResolved) => void,
  setReady: (value: boolean) => void
) => {
  useEffect(() => {
    const nextLanguage = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))
    const nextThemeMode = normalizeThemeMode(localStorage.getItem(THEME_MODE_STORAGE_KEY))
    const nextResolvedTheme = resolveTheme(nextThemeMode)

    setLanguageState(nextLanguage)
    setThemeModeState(nextThemeMode)
    setResolvedTheme(nextResolvedTheme)
    applyPreferenceToDocument(nextLanguage, nextThemeMode, nextResolvedTheme)
    setReady(true)
  }, [setLanguageState, setReady, setResolvedTheme, setThemeModeState])
}

const useUIPreferencePersistence = (
  language: UILanguage,
  ready: boolean,
  themeMode: UIThemeMode,
  setResolvedTheme: (value: UIThemeResolved) => void
) => {
  useEffect(() => {
    if (!ready) return
    const nextResolvedTheme = resolveTheme(themeMode)
    setResolvedTheme(nextResolvedTheme)
    applyPreferenceToDocument(language, themeMode, nextResolvedTheme)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode)
  }, [language, ready, setResolvedTheme, themeMode])
}

const useUIPreferenceSystemThemeListener = (
  language: UILanguage,
  themeMode: UIThemeMode,
  setResolvedTheme: (value: UIThemeResolved) => void
) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia || themeMode !== 'system') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const nextResolvedTheme = getSystemTheme()
      setResolvedTheme(nextResolvedTheme)
      applyPreferenceToDocument(language, themeMode, nextResolvedTheme)
    }
    mediaQuery.addEventListener('change', handler)
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [language, setResolvedTheme, themeMode])
}

export function UIPreferenceProvider({ children }: { children: ReactNode }) {
  const {
    language,
    themeMode,
    resolvedTheme,
    ready,
    setReady,
    setLanguageState,
    setThemeModeState,
    setResolvedTheme,
    setLanguage,
    toggleLanguage,
    setThemeMode,
    text,
  } = useUIPreferenceStateModel()

  useUIPreferenceBootstrap(setLanguageState, setThemeModeState, setResolvedTheme, setReady)
  useUIPreferencePersistence(language, ready, themeMode, setResolvedTheme)
  useUIPreferenceSystemThemeListener(language, themeMode, setResolvedTheme)

  const contextValue = useMemo<UIPreferenceContextValue>(
    () => ({
      language,
      themeMode,
      resolvedTheme,
      ready,
      setLanguage,
      toggleLanguage,
      setThemeMode,
      text,
    }),
    [language, ready, resolvedTheme, setLanguage, setThemeMode, text, themeMode, toggleLanguage]
  )

  return (
    <UIPreferenceContext.Provider value={contextValue}>
      <ContentLanguageBridge language={language} ready={ready} />
      {children}
    </UIPreferenceContext.Provider>
  )
}

export const useUIPreferences = () => {
  const context = useContext(UIPreferenceContext)
  if (!context) {
    throw new Error('useUIPreferences must be used inside UIPreferenceProvider')
  }
  return context
}
