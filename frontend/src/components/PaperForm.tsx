import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api, PaperPreview } from '@/lib/api'
import { Loader2, ArrowLeft, Check, Lock } from 'lucide-react'

type Step = 'input' | 'preview' | 'success'

export function PaperForm() {
  const [step, setStep] = useState<Step>('input')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PaperPreview | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)

  const [formData, setFormData] = useState({
    openreview_url: '',
    openreview_username: '',
    openreview_password: '',
    email: '',
    notify_on_review: true,
    notify_on_decision: true,
  })

  const { toast } = useToast()

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await api.previewPaper({
      openreview_url: formData.openreview_url,
      openreview_username: formData.openreview_username || undefined,
      openreview_password: formData.openreview_password || undefined,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.data) {
      setPreview(result.data)
      setStep('preview')
    }

    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true)

    const result = await api.addPaper({
      openreview_id: preview.openreview_id,
      title: preview.title || preview.openreview_id,
      venue: preview.venue || 'Unknown',
      email: formData.email,
      openreview_username: formData.openreview_username || undefined,
      openreview_password: formData.openreview_password || undefined,
      notify_on_review: formData.notify_on_review,
      notify_on_decision: formData.notify_on_decision,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setStep('success')
    }

    setLoading(false)
  }

  const handleReset = () => {
    setStep('input')
    setPreview(null)
    setFormData({
      openreview_url: '',
      openreview_username: '',
      openreview_password: '',
      email: '',
      notify_on_review: true,
      notify_on_decision: true,
    })
  }

  // Step 1: Input form
  if (step === 'input') {
    return (
      <Card className="w-full max-w-xl border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold font-display">Monitor a Paper</CardTitle>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Step 1 of 3
            </span>
          </div>
          <CardDescription>
            Paste the OpenReview URL or paper ID. Credentials are optional but required for some venues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openreview_url">OpenReview URL or Paper ID</Label>
              <Input
                id="openreview_url"
                type="text"
                placeholder="https://openreview.net/forum?id=xxx"
                value={formData.openreview_url}
                onChange={(e) =>
                  setFormData({ ...formData, openreview_url: e.target.value })
                }
                required
              />
            </div>

            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span>OpenReview credentials</span>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Optional
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Required for private papers or restricted venues. We only use credentials to fetch
                paper status. Use at your own risk. For stronger security, self-host the backend.
              </p>
              {showCredentials && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="openreview_username">OpenReview Username</Label>
                    <Input
                      id="openreview_username"
                      type="text"
                      placeholder="your@email.com"
                      value={formData.openreview_username}
                      onChange={(e) =>
                        setFormData({ ...formData, openreview_username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openreview_password">OpenReview Password</Label>
                    <Input
                      id="openreview_password"
                      type="password"
                      placeholder="Your OpenReview password"
                      value={formData.openreview_password}
                      onChange={(e) =>
                        setFormData({ ...formData, openreview_password: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setShowCredentials((current) => !current)}
              >
                {showCredentials ? 'Hide credentials' : 'Add credentials'}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Paper Info
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Step 2: Preview and confirm
  if (step === 'preview' && preview) {
    return (
      <Card className="w-full max-w-xl border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStep('input')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="font-display">Confirm Paper Details</CardTitle>
                <CardDescription>
                  Please verify the information below
                </CardDescription>
              </div>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Step 2 of 3
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paper Info */}
          <div className="rounded-xl border border-white/60 bg-white/70 p-4 shadow-sm space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Paper Title</Label>
              <p className="font-medium">{preview.title || 'Unknown Title'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Conference / Venue</Label>
              <p className="font-medium">{preview.venue || 'Unknown Venue'}</p>
            </div>
            {preview.authors && preview.authors.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Authors</Label>
                <p className="text-sm">{preview.authors.join(', ')}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Paper ID</Label>
              <p className="text-sm font-mono">{preview.openreview_id}</p>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Notification Preferences</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_review"
                  checked={formData.notify_on_review}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_on_review: checked as boolean })
                  }
                />
                <Label htmlFor="notify_on_review" className="font-normal">
                  Notify me when reviews are available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_decision"
                  checked={formData.notify_on_decision}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_on_decision: checked as boolean })
                  }
                />
                <Label htmlFor="notify_on_decision" className="font-normal">
                  Notify me when the final decision is announced
                </Label>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={loading || !formData.email}
            onClick={handleConfirm}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Subscribe
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Step 3: Success
  return (
    <Card className="w-full max-w-xl border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold font-display">Subscription active</h3>
          <p className="text-muted-foreground">
            You will receive email notifications at <strong>{formData.email}</strong> when there are updates for:
          </p>
          <p className="font-medium">{preview?.title || preview?.openreview_id}</p>
          <Button onClick={handleReset} variant="outline">
            Monitor Another Paper
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
