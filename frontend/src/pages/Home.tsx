import { Link } from 'react-router-dom'
import { PaperForm } from '@/components/PaperForm'
import { BackendSelector } from '@/components/BackendSelector'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default function Home() {
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
                OR
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">OpenReview</p>
                <h1 className="font-display text-lg font-semibold">Monitor</h1>
              </div>
            </div>
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="rounded-full">
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </Link>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 py-12">
          <section className="mx-auto max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              OpenReview status radar
            </div>
            <div className="space-y-4">
              <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Know the moment reviews land.
              </h2>
              <p className="text-lg text-muted-foreground">
                Track OpenReview submissions, collect review updates, and get email alerts the
                second a decision drops.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1">No browser extension</span>
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1">Review and decision alerts</span>
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1">Works with private papers</span>
            </div>
          </section>

          <section className="mt-10 flex justify-center">
            <PaperForm />
          </section>

          <section className="mt-6 flex justify-center">
            <div className="w-full max-w-xl">
              <BackendSelector />
            </div>
          </section>

          <section className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-slate-900/5">
              <h3 className="font-display text-lg">Smarter checking</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We check when conferences usually release results, so you get alerts without spam.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-lg shadow-slate-900/5">
              <h3 className="font-display text-lg">Full review detail</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Scores, confidence, strengths, and weaknesses are sent straight to your inbox.
              </p>
            </div>
          </section>

          <section className="mt-16 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 1</p>
              <h3 className="mt-2 font-display text-lg">Paste the paper link</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add an OpenReview URL or paper ID. Credentials are optional but required for some venues.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2</p>
              <h3 className="mt-2 font-display text-lg">Confirm details</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Verify the title, venue, and authors before subscribing with your email address.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 3</p>
              <h3 className="mt-2 font-display text-lg">Get notified</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Receive email alerts the moment reviews or decisions appear.
              </p>
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-6 shadow-lg shadow-amber-900/10">
              <h3 className="font-display text-lg">Credentials are optional</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Some conferences require login to view reviews or decisions. If you provide credentials,
                we only use them to fetch paper status. Use at your own risk. For stronger security,
                self-host the backend service.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg shadow-slate-900/5">
              <h3 className="font-display text-lg">Designed for teams</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Multiple subscribers can follow the same paper with their own notification preferences.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                Tip: share one backend and let everyone pick their own email alerts.
              </div>
            </div>
          </section>
        </main>

        <footer className="relative z-10 border-t border-white/60 bg-white/70">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            <p>OpenReview Monitor - Stay updated on your paper submissions</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
