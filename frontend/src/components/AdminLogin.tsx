import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import { setAdminToken } from '@/lib/adminToken'
import { useI18n } from '@/lib/i18n'
import { Loader2, Lock } from 'lucide-react'

interface AdminLoginProps {
  onLogin: () => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await api.login(password)

    if (result.error) {
      toast({
        title: t('adminLogin.toast.failed'),
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.data?.token) {
      setAdminToken(result.data.token)
      toast({
        title: t('common.success'),
        description: t('adminLogin.toast.success'),
      })
      onLogin()
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-display">{t('adminLogin.title')}</CardTitle>
        <CardDescription>
          {t('adminLogin.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('adminLogin.password.label')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('adminLogin.password.placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('adminLogin.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
