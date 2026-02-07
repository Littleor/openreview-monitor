export type ApiMode = 'official' | 'custom'

const STORAGE_KEYS = {
  mode: 'orm_api_mode',
  customBase: 'orm_api_custom_base',
  lastBase: 'orm_api_last_base',
}

const OFFICIAL_BASE_RAW =
  import.meta.env.VITE_OFFICIAL_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api'

const FALLBACK_BASE = '/api'

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const withApiSuffix = (value: string) => (value.endsWith('/api') ? value : `${value}/api`)

const normalizeProtocol = (value: string) => {
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value

  const isLocal = value.startsWith('localhost') || value.startsWith('127.0.0.1')
  const protocol = isLocal ? 'http://' : 'https://'
  return `${protocol}${value}`
}

export const normalizeApiBase = (input: string): string | null => {
  if (!input) return null
  let value = input.trim()
  if (!value) return null

  value = normalizeProtocol(value)
  value = stripTrailingSlash(value)

  if (!value) return null
  return withApiSuffix(value)
}

const getStored = (key: string) => (isBrowser ? localStorage.getItem(key) : null)

const persistBase = (base: string) => {
  if (!isBrowser) return
  const lastBase = localStorage.getItem(STORAGE_KEYS.lastBase)
  if (lastBase && lastBase !== base) {
    localStorage.removeItem('admin_token')
  }
  localStorage.setItem(STORAGE_KEYS.lastBase, base)
}

export const getApiConfig = () => {
  const officialBase = normalizeApiBase(OFFICIAL_BASE_RAW) || FALLBACK_BASE
  const storedMode = getStored(STORAGE_KEYS.mode)
  const customBase = getStored(STORAGE_KEYS.customBase)

  const mode: ApiMode = storedMode === 'custom' && customBase ? 'custom' : 'official'
  const base = mode === 'custom' ? customBase! : officialBase

  return {
    mode,
    base,
    officialBase,
    customBase: customBase || '',
  }
}

export const getApiBase = () => getApiConfig().base

export const setApiMode = (mode: ApiMode) => {
  if (!isBrowser) return
  localStorage.setItem(STORAGE_KEYS.mode, mode)
  persistBase(getApiBase())
}

export const setCustomApiBase = (input: string) => {
  if (!isBrowser) return null
  const normalized = normalizeApiBase(input)
  if (!normalized) return null
  localStorage.setItem(STORAGE_KEYS.customBase, normalized)
  persistBase(getApiBase())
  return normalized
}

export const buildApiUrl = (base: string, endpoint: string) => {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${normalizedBase}${normalizedEndpoint}`
}
