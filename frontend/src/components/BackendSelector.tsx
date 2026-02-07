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

type BackendSelectorProps = {
  onChange?: (config: ReturnType<typeof getApiConfig>) => void
}

type HealthCheckResult = { ok: true } | { ok: false; message: string }

const formatBase = (value: string) => {
  if (value.startsWith('/')) {
    return `Same origin (${value})`
  }
  return value
}

export function BackendSelector({ onChange }: BackendSelectorProps) {
  const [mode, setMode] = useState<ApiMode>('official')
  const [selectedMode, setSelectedMode] = useState<ApiMode>('official')
  const [customInput, setCustomInput] = useState('')
  const [activeBase, setActiveBase] = useState('')
  const [officialBase, setOfficialBase] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

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
      title: 'Using official backend',
      description: `API base set to ${formatBase(getApiConfig().base)}`,
    })
  }

  const applyCustom = (base: string) => {
    const normalized = setCustomApiBase(base)
    if (!normalized) {
      setError('Enter a valid base URL, for example http://localhost:8000')
      return false
    }
    setApiMode('custom')
    setCustomInput(normalized)
    refresh()
    setError('')
    toast({
      title: 'Using custom backend',
      description: `API base set to ${formatBase(normalized)}`,
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
        return { ok: false, message: `Health check failed (HTTP ${response.status}).` }
      }
      return { ok: true }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { ok: false, message: 'Health check timed out. Please verify the backend address.' }
      }
      return { ok: false, message: 'Unable to reach the backend. Please verify the address.' }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const confirmCustom = async () => {
    const normalized = normalizeApiBase(customInput)
    if (!normalized) {
      setError('Enter a valid base URL, for example http://localhost:8000')
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
        <CardTitle className="text-xl font-semibold font-display">Backend Settings</CardTitle>
        <CardDescription>
          Choose the backend server for API requests. The monitor works with either option.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedMode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="w-full justify-between bg-white/70">
            <TabsTrigger value="official" className="flex-1">
              Official
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedMode === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom_backend">Custom Backend Base URL</Label>
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
              placeholder="https://your-backend.example.com"
            />
            <p className="text-xs text-muted-foreground">
              We will append <span className="font-mono">/api</span> if it is missing. Click confirm
              to apply.
            </p>
            {normalizedPreview && (
              <p className="text-xs text-muted-foreground">
                Normalized: <span className="font-mono">{normalizedPreview}</span>
              </p>
            )}
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900">
              Adding an unknown backend may expose your credentials. We recommend self-hosting or
              using the official backend. Any backend other than your own carries leakage risk.
              Use at your own risk.
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              type="button"
              className="mt-2"
              onClick={confirmCustom}
              disabled={isChecking}
            >
              {isChecking ? 'Checking...' : 'Confirm'}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Current API base: <span className="font-mono">{formatBase(activeBase)}</span>
          {mode === 'official' && officialBase && (
            <span className="block">Official backend: {formatBase(officialBase)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
