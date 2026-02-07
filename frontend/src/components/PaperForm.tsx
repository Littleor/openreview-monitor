import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api, PaperPreview } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Loader2, ArrowLeft, Check, Lock } from 'lucide-react'

type Step = 'input' | 'preview' | 'success'

export function PaperForm() {
  const [step, setStep] = useState<Step>('input')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PaperPreview | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [senderEmail, setSenderEmail] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationSending, setVerificationSending] = useState(false)
  const [verificationExpiresIn, setVerificationExpiresIn] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    openreview_url: '',
    openreview_username: '',
    openreview_password: '',
    email: '',
    notify_on_review: true,
    notify_on_review_modified: true,
    notify_on_decision: true,
  })

  const { toast } = useToast()
  const { t } = useI18n()

  useEffect(() => {
    let active = true
    api.getPublicEmailConfig().then((result) => {
      if (!active) return
      const email = result.data?.from_email?.trim()
      setSenderEmail(email ? email : null)
    })
    return () => {
      active = false
    }
  }, [])

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
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.data) {
      setPreview(result.data)
      setStep('preview')
      setVerificationSent(false)
      setVerificationCode('')
      setVerificationExpiresIn(null)
    }

    setLoading(false)
  }

  const handleSendVerification = async () => {
    if (!preview || !formData.email) return
    setVerificationSending(true)

    const result = await api.requestEmailVerification({
      email: formData.email,
      openreview_id: preview.openreview_id,
    })

    if (result.error) {
      toast({
        title: t('paperForm.toast.verificationFailed'),
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.data) {
      setVerificationSent(true)
      setVerificationExpiresIn(result.data.expires_in_minutes)
      toast({
        title: t('paperForm.toast.verificationSent'),
        description: t('paperForm.toast.checkEmail', { email: formData.email }),
      })
    }

    setVerificationSending(false)
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true)

    const result = await api.addPaper({
      openreview_id: preview.openreview_id,
      title: preview.title || preview.openreview_id,
      venue: preview.venue || 'Unknown',
      email: formData.email,
      verification_code: verificationCode.trim(),
      openreview_username: formData.openreview_username || undefined,
      openreview_password: formData.openreview_password || undefined,
      notify_on_review: formData.notify_on_review,
      notify_on_review_modified: formData.notify_on_review_modified,
      notify_on_decision: formData.notify_on_decision,
    })

    if (result.error) {
      toast({
        title: t('common.error'),
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
      notify_on_review_modified: true,
      notify_on_decision: true,
    })
    setVerificationCode('')
    setVerificationSent(false)
    setVerificationExpiresIn(null)
  }

  // Step 1: Input form
  if (step === 'input') {
    return (
      <Card className="w-full max-w-xl border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold font-display">
              {t('paperForm.title')}
            </CardTitle>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {t('common.step', { current: 1, total: 3 })}
            </span>
          </div>
          <CardDescription>
            {t('paperForm.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openreview_url">{t('paperForm.openreviewUrl.label')}</Label>
              <Input
                id="openreview_url"
                type="text"
                placeholder={t('paperForm.openreviewUrl.placeholder')}
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
                  <span>{t('paperForm.credentials.title')}</span>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('common.optional')}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('paperForm.credentials.helper')}
              </p>
              {showCredentials && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="openreview_username">
                      {t('paperForm.credentials.username.label')}
                    </Label>
                    <Input
                      id="openreview_username"
                      type="text"
                      placeholder={t('paperForm.credentials.username.placeholder')}
                      value={formData.openreview_username}
                      onChange={(e) =>
                        setFormData({ ...formData, openreview_username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="openreview_password">
                      {t('paperForm.credentials.password.label')}
                    </Label>
                    <Input
                      id="openreview_password"
                      type="password"
                      placeholder={t('paperForm.credentials.password.placeholder')}
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
                {showCredentials
                  ? t('paperForm.credentials.hide')
                  : t('paperForm.credentials.show')}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('paperForm.fetch')}
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
                <CardTitle className="font-display">{t('paperForm.confirm.title')}</CardTitle>
                <CardDescription>
                  {t('paperForm.confirm.subtitle')}
                </CardDescription>
              </div>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {t('common.step', { current: 2, total: 3 })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Paper Info */}
          <div className="rounded-xl border border-white/60 bg-white/70 p-4 shadow-sm space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('common.paperTitle')}</Label>
              <p className="font-medium">{preview.title || t('common.unknownTitle')}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                {t('common.conferenceVenue')}
              </Label>
              <p className="font-medium">{preview.venue || t('common.unknownVenue')}</p>
            </div>
            {preview.authors && preview.authors.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">{t('common.authors')}</Label>
                <p className="text-sm">{preview.authors.join(', ')}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">{t('common.paperId')}</Label>
              <p className="text-sm font-mono">{preview.openreview_id}</p>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="space-y-4">
            {senderEmail ? (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                {t('paperForm.info.senderConfigured.prefix')}
                <span className="font-semibold">{senderEmail}</span>
                {t('paperForm.info.senderConfigured.suffix')}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs text-muted-foreground">
                {t('paperForm.info.senderMissing')}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('paperForm.email.label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('paperForm.email.placeholder')}
                value={formData.email}
                onChange={(e) => {
                  const nextEmail = e.target.value
                  setFormData({ ...formData, email: nextEmail })
                  if (verificationSent || verificationCode) {
                    setVerificationSent(false)
                    setVerificationCode('')
                    setVerificationExpiresIn(null)
                  }
                }}
                required
              />
            </div>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!formData.email || verificationSending}
                onClick={handleSendVerification}
              >
                {verificationSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {verificationSent
                  ? t('paperForm.verification.resend')
                  : t('paperForm.verification.send')}
              </Button>
              {verificationSent && verificationExpiresIn && (
                <p className="text-xs text-muted-foreground">
                  {t('paperForm.verification.expires', { minutes: verificationExpiresIn })}
                </p>
              )}
            </div>
            {verificationSent && (
              <div className="space-y-2">
                <Label htmlFor="verification_code">{t('paperForm.verification.label')}</Label>
                <Input
                  id="verification_code"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('paperForm.verification.placeholder')}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>{t('paperForm.preferences.title')}</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_review"
                  checked={formData.notify_on_review}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_on_review: checked as boolean })
                  }
                />
                <Label htmlFor="notify_on_review" className="font-normal">
                  {t('paperForm.preferences.review')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_review_modified"
                  checked={formData.notify_on_review_modified}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notify_on_review_modified: checked as boolean })
                  }
                />
                <Label htmlFor="notify_on_review_modified" className="font-normal">
                  {t('paperForm.preferences.reviewModified')}
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
                  {t('paperForm.preferences.decision')}
                </Label>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={loading || !formData.email || !verificationSent || !verificationCode}
            onClick={handleConfirm}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('paperForm.confirm.subscribe')}
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
          <h3 className="text-xl font-semibold font-display">{t('paperForm.success.title')}</h3>
          <p className="text-muted-foreground">
            {t('paperForm.success.body.prefix')}
            <strong>{formData.email}</strong>
            {t('paperForm.success.body.suffix')}
          </p>
          {senderEmail && (
            <p className="text-xs text-muted-foreground">
              {t('paperForm.success.sender.prefix')}
              <strong>{senderEmail}</strong>
              {t('paperForm.success.sender.suffix')}
            </p>
          )}
          <p className="font-medium">{preview?.title || preview?.openreview_id}</p>
          <Button onClick={handleReset} variant="outline">
            {t('paperForm.success.monitorAnother')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
