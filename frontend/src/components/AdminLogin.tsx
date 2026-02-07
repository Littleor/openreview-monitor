import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import { Loader2, Lock } from 'lucide-react'

interface AdminLoginProps {
  onLogin: () => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await api.login(password)

    if (result.error) {
      toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.data?.token) {
      localStorage.setItem('admin_token', result.data.token)
      toast({
        title: 'Success',
        description: 'Logged in successfully',
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
        <CardTitle className="font-display">Admin Login</CardTitle>
        <CardDescription>
          Enter your admin password to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
