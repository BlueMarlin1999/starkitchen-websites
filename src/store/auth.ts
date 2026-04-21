import { create, type StateCreator, type StoreApi } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppUser, getRoleBaseScopePath, normalizeRole } from '@/lib/access'
import { buildApiUrl } from '@/lib/runtime-config'

const LEGACY_LOCAL_ADMIN_USER_ID = 'admin-marlins'

const parseBooleanFlag = (value?: string) => {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false
  }
  return null
}

const localAdminEnabledByEnv = parseBooleanFlag(process.env.NEXT_PUBLIC_ALLOW_LOCAL_ADMIN_LOGIN)
const isProductionRuntime = process.env.NODE_ENV === 'production'
const LOCAL_ADMIN_ENABLED = localAdminEnabledByEnv ?? !isProductionRuntime
const LOCAL_ADMIN_USERNAME = (process.env.NEXT_PUBLIC_LOCAL_ADMIN_USERNAME || '').trim()
const LOCAL_ADMIN_PASSWORD = (process.env.NEXT_PUBLIC_LOCAL_ADMIN_PASSWORD || '').trim()
const LOCAL_ADMIN_TOKEN = (process.env.NEXT_PUBLIC_LOCAL_ADMIN_TOKEN || '').trim()
const LOCAL_ADMIN_DISPLAY_NAME = (process.env.NEXT_PUBLIC_LOCAL_ADMIN_DISPLAY_NAME || '').trim()
const LOCAL_ADMIN_USER_ID = LOCAL_ADMIN_USERNAME
  ? `admin-${LOCAL_ADMIN_USERNAME.toLowerCase()}`
  : 'admin-local'
const hasLocalAdminCredentials =
  LOCAL_ADMIN_ENABLED &&
  Boolean(LOCAL_ADMIN_USERNAME && LOCAL_ADMIN_PASSWORD && LOCAL_ADMIN_TOKEN)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const parsePersistedUser = (value: unknown): AppUser | null => {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<AppUser>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.employeeId !== 'string' ||
    typeof candidate.role !== 'string' ||
    !isStringArray(candidate.scopePath)
  ) {
    return null
  }

  return {
    ...candidate,
    scopePath: candidate.scopePath,
  } as AppUser
}

const parsePersistedAuthSession = (persistedState: unknown) => {
  const snapshot = (persistedState || {}) as {
    rememberedEmployeeId?: unknown
    user?: unknown
    token?: unknown
    isAuthenticated?: unknown
  }

  const rememberedEmployeeId =
    typeof snapshot.rememberedEmployeeId === 'string' ? snapshot.rememberedEmployeeId : ''
  const user = parsePersistedUser(snapshot.user)
  const token = typeof snapshot.token === 'string' ? snapshot.token : ''
  const isAuthenticated = snapshot.isAuthenticated === true && Boolean(user) && Boolean(token)

  const isLegacyLocalAdminSession = user?.id === LEGACY_LOCAL_ADMIN_USER_ID
  const hasDisabledLocalAdminSession =
    user?.id === LOCAL_ADMIN_USER_ID && token === LOCAL_ADMIN_TOKEN && !hasLocalAdminCredentials
  const shouldInvalidate = isLegacyLocalAdminSession || hasDisabledLocalAdminSession

  if (shouldInvalidate) {
    return { rememberedEmployeeId, user: null, token: '', isAuthenticated: false }
  }

  return { rememberedEmployeeId, user, token, isAuthenticated }
}

export const isLocalAdminEmployeeId = (employeeId: string) =>
  hasLocalAdminCredentials && employeeId.trim().toLowerCase() === LOCAL_ADMIN_USERNAME.toLowerCase()

export const isLocalAdminLoginEnabled = () => hasLocalAdminCredentials

export const isLocalAdminSession = (user: AppUser | null, token: string) =>
  Boolean(
    hasLocalAdminCredentials &&
      user &&
      user.id === LOCAL_ADMIN_USER_ID &&
      token === LOCAL_ADMIN_TOKEN
  )

interface AuthState {
  user: AppUser | null
  token: string
  isAuthenticated: boolean
  rememberedEmployeeId: string
  hasHydrated: boolean
  setUser: (user: AppUser | null) => void
  updateProfile: (profile: { name: string; nickname?: string; avatar?: string }) => void
  login: (
    employeeId: string,
    password: string,
    remember: boolean
  ) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  setRememberedEmployeeId: (id: string) => void
  setHasHydrated: (value: boolean) => void
}

type AuthSetState = StoreApi<AuthState>['setState']
type AuthLoginResult = { success: boolean; message?: string }

const updateRememberedEmployeeId = (set: AuthSetState, employeeId: string, remember: boolean) => {
  set({ rememberedEmployeeId: remember ? employeeId : '' })
}

