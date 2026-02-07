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
import { api, Subscriber, Config, ConfigUpdate } from '@/lib/api'
import { getApiConfig } from '@/lib/apiBase'
import { Home, LogOut, Trash2, Save, Loader2, Mail, MailCheck, Bell, RotateCcw } from 'lucide-react'

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [configForm, setConfigForm] = useState<ConfigUpdate>({})
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [apiInfo, setApiInfo] = useState<{ mode: string; base: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
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
      setConfig(configResult.data)
      setConfigForm({
        check_interval: configResult.data.check_interval,
        smtp_host: configResult.data.smtp_host,
        smtp_port: configResult.data.smtp_port,
        smtp_user: configResult.data.smtp_user,
        from_email: configResult.data.from_email,
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsLoggedIn(false)
  }

  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return

    const result = await api.deleteSubscriber(id)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Subscriber deleted',
      })
      loadData()
    }
  }

  const handleResetNotifications = async (id: number) => {
    const result = await api.resetSubscriberNotifications(id)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Notification status reset',
      })
      loadData()
    }
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    const result = await api.updateConfig(configForm)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Configuration saved',
      })
      loadData()
    }
    setLoading(false)
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      })
      return
    }

    setSendingTestEmail(true)
    const result = await api.sendTestEmail(testEmail)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `Test email sent to ${testEmail}`,
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
    const venue = sub.paper_venue || 'Unknown Venue'
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
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
                AD
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Control</p>
                <h1 className="font-display text-lg font-semibold">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {apiInfo && (
                <span className="hidden items-center rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs text-muted-foreground lg:inline-flex">
                  {apiInfo.mode === 'official' ? 'Official backend' : 'Custom backend'} · {apiInfo.base}
                </span>
              )}
              <Link to="/">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 py-8">
          <Tabs defaultValue="papers" className="space-y-6">
            <TabsList className="bg-white/70 backdrop-blur">
              <TabsTrigger value="papers">Papers</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

          <TabsContent value="papers">
            <PaperList onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="subscribers">
            <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-display">Subscribers</CardTitle>
                <CardDescription>
                  Manage email subscribers and their notification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No subscribers yet
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
                                  Paper: {sub.paper_title || `ID: ${sub.paper_id}`}
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
                                      Review {sub.notified_review ? 'Sent' : 'Pending'}
                                    </span>
                                  )}
                                  {sub.notify_on_review_modified && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                                      Review Changes On
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
                                      Decision {sub.notified_decision ? 'Sent' : 'Pending'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Reset notification status"
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
                  <CardTitle className="font-display">System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="check_interval">Check Interval (minutes)</Label>
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
                        How often to check for paper updates
                      </p>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-medium mb-4">SMTP Configuration</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp_host">SMTP Host</Label>
                          <Input
                            id="smtp_host"
                            value={configForm.smtp_host || ''}
                            onChange={(e) =>
                              setConfigForm({ ...configForm, smtp_host: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp_port">SMTP Port</Label>
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
                          <Label htmlFor="smtp_user">SMTP Username</Label>
                          <Input
                            id="smtp_user"
                            value={configForm.smtp_user || ''}
                            onChange={(e) =>
                              setConfigForm({ ...configForm, smtp_user: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp_password">SMTP Password</Label>
                          <Input
                            id="smtp_password"
                            type="password"
                            placeholder="Enter new password to change"
                            onChange={(e) =>
                              setConfigForm({
                                ...configForm,
                                smtp_password: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="from_email">From Email</Label>
                          <Input
                            id="from_email"
                            type="email"
                            value={configForm.from_email || ''}
                            onChange={(e) =>
                              setConfigForm({ ...configForm, from_email: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveConfig} disabled={loading} className="w-full">
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-display">Test Email</CardTitle>
                  <CardDescription>
                    Send a test email to verify your SMTP configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test_email">Recipient Email</Label>
                      <Input
                        id="test_email"
                        type="email"
                        placeholder="your@email.com"
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
                      Send Test Email
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Make sure to save your SMTP configuration before sending a test email.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
