import { Link } from 'react-router-dom'
import { PaperForm } from '@/components/PaperForm'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h1 className="text-xl font-bold">OpenReview Monitor</h1>
          </div>
          <Link to="/admin">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Never Miss a Review Again
          </h2>
          <p className="text-lg text-muted-foreground">
            Monitor your OpenReview paper submissions and get notified instantly
            when reviews are posted or decisions are announced.
          </p>
        </div>

        <div className="flex justify-center">
          <PaperForm />
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-center">How it works</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-medium mb-1">Enter Paper URL</h4>
              <p className="text-sm text-muted-foreground">
                Paste your OpenReview paper URL. For private papers, add your OpenReview credentials.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-medium mb-1">Confirm & Subscribe</h4>
              <p className="text-sm text-muted-foreground">
                Verify the paper details and enter your email to receive notifications.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-medium mb-1">Get Notified</h4>
              <p className="text-sm text-muted-foreground">
                Receive detailed email alerts when reviews or decisions are available.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Smart checking: Only checks when conferences typically release results</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Full review details: Ratings, confidence, strengths & weaknesses in your email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Private paper support: Use your OpenReview credentials for author-only papers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>No duplicate notifications: Each update is sent only once</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>OpenReview Monitor - Stay updated on your paper submissions</p>
        </div>
      </footer>
    </div>
  )
}