const buildLocalAdminUser = (employeeId: string): AppUser => {
  const role = 'ceo'
  const scopePath = getRoleBaseScopePath(role, ['global'])
  const displayName = LOCAL_ADMIN_DISPLAY_NAME || employeeId
  return {
    id: LOCAL_ADMIN_USER_ID,
    name: displayName,
    nickname: displayName,
    employeeId,
    role,
    scopePath,
  }
}

const applySuccessfulLogin = (
  set: AuthSetState,
  user: AppUser,
  token: string,
  employeeId: string,
  remember: boolean
) => {
  set({
    user,
    token,
    isAuthenticated: true,
    rememberedEmployeeId: remember ? employeeId : '',
  })
}

const resolveBackendLoginError = (status: number, payload: unknown) => {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string' &&
    payload.message.trim()
  ) {
    return payload.message.trim()
  }
  if (status >= 500) {
    return '认证服务暂不可用，请稍后重试或联系管理员。'
  }
  return '用户名或密码错误，请重试。'
}

const clip = (value: unknown, max = 120) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const resolveClientDeviceHeaders = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return {}

  const userAgent = clip(navigator.userAgent, 280)
  const platform = clip(navigator.platform, 80)
  const userAgentData = (navigator as Navigator & { userAgentData?: { model?: string } }).userAgentData
  const model = clip(userAgentData?.model || platform || 'unknown', 80)

  return {
    ...(userAgent ? { 'x-sk-user-agent': userAgent } : {}),
    ...(platform ? { 'x-sk-client-platform': platform } : {}),
    ...(model ? { 'x-sk-device-model': model } : {}),
  }
}

const loginViaBackend = async (
  employeeId: string,
  password: string
): Promise<AuthLoginResult & { user?: AppUser; token?: string }> => {
  try {
    const response = await fetch(buildApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...resolveClientDeviceHeaders(),
      },
      body: JSON.stringify({
        employeeId,
        password,
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      return {
        success: false,
        message: resolveBackendLoginError(response.status, payload),
      }
    }
    if (!payload?.token || !payload?.user) {
      return {
        success: false,
        message: '认证服务返回无效响应，请联系管理员检查登录服务配置。',
      }
    }
    const normalizedRole = normalizeRole(payload.user.role)
    return {
      success: true,
      token: payload.token,
      user: {
        ...payload.user,
        role: normalizedRole,
        scopePath: getRoleBaseScopePath(normalizedRole, payload.user.scopePath),
      },
    }
  } catch (error) {
    void error
    return {
      success: false,
      message: '当前认证服务不可用，请检查网络或认证服务配置。',
    }
  }
}

const createLoginAction =
  (set: AuthSetState): AuthState['login'] =>
  async (employeeId, password, remember) => {
    const normalizedEmployeeId = employeeId.trim()
    const normalizedPassword = password.trim()
    if (isLocalAdminEmployeeId(normalizedEmployeeId) && normalizedPassword === LOCAL_ADMIN_PASSWORD) {
      applySuccessfulLogin(
        set,
        buildLocalAdminUser(normalizedEmployeeId),
        LOCAL_ADMIN_TOKEN,
        normalizedEmployeeId,
        remember
      )
      return { success: true }
    }
    const result = await loginViaBackend(normalizedEmployeeId, password)
    if (!result.success || !result.user || !result.token) {
      return {
        success: false,
        message: result.message,
      }
    }
    applySuccessfulLogin(set, result.user, result.token, normalizedEmployeeId, remember)
    return { success: true }
  }

const createAuthState: StateCreator<AuthState, [], [], AuthState> = (set) => ({
  user: null,
  token: '',
  isAuthenticated: false,
  rememberedEmployeeId: '',
  hasHydrated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  updateProfile: (profile) =>
    set((state) => {
      if (!state.user) return state
      return {
        user: {
          ...state.user,
          ...profile,
          nickname: profile.nickname?.trim() ? profile.nickname.trim() : undefined,
        },
      }
    }),
  setHasHydrated: (value) => set({ hasHydrated: value }),
  login: createLoginAction(set),
  logout: () => {
    set({ user: null, token: '', isAuthenticated: false })
  },
  setRememberedEmployeeId: (id) => updateRememberedEmployeeId(set, id, true),
})

const authPersistOptions = {
  name: 'auth-storage',
  partialize: (state: AuthState) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    rememberedEmployeeId: state.rememberedEmployeeId,
  }),
  version: 3,
  migrate: (persistedState: unknown) => parsePersistedAuthSession(persistedState),
  merge: (persistedState: unknown, currentState: AuthState) => ({
    ...currentState,
    ...parsePersistedAuthSession(persistedState),
  }),
  onRehydrateStorage: () => (state?: AuthState) => {
    state?.setHasHydrated(true)
  },
}

export const useAuthStore = create<AuthState>()(persist(createAuthState, authPersistOptions))
