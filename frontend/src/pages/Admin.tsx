import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { AdminLogin } from '@/components/AdminLogin'
import { PaperList } from '@/components/PaperList'
import { LanguageSwitch } from '@/components/LanguageSwitch'
import { api, Subscriber, ConfigUpdate } from '@/lib/api'
import { clearAdminToken, getAdminToken } from '@/lib/adminToken'
import { getApiConfig } from '@/lib/apiBase'
import { useI18n } from '@/lib/i18n'
import { Home, LogOut, Trash2, Save, Loader2, Mail, MailCheck, Bell, RotateCcw } from 'lucide-react'

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [configForm, setConfigForm] = useState<ConfigUpdate>({})
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [apiInfo, setApiInfo] = useState<{ mode: string; base: string } | null>(null)
  const { toast } = useToast()
  const { t } = useI18n()

  useEffect(() => {
    const token = getAdminToken()
    if (token) {
      setIsLoggedIn(true)
      loadData()
    }
    setApiInfo(getApiConfig())
  }, [])

  const loadData = async () => {
    const [subsResult, configResult] = await Promise.all([
      api.getSubscribers(),
      api.getConfig(),
    ])

    if (subsResult.data) {
      setSubscribers(subsResult.data)
    }
    if (configResult.data) {
      setConfigForm({
        check_interval: configResult.data.check_interval,
        review_mod_check_interval: configResult.data.review_mod_check_interval,
        review_mod_request_gap_seconds: configResult.data.review_mod_request_gap_seconds,
        smtp_host: configResult.data.smtp_host,
        smtp_port: configResult.data.smtp_port,
        smtp_user: configResult.data.smtp_user,
        from_email: configResult.data.from_email,
        from_name: configResult.data.from_name,
      })
    }
  }

  const handleLogout = () => {
    clearAdminToken()
    setIsLoggedIn(false)
  }

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm(t('admin.subscribers.confirmDelete'))) return

    const result = await api.deleteSubscriber(id)
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('admin.toast.subscriberDeleted'),
      })
      loadData()
    }
  }

  const handleResetNotifications = async (id: number) => {
    const result = await api.resetSubscriberNotifications(id)
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('admin.toast.notificationReset'),
      })
      loadData()
    }
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    const result = await api.updateConfig(configForm)
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('admin.toast.configSaved'),
      })
      loadData()
    }
    setLoading(false)
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: t('common.error'),
        description: t('admin.toast.emailRequired'),
        variant: 'destructive',
      })
      return
    }

    setSendingTestEmail(true)
    const result = await api.sendTestEmail(testEmail)
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('admin.toast.testEmailSent', { email: testEmail }),
      })
    }
    setSendingTestEmail(false)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
          <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.2)_1px,transparent_0)] bg-[size:24px_24px] opacity-30" />
          <div className="absolute top-6 right-6">
            <LanguageSwitch />
          </div>
          <div className="relative z-10 px-4">
            <AdminLogin onLogin={() => {
              setIsLoggedIn(true)
              loadData()
            }} />
          </div>
        </div>
      </div>
    )
  }

  // Group subscribers by venue
  const groupedSubscribers = subscribers.reduce((acc, sub) => {
    const venue = sub.paper_venue || t('common.unknownVenue')
    if (!acc[venue]) acc[venue] = []
    acc[venue].push(sub)
    return acc
  }, {} as Record<string, Subscriber[]>)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.2)_1px,transparent_0)] bg-[size:24px_24px] opacity-30" />

        <header className="relative z-10 border-b border-white/60 bg-white/70 backdrop-blur">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
                AD
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {t('nav.control')}
                </p>
                <h1 className="font-display text-lg font-semibold">{t('nav.adminDashboard')}</h1>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <LanguageSwitch />
              {apiInfo && (
                <span className="hidden items-center rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs text-muted-foreground lg:inline-flex">
                  {apiInfo.mode === 'official'
                    ? t('nav.officialBackend')
                    : t('nav.customBackend')}{' '}
                  · {apiInfo.base}
                </span>
              )}
              <Link to="/">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Home className="mr-2 h-4 w-4" />
                  {t('nav.home')}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full">
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 py-8">
          <Tabs defaultValue="papers" className="space-y-6">
            <TabsList className="bg-white/70 backdrop-blur">
              <TabsTrigger value="papers">{t('admin.tabs.papers')}</TabsTrigger>
              <TabsTrigger value="subscribers">{t('admin.tabs.subscribers')}</TabsTrigger>
              <TabsTrigger value="config">{t('admin.tabs.config')}</TabsTrigger>
            </TabsList>
            <TabsContent value="papers">
              <PaperList onRefresh={loadData} />
            </TabsContent>

            <TabsContent value="subscribers">
              <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-display">{t('admin.subscribers.title')}</CardTitle>
                  <CardDescription>
                    {t('admin.subscribers.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscribers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      {t('admin.subscribers.none')}
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedSubscribers).map(([venue, venueSubscribers]) => (
                        <div key={venue}>
                          <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                              {venue}
                            </span>
                          </h3>
                          <div className="space-y-3">
                            {venueSubscribers.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-start justify-between rounded-xl border border-white/60 bg-white/70 p-4 shadow-sm"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{sub.email}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {t('admin.subscribers.paper', {
                                      title: sub.paper_title || `ID: ${sub.paper_id}`,
                                    })}
                                  </div>
                                  <div className="flex gap-3 mt-2 flex-wrap">
                                    {/* Review notification status */}
                                    {sub.notify_on_review && (
                                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                        sub.notified_review
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {sub.notified_review ? (
                                          <MailCheck className="h-3 w-3" />
                                        ) : (
                                          <Bell className="h-3 w-3" />
                                        )}
                                        {t('admin.subscribers.reviewStatus', {
                                          status: sub.notified_review
                                            ? t('common.sent')
                                            : t('common.pending'),
                                        })}
                                      </span>
                                    )}
                                    {sub.notify_on_review_modified && (
                                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                                        {t('admin.subscribers.reviewChanges')}
                                      </span>
                                    )}
                                    {/* Decision notification status */}
                                    {sub.notify_on_decision && (
                                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                        sub.notified_decision
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {sub.notified_decision ? (
                                          <MailCheck className="h-3 w-3" />
                                        ) : (
                                          <Bell className="h-3 w-3" />
                                        )}
                                        {t('admin.subscribers.decisionStatus', {
                                          status: sub.notified_decision
                                            ? t('common.sent')
                                            : t('common.pending'),
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title={t('admin.subscribers.resetTitle')}
                                    onClick={() => handleResetNotifications(sub.id)}
                                  >
                                    <RotateCcw className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSubscriber(sub.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="font-display">{t('admin.config.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="check_interval">
                          {t('admin.config.checkInterval.label')}
                        </Label>
                        <Input
                          id="check_interval"
                          type="number"
                          min="5"
                          value={configForm.check_interval || ''}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              check_interval: parseInt(e.target.value),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.config.checkInterval.help')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review_mod_check_interval">
                          {t('admin.config.reviewModInterval.label')}
                        </Label>
                        <Input
                          id="review_mod_check_interval"
                          type="number"
                          min="1"
                          value={configForm.review_mod_check_interval || ''}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              review_mod_check_interval: parseInt(e.target.value),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.config.reviewModInterval.help')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review_mod_request_gap_seconds">
                          {t('admin.config.reviewModGapSeconds.label')}
                        </Label>
                        <Input
                          id="review_mod_request_gap_seconds"
                          type="number"
                          min="0"
                          step="0.1"
                          value={configForm.review_mod_request_gap_seconds ?? ''}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              review_mod_request_gap_seconds: parseFloat(e.target.value),
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('admin.config.reviewModGapSeconds.help')}
                        </p>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="font-medium mb-4">{t('admin.config.smtp.title')}</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="smtp_host">{t('admin.config.smtp.host')}</Label>
                            <Input
                              id="smtp_host"
                              value={configForm.smtp_host || ''}
                              onChange={(e) =>
                                setConfigForm({ ...configForm, smtp_host: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp_port">{t('admin.config.smtp.port')}</Label>
                            <Input
                              id="smtp_port"
                              type="number"
                              value={configForm.smtp_port || ''}
                              onChange={(e) =>
                                setConfigForm({
                                  ...configForm,
                                  smtp_port: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp_user">{t('admin.config.smtp.user')}</Label>
                            <Input
                              id="smtp_user"
                              value={configForm.smtp_user || ''}
                              onChange={(e) =>
                                setConfigForm({ ...configForm, smtp_user: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="smtp_password">{t('admin.config.smtp.password')}</Label>
                            <Input
                              id="smtp_password"
                              type="password"
                              placeholder={t('admin.config.smtp.password.placeholder')}
                              onChange={(e) =>
                                setConfigForm({
                                  ...configForm,
                                  smtp_password: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="from_email">{t('admin.config.smtp.fromEmail')}</Label>
                            <Input
                              id="from_email"
                              type="email"
                              value={configForm.from_email || ''}
                              onChange={(e) =>
                                setConfigForm({ ...configForm, from_email: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="from_name">{t('admin.config.smtp.fromName')}</Label>
                            <Input
                              id="from_name"
                              placeholder={t('admin.config.smtp.fromName.placeholder')}
                              value={configForm.from_name || ''}
                              onChange={(e) =>
                                setConfigForm({ ...configForm, from_name: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleSaveConfig} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {t('admin.config.save')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="font-display">{t('admin.test.title')}</CardTitle>
                    <CardDescription>
                      {t('admin.test.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="test_email">{t('admin.test.recipient')}</Label>
                        <Input
                          id="test_email"
                          type="email"
                          placeholder={t('admin.test.placeholder')}
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleSendTestEmail}
                        disabled={sendingTestEmail || !testEmail}
                        className="w-full"
                      >
                        {sendingTestEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Mail className="mr-2 h-4 w-4" />
                        {t('admin.test.send')}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.test.helper')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
    </div>
  </div>
  )
}
