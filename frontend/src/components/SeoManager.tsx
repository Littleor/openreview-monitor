import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'

const normalizeLangParam = (value: string | null) => {
  if (value === 'en' || value === 'zh') return value
  return null
}

const localeToLocaleTag = (locale: 'en' | 'zh') => (locale === 'zh' ? 'zh-CN' : 'en')

const localeToOpenGraph = (locale: 'en' | 'zh') => (locale === 'zh' ? 'zh_CN' : 'en_US')

const ensureMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => {
      element!.setAttribute(key, value)
    })
    document.head.appendChild(element)
  }
  return element
}

const setMeta = (selector: string, attrs: Record<string, string>, content: string) => {
  const element = ensureMeta(selector, attrs)
  element.setAttribute('content', content)
}

const ensureLink = (selector: string, attrs: Record<string, string>) => {
  let element = document.querySelector<HTMLLinkElement>(selector)
  if (!element) {
    element = document.createElement('link')
    Object.entries(attrs).forEach(([key, value]) => {
      element!.setAttribute(key, value)
    })
    document.head.appendChild(element)
  }
  return element
}

const setLink = (selector: string, attrs: Record<string, string>, href: string) => {
  const element = ensureLink(selector, attrs)
  element.setAttribute('href', href)
}

export function SeoManager() {
  const { locale, setLocale, t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const langParam = normalizeLangParam(params.get('lang'))
    if (langParam && langParam !== locale) {
      setLocale(langParam)
    }
  }, [location.search, locale, setLocale])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('lang') !== locale) {
      params.set('lang', locale)
      const search = params.toString()
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        { replace: true },
      )
    }
  }, [locale, location.pathname, location.search, location.hash, navigate])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const basePath = location.pathname || '/'
    const canonicalParams = new URLSearchParams()
    canonicalParams.set('lang', locale)

    const canonical = origin
      ? `${origin}${basePath}?${canonicalParams.toString()}`
      : `${basePath}?${canonicalParams.toString()}`
    const enHref = origin ? `${origin}${basePath}?lang=en` : `${basePath}?lang=en`
    const zhHref = origin ? `${origin}${basePath}?lang=zh` : `${basePath}?lang=zh`
    const defaultHref = enHref
    const imageUrl = origin ? `${origin}/og-image.png` : '/og-image.png'

    const isAdmin = basePath.startsWith('/admin')
    setMeta('meta[name="robots"]', { name: 'robots' }, isAdmin ? 'noindex,nofollow' : 'index,follow')

    setLink('link[rel="canonical"]', { rel: 'canonical' }, canonical)
    setLink(
      'link[rel="alternate"][hreflang="en"]',
      { rel: 'alternate', hreflang: 'en' },
      enHref,
    )
    setLink(
      'link[rel="alternate"][hreflang="zh-CN"]',
      { rel: 'alternate', hreflang: 'zh-CN' },
      zhHref,
    )
    setLink(
      'link[rel="alternate"][hreflang="x-default"]',
      { rel: 'alternate', hreflang: 'x-default' },
      defaultHref,
    )

    setMeta('meta[property="og:url"]', { property: 'og:url' }, canonical)
    setMeta('meta[property="og:locale"]', { property: 'og:locale' }, localeToOpenGraph(locale))
    setMeta('meta[property="og:image"]', { property: 'og:image' }, imageUrl)
    setMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, t('seo.ogTitle'))
    setMeta('meta[name="twitter:url"]', { name: 'twitter:url' }, canonical)
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, imageUrl)
    setMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, t('seo.twitterTitle'))

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'OpenReview Monitor',
      description: t('seo.description'),
      url: canonical,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      inLanguage: localeToLocaleTag(locale),
    }

    const structuredDataEl = document.getElementById('structured-data')
    if (structuredDataEl) {
      structuredDataEl.textContent = JSON.stringify(structuredData)
    }
  }, [location.pathname, locale, t])

  return null
}
