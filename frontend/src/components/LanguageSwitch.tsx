import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type LanguageSwitchProps = {
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

export function LanguageSwitch({ className, size = 'sm' }: LanguageSwitchProps) {
  const { locale, setLocale, t } = useI18n()

  const nextLocale = locale === 'en' ? 'zh' : 'en'

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn('rounded-full border-white/70 bg-white/70 text-xs', className)}
      onClick={() => setLocale(nextLocale)}
      aria-label={t('lang.switchAria')}
    >
      {t('lang.switch')}
    </Button>
  )
}
