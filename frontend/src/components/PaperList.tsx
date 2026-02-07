import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api, Paper } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Trash2, ExternalLink, RefreshCw, MailCheck, Bell } from 'lucide-react'

interface PaperListProps {
  onRefresh?: () => void
}

export function PaperList({ onRefresh }: PaperListProps) {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { t, formatDateTime } = useI18n()

  const fetchPapers = async () => {
    setLoading(true)
    const result = await api.getPapers()
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setPapers(result.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPapers()
  }, [])

  const handleDelete = async (paperId: number) => {
    if (!confirm(t('paperList.confirmDelete'))) return

    const result = await api.deletePaper(paperId)
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('paperList.toast.deleted'),
      })
      fetchPapers()
      onRefresh?.()
    }
  }

  const handleCheckNow = async () => {
    const result = await api.checkNow()
    if (result.error) {
      toast({
        title: t('common.error'),
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: t('common.success'),
        description: t('paperList.toast.checkInitiated'),
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      decided: 'bg-purple-100 text-purple-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('paperList.status.pending')
      case 'reviewed':
        return t('paperList.status.reviewed')
      case 'accepted':
        return t('paperList.status.accepted')
      case 'rejected':
        return t('paperList.status.rejected')
      case 'decided':
        return t('paperList.status.decided')
      default:
        return status
    }
  }

  // Group papers by venue
  const groupedPapers = papers.reduce((acc, paper) => {
    const venue = paper.venue || t('common.unknownVenue')
    if (!acc[venue]) acc[venue] = []
    acc[venue].push(paper)
    return acc
  }, {} as Record<string, Paper[]>)

  if (loading) {
    return <div className="text-center py-8">{t('paperList.loading')}</div>
  }

  return (
    <Card className="border border-white/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">{t('paperList.title')}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPapers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('paperList.refresh')}
          </Button>
          <Button variant="default" size="sm" onClick={handleCheckNow}>
            {t('paperList.checkAll')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {papers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('paperList.none')}
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPapers).map(([venue, venuePapers]) => (
              <div key={venue}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                    {venue}
                  </span>
                  <span className="text-xs">
                    {t('paperList.venueCount', { count: venuePapers.length })}
                  </span>
                </h3>
                <div className="space-y-3">
                  {venuePapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex items-start justify-between rounded-xl border border-white/60 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">
                            {paper.title || paper.openreview_id}
                          </h4>
                          <a
                            href={`https://openreview.net/forum?id=${paper.openreview_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary flex-shrink-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              paper.status
                            )}`}
                          >
                            {getStatusLabel(paper.status)}
                          </span>
                          <span className="text-muted-foreground">
                            {t('paperList.subscriberCount', { count: paper.subscriber_count ?? 0 })}
                          </span>

                          {/* Notification status indicators */}
                          <div className="flex items-center gap-2">
                            {paper.notified_review ? (
                              <span
                                className="flex items-center gap-1 text-xs text-blue-600"
                                title={t('paperList.reviewSentTitle')}
                              >
                                <MailCheck className="h-3 w-3" />
                                {t('common.review')}
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 text-xs text-muted-foreground"
                                title={t('paperList.reviewPendingTitle')}
                              >
                                <Bell className="h-3 w-3" />
                                {t('common.review')}
                              </span>
                            )}
                            {paper.notified_decision ? (
                              <span
                                className="flex items-center gap-1 text-xs text-green-600"
                                title={t('paperList.decisionSentTitle')}
                              >
                                <MailCheck className="h-3 w-3" />
                                {t('common.decision')}
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 text-xs text-muted-foreground"
                                title={t('paperList.decisionPendingTitle')}
                              >
                                <Bell className="h-3 w-3" />
                                {t('common.decision')}
                              </span>
                            )}
                          </div>
                        </div>
                        {paper.last_checked && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('paperList.lastChecked', {
                              date: formatDateTime(paper.last_checked),
                            })}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 ml-2"
                        onClick={() => handleDelete(paper.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
