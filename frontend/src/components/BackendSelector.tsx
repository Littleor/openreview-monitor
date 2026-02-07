import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  ApiMode,
  getApiConfig,
  normalizeApiBase,
  setApiMode,
  setCustomApiBase,
} from '@/lib/apiBase'

const formatBase = (value: string) => {
  if (value.startsWith('/')) {
    return `Same origin (${value})`
  }
  return value
}

export function BackendSelector() {
  const [mode, setMode] = useState<ApiMode>('official')
  const [customInput, setCustomInput] = useState('')
  const [activeBase, setActiveBase] = useState('')
  const [officialBase, setOfficialBase] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  const refresh = () => {
    const config = getApiConfig()
    setMode(config.mode)
    setCustomInput(config.customBase)
    setActiveBase(config.base)
    setOfficialBase(config.officialBase)
  }

  useEffect(() => {
    refresh()
  }, [])

  const normalizedPreview = useMemo(() => normalizeApiBase(customInput), [customInput])

  const handleUseOfficial = () => {
    setApiMode('official')
    refresh()
    setError('')
    toast({
      title: 'Using official backend',
      description: `API base set to ${formatBase(getApiConfig().base)}`,
    })
  }

  const handleUseCustom = () => {
    const normalized = setCustomApiBase(customInput)
    if (!normalized) {
      setError('Enter a valid base URL, for example http://localhost:8000')
      return
    }
    setApiMode('custom')
    setCustomInput(normalized)
    refresh()
    setError('')
    toast({
      title: 'Using custom backend',
      description: `API base set to ${formatBase(normalized)}`,
    })
  }

  return (
    <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold font-display">Backend Server</CardTitle>
        <CardDescription>
          Switch between the official backend and your own deployment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={mode === 'official' ? 'default' : 'outline'}
            className="justify-start"
            onClick={handleUseOfficial}
          >
            Use Official Backend
          </Button>
          <Button
            type="button"
            variant={mode === 'custom' ? 'default' : 'outline'}
            className="justify-start"
            onClick={handleUseCustom}
            disabled={!customInput}
          >
            Use Custom Backend
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_backend">Custom Backend Base URL</Label>
          <Input
            id="custom_backend"
            value={customInput}
            onChange={(event) => {
              setCustomInput(event.target.value)
              setError('')
            }}
            placeholder="https://your-backend.example.com"
          />
          <p className="text-xs text-muted-foreground">
            We will append <span className="font-mono">/api</span> if it is missing.
          </p>
          {normalizedPreview && (
            <p className="text-xs text-muted-foreground">
              Normalized: <span className="font-mono">{normalizedPreview}</span>
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">CORS reminder (important)</p>
          <p>
            Your backend must allow this frontend origin. For local dev, add
            <span className="font-mono"> http://localhost:3000</span> and
            <span className="font-mono"> http://localhost:5173</span> to your CORS allowlist.
          </p>
        </div>

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
