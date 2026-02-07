import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  ApiMode,
  buildApiUrl,
  getApiConfig,
  normalizeApiBase,
  setApiMode,
  setCustomApiBase,
} from '@/lib/apiBase'
import { useI18n } from '@/lib/i18n'

type BackendSelectorProps = {
  onChange?: (config: ReturnType<typeof getApiConfig>) => void
}

type HealthCheckResult = { ok: true } | { ok: false; message: string }

export function BackendSelector({ onChange }: BackendSelectorProps) {
  const [mode, setMode] = useState<ApiMode>('official')
  const [selectedMode, setSelectedMode] = useState<ApiMode>('official')
  const [customInput, setCustomInput] = useState('')
  const [activeBase, setActiveBase] = useState('')
  const [officialBase, setOfficialBase] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()
  const { t } = useI18n()

  const formatBase = (value: string) => {
    if (value.startsWith('/')) {
      return t('backend.sameOrigin', { base: value })
    }
    return value
  }

  const refresh = () => {
    const config = getApiConfig()
    setMode(config.mode)
    setSelectedMode(config.mode)
    setCustomInput(config.customBase)
    setActiveBase(config.base)
    setOfficialBase(config.officialBase)
    onChange?.(config)
  }

  useEffect(() => {
    refresh()
  }, [])

  const normalizedPreview = useMemo(() => normalizeApiBase(customInput), [customInput])

  const applyOfficial = () => {
    setApiMode('official')
    refresh()
    setError('')
    toast({
      title: t('backend.toast.officialTitle'),
      description: t('backend.toast.baseSet', { base: formatBase(getApiConfig().base) }),
    })
  }

  const applyCustom = (base: string) => {
    const normalized = setCustomApiBase(base)
    if (!normalized) {
      setError(t('backend.error.invalidBase'))
      return false
    }
    setApiMode('custom')
    setCustomInput(normalized)
    refresh()
    setError('')
    toast({
      title: t('backend.toast.customTitle'),
      description: t('backend.toast.baseSet', { base: formatBase(normalized) }),
    })
    return true
  }

  const checkBackendHealth = async (base: string): Promise<HealthCheckResult> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(buildApiUrl(base, '/health'), {
        signal: controller.signal,
      })
      if (!response.ok) {
        return {
          ok: false,
          message: t('backend.error.healthFailed', { status: response.status }),
        }
      }
      return { ok: true }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, message: t('backend.error.timeout') }
      }
      return { ok: false, message: t('backend.error.unreachable') }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const confirmCustom = async () => {
    const normalized = normalizeApiBase(customInput)
    if (!normalized) {
      setError(t('backend.error.invalidBase'))
      return
    }

    setIsChecking(true)
    setError('')
    const result = await checkBackendHealth(normalized)
    setIsChecking(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    applyCustom(normalized)
  }

  const handleModeChange = (value: string) => {
    const nextMode = value as ApiMode
    setSelectedMode(nextMode)

    if (nextMode === 'official') {
      applyOfficial()
      return
    }
    setError('')
  }

  return (
    <Card className="border border-white/60 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold font-display">{t('backend.title')}</CardTitle>
        <CardDescription>
          {t('backend.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedMode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="w-full justify-between bg-white/70">
            <TabsTrigger value="official" className="flex-1">
              {t('backend.tab.official')}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              {t('backend.tab.custom')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedMode === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom_backend">{t('backend.custom.label')}</Label>
            <Input
              id="custom_backend"
              value={customInput}
              onChange={(event) => {
                setCustomInput(event.target.value)
                setError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  confirmCustom()
                }
              }}
              placeholder={t('backend.custom.placeholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('backend.custom.help')}
            </p>
            {normalizedPreview && (
              <p className="text-xs text-muted-foreground">
                {t('backend.custom.normalized.prefix')}{' '}
                <span className="font-mono">{normalizedPreview}</span>
              </p>
            )}
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900">
              {t('backend.custom.warning')}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              type="button"
              className="mt-2"
              onClick={confirmCustom}
              disabled={isChecking}
            >
              {isChecking ? t('common.checking') : t('common.confirm')}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {t('backend.currentBase.prefix')}{' '}
          <span className="font-mono">{formatBase(activeBase)}</span>
          {mode === 'official' && officialBase && (
            <span className="block">
              {t('backend.officialBase.prefix')}{' '}
              <span className="font-mono">{formatBase(officialBase)}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
