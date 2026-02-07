import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [selectedMode, setSelectedMode] = useState<ApiMode>('official')
  const [customInput, setCustomInput] = useState('')
  const [activeBase, setActiveBase] = useState('')
  const [officialBase, setOfficialBase] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()

  const refresh = () => {
    const config = getApiConfig()
    setMode(config.mode)
    setSelectedMode(config.mode)
    setCustomInput(config.customBase)
    setActiveBase(config.base)
    setOfficialBase(config.officialBase)
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

  const applyCustom = () => {
    const normalized = setCustomApiBase(customInput)
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

  const handleModeChange = (value: string) => {
    const nextMode = value as ApiMode
    setSelectedMode(nextMode)

    if (nextMode === 'official') {
      applyOfficial()
      return
    }

    if (normalizeApiBase(customInput)) {
      applyCustom()
    } else {
      setError('Enter a valid base URL to activate the custom backend.')
    }
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
              onBlur={() => {
                if (selectedMode === 'custom') {
                  applyCustom()
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyCustom()
                }
              }}
              placeholder="https://your-backend.example.com"
            />
            <p className="text-xs text-muted-foreground">
              We will append <span className="font-mono">/api</span> if it is missing. Press Enter or
              move focus to apply.
            </p>
            {normalizedPreview && (
              <p className="text-xs text-muted-foreground">
                Normalized: <span className="font-mono">{normalizedPreview}</span>
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

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
