import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Locale = 'en' | 'zh'

const translations = {
  en: {
    'seo.title': 'OpenReview Monitor | 24/7 Review & Decision Alerts',
    'seo.description':
      'OpenReview Monitor provides 24/7 monitoring for OpenReview papers, instant email alerts for reviews and decisions, and an open-source, self-hostable backend for secure tracking.',
    'seo.keywords':
      'OpenReview monitor, paper reviews, decision alerts, academic conferences, open source, self-hosted, email alerts',
    'seo.ogTitle': 'OpenReview Monitor | 24/7 Review & Decision Alerts',
    'seo.ogDescription':
      'Track OpenReview submissions 24/7 with instant review and decision alerts, backed by open-source, self-hostable code.',
    'seo.twitterTitle': 'OpenReview Monitor | 24/7 Review & Decision Alerts',
    'seo.twitterDescription':
      'Instant OpenReview review and decision alerts, with open-source, self-hostable monitoring.',
    'lang.switch': '中文',
    'lang.switchAria': 'Switch to Chinese',
    'brand.monitor': 'Monitor',
    'nav.github': 'GitHub',
    'nav.backend': 'Backend',
    'nav.official': 'Official',
    'nav.custom': 'Custom',
    'nav.admin': 'Admin',
    'nav.home': 'Home',
    'nav.logout': 'Logout',
    'nav.control': 'Control',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.officialBackend': 'Official backend',
    'nav.customBackend': 'Custom backend',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.loading': 'Loading...',
    'common.optional': 'Optional',
    'common.step': 'Step {current} of {total}',
    'common.stepShort': 'Step {current}',
    'common.unknownTitle': 'Unknown Title',
    'common.unknownVenue': 'Unknown Venue',
    'common.paperTitle': 'Paper Title',
    'common.conferenceVenue': 'Conference / Venue',
    'common.authors': 'Authors',
    'common.paperId': 'Paper ID',
    'common.confirm': 'Confirm',
    'common.checking': 'Checking...',
    'common.review': 'Review',
    'common.decision': 'Decision',
    'common.sent': 'Sent',
    'common.pending': 'Pending',
    'home.hero.badge': 'Always-on OpenReview monitoring',
    'home.hero.title': 'Know the moment reviews land.',
    'home.hero.subtitle':
      'OpenReview Monitor tracks submissions 24/7, delivers instant review and decision alerts, and stays transparent with open-source, self-hostable code.',
    'home.hero.tag.monitoring': '24/7 monitoring',
    'home.hero.tag.auditable': 'Open-source & auditable',
    'home.hero.tag.security': 'Self-hostable security',
    'home.hero.tag.alerts': 'Review and decision alerts',
    'home.feature.alwaysOn.title': 'Always-on monitoring',
    'home.feature.alwaysOn.body':
      'We keep a 24/7 schedule tuned to conference timelines, so you get fast alerts without spam.',
    'home.feature.openSource.title': 'Open-source & secure',
    'home.feature.openSource.body':
      'Audit the code, self-host the backend, and keep credentials under your control.',
    'home.feature.details.title': 'Full review detail',
    'home.feature.details.body':
      'Scores, confidence, strengths, and weaknesses are sent straight to your inbox.',
    'home.steps.1.title': 'Paste the paper link',
    'home.steps.1.body':
      'Add an OpenReview URL or paper ID. Credentials are optional but required for some venues.',
    'home.steps.2.title': 'Confirm details',
    'home.steps.2.body':
      'Verify the title, venue, and authors before subscribing with your email address.',
    'home.steps.3.title': 'Get notified',
    'home.steps.3.body': 'Receive email alerts the moment reviews or decisions appear.',
    'home.callout.credentials.title': 'Credentials are optional',
    'home.callout.credentials.body':
      'Some conferences require login to view reviews or decisions. If you provide credentials, we only use them to fetch paper status. For stronger security and control, self-host the open-source backend.',
    'home.callout.teams.title': 'Designed for teams',
    'home.callout.teams.body':
      'Multiple subscribers can follow the same paper with their own notification preferences.',
    'home.callout.teams.tip':
      'Tip: share one backend and let everyone pick their own email alerts.',
    'home.footer.tagline': 'OpenReview Monitor - Stay updated on your paper submissions',
    'paperForm.title': 'Monitor a Paper',
    'paperForm.description':
      'Paste the OpenReview URL or paper ID. Credentials are optional but required for some venues.',
    'paperForm.openreviewUrl.label': 'OpenReview URL or Paper ID',
    'paperForm.openreviewUrl.placeholder': 'https://openreview.net/forum?id=xxx',
    'paperForm.credentials.title': 'OpenReview credentials',
    'paperForm.credentials.helper':
      'Required for private papers or restricted venues. We only use credentials to fetch paper status. Use at your own risk. For stronger security, self-host the backend.',
    'paperForm.credentials.username.label': 'OpenReview Username',
    'paperForm.credentials.username.placeholder': 'your@email.com',
    'paperForm.credentials.password.label': 'OpenReview Password',
    'paperForm.credentials.password.placeholder': 'Your OpenReview password',
    'paperForm.credentials.show': 'Add credentials',
    'paperForm.credentials.hide': 'Hide credentials',
    'paperForm.fetch': 'Fetch Paper Info',
    'paperForm.confirm.title': 'Confirm Paper Details',
    'paperForm.confirm.subtitle': 'Please verify the information below',
    'paperForm.info.senderConfigured.prefix': 'Notifications are sent from ',
    'paperForm.info.senderConfigured.suffix':
      '. Add this sender to your allowlist to avoid missing updates.',
    'paperForm.info.senderMissing':
      'Sender email is not configured yet. Ask the admin to set the From email so you can receive notifications reliably.',
    'paperForm.email.label': 'Your Email Address',
    'paperForm.email.placeholder': 'your@email.com',
    'paperForm.verification.send': 'Send verification code',
    'paperForm.verification.resend': 'Resend verification code',
    'paperForm.verification.expires': 'Code expires in {minutes} minutes.',
    'paperForm.verification.label': 'Verification Code',
    'paperForm.verification.placeholder': '6-digit code',
    'paperForm.preferences.title': 'Notification Preferences',
    'paperForm.preferences.review': 'Notify me when reviews are available',
    'paperForm.preferences.reviewModified': 'Notify me when reviews are modified',
    'paperForm.preferences.decision': 'Notify me when the final decision is announced',
    'paperForm.confirm.subscribe': 'Confirm & Subscribe',
    'paperForm.success.title': 'Subscription active',
    'paperForm.success.body.prefix': 'You will receive email notifications at ',
    'paperForm.success.body.suffix': ' when there are updates for:',
    'paperForm.success.sender.prefix': 'Emails will be sent from ',
    'paperForm.success.sender.suffix': '. Add it to your allowlist.',
    'paperForm.success.monitorAnother': 'Monitor Another Paper',
    'paperForm.toast.verificationFailed': 'Verification failed',
    'paperForm.toast.verificationSent': 'Verification code sent',
    'paperForm.toast.checkEmail': 'Check {email} for the code.',
    'backend.title': 'Backend Settings',
    'backend.description':
      'Choose the backend server for API requests. The monitor works with either option.',
    'backend.tab.official': 'Official',
    'backend.tab.custom': 'Custom',
    'backend.custom.label': 'Custom Backend Base URL',
    'backend.custom.placeholder': 'https://your-backend.example.com',
    'backend.custom.help': 'We will append /api if it is missing. Click confirm to apply.',
    'backend.custom.normalized.prefix': 'Normalized:',
    'backend.custom.warning':
      'Adding an unknown backend may expose your credentials. We recommend self-hosting or using the official backend. Any backend other than your own carries leakage risk. Use at your own risk.',
    'backend.currentBase.prefix': 'Current API base:',
    'backend.officialBase.prefix': 'Official backend:',
    'backend.toast.officialTitle': 'Using official backend',
    'backend.toast.customTitle': 'Using custom backend',
    'backend.toast.baseSet': 'API base set to {base}',
    'backend.error.invalidBase':
      'Enter a valid base URL, for example http://localhost:8000',
    'backend.error.healthFailed': 'Health check failed (HTTP {status}).',
    'backend.error.timeout': 'Health check timed out. Please verify the backend address.',
    'backend.error.unreachable': 'Unable to reach the backend. Please verify the address.',
    'backend.sameOrigin': 'Same origin ({base})',
    'adminLogin.title': 'Admin Login',
    'adminLogin.description': 'Enter your admin password to access the dashboard',
    'adminLogin.password.label': 'Password',
    'adminLogin.password.placeholder': 'Enter admin password',
    'adminLogin.submit': 'Login',
    'adminLogin.toast.failed': 'Login Failed',
    'adminLogin.toast.success': 'Logged in successfully',
    'admin.tabs.papers': 'Papers',
    'admin.tabs.subscribers': 'Subscribers',
    'admin.tabs.config': 'Configuration',
    'admin.subscribers.title': 'Subscribers',
    'admin.subscribers.description': 'Manage email subscribers and their notification status',
    'admin.subscribers.none': 'No subscribers yet',
    'admin.subscribers.paper': 'Paper: {title}',
    'admin.subscribers.reviewStatus': 'Review {status}',
    'admin.subscribers.decisionStatus': 'Decision {status}',
    'admin.subscribers.reviewChanges': 'Review changes on',
    'admin.subscribers.resetTitle': 'Reset notification status',
    'admin.subscribers.confirmDelete':
      'Are you sure you want to delete this subscriber?',
    'admin.toast.subscriberDeleted': 'Subscriber deleted',
    'admin.toast.notificationReset': 'Notification status reset',
    'admin.toast.configSaved': 'Configuration saved',
    'admin.toast.emailRequired': 'Please enter an email address',
    'admin.toast.testEmailSent': 'Test email sent to {email}',
    'admin.config.title': 'System Configuration',
    'admin.config.checkInterval.label': 'Check Interval (minutes)',
    'admin.config.checkInterval.help': 'How often to check for paper updates',
    'admin.config.reviewModInterval.label': 'Review Modify Check Interval (minutes)',
    'admin.config.reviewModInterval.help':
      'How often to check review modifications for subscribed papers',
    'admin.config.smtp.title': 'SMTP Configuration',
    'admin.config.smtp.host': 'SMTP Host',
    'admin.config.smtp.port': 'SMTP Port',
    'admin.config.smtp.user': 'SMTP Username',
    'admin.config.smtp.password': 'SMTP Password',
    'admin.config.smtp.password.placeholder': 'Enter new password to change',
    'admin.config.smtp.fromEmail': 'From Email',
    'admin.config.smtp.fromName': 'From Name',
    'admin.config.smtp.fromName.placeholder': 'OpenReview Monitor',
    'admin.config.save': 'Save Configuration',
    'admin.test.title': 'Test Email',
    'admin.test.description': 'Send a test email to verify your SMTP configuration',
    'admin.test.recipient': 'Recipient Email',
    'admin.test.placeholder': 'your@email.com',
    'admin.test.send': 'Send Test Email',
    'admin.test.helper':
      'Make sure to save your SMTP configuration before sending a test email.',
    'paperList.loading': 'Loading papers...',
    'paperList.title': 'Monitored Papers',
    'paperList.refresh': 'Refresh',
    'paperList.checkAll': 'Check All Now',
    'paperList.none': 'No papers being monitored',
    'paperList.venueCount': '({count} papers)',
    'paperList.subscriberCount': '{count} subscriber(s)',
    'paperList.reviewSentTitle': 'Review notification sent',
    'paperList.reviewPendingTitle': 'Review notification pending',
    'paperList.decisionSentTitle': 'Decision notification sent',
    'paperList.decisionPendingTitle': 'Decision notification pending',
    'paperList.lastChecked': 'Last checked: {date}',
    'paperList.confirmDelete':
      'Are you sure you want to delete this paper and all its subscribers?',
    'paperList.toast.deleted': 'Paper deleted successfully',
    'paperList.toast.checkInitiated':
      'Paper check initiated. This may take a few minutes.',
    'paperList.status.pending': 'Pending',
    'paperList.status.reviewed': 'Reviewed',
    'paperList.status.accepted': 'Accepted',
    'paperList.status.rejected': 'Rejected',
    'paperList.status.decided': 'Decided',
  },
  zh: {
    'seo.title': 'OpenReview Monitor | 24/7 评审与决定提醒',
    'seo.description':
      'OpenReview Monitor 提供 24/7 论文监控，评审与决定邮件即时提醒，并支持开源自托管，安全可靠。',
    'seo.keywords':
      'OpenReview 监控, 论文评审, 决定提醒, 学术会议, 开源, 自托管, 邮件通知',
    'seo.ogTitle': 'OpenReview Monitor | 24/7 评审与决定提醒',
    'seo.ogDescription':
      '全天候追踪 OpenReview 投稿，评审与决定更新即刻提醒，开源且可自托管。',
    'seo.twitterTitle': 'OpenReview Monitor | 24/7 评审与决定提醒',
    'seo.twitterDescription':
      'OpenReview 评审与决定更新即刻通知，开源可自托管。',
    'lang.switch': 'English',
    'lang.switchAria': '切换到英文',
    'brand.monitor': '监控',
    'nav.github': 'GitHub',
    'nav.backend': '后端',
    'nav.official': '官方',
    'nav.custom': '自定义',
    'nav.admin': '管理',
    'nav.home': '首页',
    'nav.logout': '退出',
    'nav.control': '控制台',
    'nav.adminDashboard': '管理面板',
    'nav.officialBackend': '官方后端',
    'nav.customBackend': '自定义后端',
    'common.error': '错误',
    'common.success': '成功',
    'common.loading': '加载中...',
    'common.optional': '可选',
    'common.step': '第 {current}/{total} 步',
    'common.stepShort': '步骤 {current}',
    'common.unknownTitle': '未知标题',
    'common.unknownVenue': '未知会议',
    'common.paperTitle': '论文标题',
    'common.conferenceVenue': '会议 / 会场',
    'common.authors': '作者',
    'common.paperId': '论文 ID',
    'common.confirm': '确认',
    'common.checking': '检查中...',
    'common.review': '评审',
    'common.decision': '决定',
    'common.sent': '已发送',
    'common.pending': '待发送',
    'home.hero.badge': '全天候 OpenReview 监控',
    'home.hero.title': '第一时间获取评审结果。',
    'home.hero.subtitle':
      'OpenReview Monitor 24/7 跟踪投稿，第一时间发送评审与决定提醒，并通过开源可自托管保持透明。',
    'home.hero.tag.monitoring': '24/7 监控',
    'home.hero.tag.auditable': '开源可审计',
    'home.hero.tag.security': '可自托管更安全',
    'home.hero.tag.alerts': '评审与决定提醒',
    'home.feature.alwaysOn.title': '全天候监控',
    'home.feature.alwaysOn.body': '我们按照会议节奏 24/7 轮询，确保快速提醒而不打扰。',
    'home.feature.openSource.title': '开源且安全',
    'home.feature.openSource.body': '可审计代码，自托管后端，凭据尽在掌控。',
    'home.feature.details.title': '完整评审细节',
    'home.feature.details.body': '评分、信心、优缺点等评审细节直达邮箱。',
    'home.steps.1.title': '粘贴论文链接',
    'home.steps.1.body': '添加 OpenReview 链接或论文 ID。部分会议需要登录，凭据可选。',
    'home.steps.2.title': '确认信息',
    'home.steps.2.body': '在订阅前确认论文标题、会议信息和作者。',
    'home.steps.3.title': '接收通知',
    'home.steps.3.body': '评审或决定发布即收到邮件提醒。',
    'home.callout.credentials.title': '凭据可选',
    'home.callout.credentials.body':
      '部分会议需要登录查看评审或决定。如提供凭据，我们仅用于获取论文状态。更安全可控的方式是自托管开源后端。',
    'home.callout.teams.title': '面向团队',
    'home.callout.teams.body': '多个订阅者可关注同一论文并各自设置通知偏好。',
    'home.callout.teams.tip': '提示：共享一个后端，让每个人设置自己的邮件提醒。',
    'home.footer.tagline': 'OpenReview Monitor - 随时掌握论文进展',
    'paperForm.title': '监控论文',
    'paperForm.description': '粘贴 OpenReview 链接或论文 ID。部分会议需要登录，凭据可选。',
    'paperForm.openreviewUrl.label': 'OpenReview 链接或论文 ID',
    'paperForm.openreviewUrl.placeholder': 'https://openreview.net/forum?id=xxx',
    'paperForm.credentials.title': 'OpenReview 凭据',
    'paperForm.credentials.helper':
      '私有论文或受限会议需要登录。凭据仅用于获取论文状态。风险自负。更安全可控的方式是自托管后端。',
    'paperForm.credentials.username.label': 'OpenReview 用户名',
    'paperForm.credentials.username.placeholder': 'your@email.com',
    'paperForm.credentials.password.label': 'OpenReview 密码',
    'paperForm.credentials.password.placeholder': '你的 OpenReview 密码',
    'paperForm.credentials.show': '添加凭据',
    'paperForm.credentials.hide': '隐藏凭据',
    'paperForm.fetch': '获取论文信息',
    'paperForm.confirm.title': '确认论文信息',
    'paperForm.confirm.subtitle': '请确认以下信息',
    'paperForm.info.senderConfigured.prefix': '通知邮件将由',
    'paperForm.info.senderConfigured.suffix': '发送。请将该地址加入白名单以免错过更新。',
    'paperForm.info.senderMissing':
      '尚未配置发件人邮箱。请联系管理员设置 From 邮箱以确保通知送达。',
    'paperForm.email.label': '你的邮箱地址',
    'paperForm.email.placeholder': 'your@email.com',
    'paperForm.verification.send': '发送验证码',
    'paperForm.verification.resend': '重新发送验证码',
    'paperForm.verification.expires': '验证码 {minutes} 分钟后过期。',
    'paperForm.verification.label': '验证码',
    'paperForm.verification.placeholder': '6 位验证码',
    'paperForm.preferences.title': '通知偏好',
    'paperForm.preferences.review': '有评审可用时通知我',
    'paperForm.preferences.reviewModified': '评审更新时通知我',
    'paperForm.preferences.decision': '最终决定公布时通知我',
    'paperForm.confirm.subscribe': '确认并订阅',
    'paperForm.success.title': '订阅已生效',
    'paperForm.success.body.prefix': '当以下论文有更新时，我们会发送通知到',
    'paperForm.success.body.suffix': '：',
    'paperForm.success.sender.prefix': '邮件将由',
    'paperForm.success.sender.suffix': '发送，请加入白名单。',
    'paperForm.success.monitorAnother': '继续监控另一篇',
    'paperForm.toast.verificationFailed': '验证码发送失败',
    'paperForm.toast.verificationSent': '验证码已发送',
    'paperForm.toast.checkEmail': '请查看 {email} 获取验证码。',
    'backend.title': '后端设置',
    'backend.description': '选择用于 API 请求的后端服务器。两种模式均可使用。',
    'backend.tab.official': '官方',
    'backend.tab.custom': '自定义',
    'backend.custom.label': '自定义后端地址',
    'backend.custom.placeholder': 'https://your-backend.example.com',
    'backend.custom.help': '若缺少将自动追加 /api。点击确认以应用。',
    'backend.custom.normalized.prefix': '规范化地址：',
    'backend.custom.warning':
      '添加未知后端可能暴露你的凭据。推荐自托管或使用官方后端。非自有后端存在泄露风险，谨慎使用。',
    'backend.currentBase.prefix': '当前 API 地址：',
    'backend.officialBase.prefix': '官方后端：',
    'backend.toast.officialTitle': '已使用官方后端',
    'backend.toast.customTitle': '已使用自定义后端',
    'backend.toast.baseSet': 'API 地址已设置为 {base}',
    'backend.error.invalidBase': '请输入有效的地址，例如 http://localhost:8000',
    'backend.error.healthFailed': '健康检查失败（HTTP {status}）。',
    'backend.error.timeout': '健康检查超时，请确认后端地址。',
    'backend.error.unreachable': '无法连接到后端，请确认地址。',
    'backend.sameOrigin': '同源（{base}）',
    'adminLogin.title': '管理员登录',
    'adminLogin.description': '输入管理员密码以进入面板',
    'adminLogin.password.label': '密码',
    'adminLogin.password.placeholder': '输入管理员密码',
    'adminLogin.submit': '登录',
    'adminLogin.toast.failed': '登录失败',
    'adminLogin.toast.success': '登录成功',
    'admin.tabs.papers': '论文',
    'admin.tabs.subscribers': '订阅者',
    'admin.tabs.config': '配置',
    'admin.subscribers.title': '订阅者',
    'admin.subscribers.description': '管理订阅者及通知状态',
    'admin.subscribers.none': '暂无订阅者',
    'admin.subscribers.paper': '论文：{title}',
    'admin.subscribers.reviewStatus': '评审 {status}',
    'admin.subscribers.decisionStatus': '决定 {status}',
    'admin.subscribers.reviewChanges': '评审更新提醒',
    'admin.subscribers.resetTitle': '重置通知状态',
    'admin.subscribers.confirmDelete': '确定要删除该订阅者吗？',
    'admin.toast.subscriberDeleted': '订阅者已删除',
    'admin.toast.notificationReset': '通知状态已重置',
    'admin.toast.configSaved': '配置已保存',
    'admin.toast.emailRequired': '请输入邮箱地址',
    'admin.toast.testEmailSent': '测试邮件已发送至 {email}',
    'admin.config.title': '系统配置',
    'admin.config.checkInterval.label': '检查间隔（分钟）',
    'admin.config.checkInterval.help': '多久检查一次论文更新',
    'admin.config.reviewModInterval.label': '评审修改检查间隔（分钟）',
    'admin.config.reviewModInterval.help': '多久检查一次已订阅论文的评审修改',
    'admin.config.smtp.title': 'SMTP 配置',
    'admin.config.smtp.host': 'SMTP 主机',
    'admin.config.smtp.port': 'SMTP 端口',
    'admin.config.smtp.user': 'SMTP 用户名',
    'admin.config.smtp.password': 'SMTP 密码',
    'admin.config.smtp.password.placeholder': '输入新密码以更新',
    'admin.config.smtp.fromEmail': '发件人邮箱',
    'admin.config.smtp.fromName': '发件人名称',
    'admin.config.smtp.fromName.placeholder': 'OpenReview Monitor',
    'admin.config.save': '保存配置',
    'admin.test.title': '测试邮件',
    'admin.test.description': '发送测试邮件以验证 SMTP 配置',
    'admin.test.recipient': '收件人邮箱',
    'admin.test.placeholder': 'your@email.com',
    'admin.test.send': '发送测试邮件',
    'admin.test.helper': '请先保存 SMTP 配置，再发送测试邮件。',
    'paperList.loading': '加载论文中...',
    'paperList.title': '监控中的论文',
    'paperList.refresh': '刷新',
    'paperList.checkAll': '立即检查全部',
    'paperList.none': '暂无监控论文',
    'paperList.venueCount': '（{count} 篇）',
    'paperList.subscriberCount': '{count} 位订阅者',
    'paperList.reviewSentTitle': '评审通知已发送',
    'paperList.reviewPendingTitle': '评审通知待发送',
    'paperList.decisionSentTitle': '决定通知已发送',
    'paperList.decisionPendingTitle': '决定通知待发送',
    'paperList.lastChecked': '上次检查：{date}',
    'paperList.confirmDelete': '确定要删除这篇论文及其所有订阅者吗？',
    'paperList.toast.deleted': '论文已删除',
    'paperList.toast.checkInitiated': '已开始检查论文，可能需要几分钟。',
    'paperList.status.pending': '待更新',
    'paperList.status.reviewed': '已评审',
    'paperList.status.accepted': '已录用',
    'paperList.status.rejected': '已拒绝',
    'paperList.status.decided': '已决定',
  },
} as const

type TranslationKey = keyof typeof translations.en

const interpolate = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

const getDefaultLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'
  const params = new URLSearchParams(window.location.search)
  const param = params.get('lang')
  if (param === 'en' || param === 'zh') return param
  const stored = window.localStorage.getItem('locale')
  if (stored === 'en' || stored === 'zh') return stored
  const nav = window.navigator.language.toLowerCase()
  if (nav.startsWith('zh')) return 'zh'
  return 'en'
}

type I18nContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  formatDateTime: (value: string | number | Date) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getDefaultLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('locale', next)
    }
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    }
  }, [locale])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = translations[locale][key] ?? translations.en[key] ?? String(key)
      return interpolate(template, vars)
    },
    [locale],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector)
      if (el) {
        el.setAttribute('content', content)
      }
    }

    document.title = t('seo.title')
    setMeta('meta[name="description"]', t('seo.description'))
    setMeta('meta[name="keywords"]', t('seo.keywords'))
    setMeta('meta[property="og:title"]', t('seo.ogTitle'))
    setMeta('meta[property="og:description"]', t('seo.ogDescription'))
    setMeta('meta[property="og:locale"]', locale === 'zh' ? 'zh_CN' : 'en_US')
    setMeta('meta[name="twitter:title"]', t('seo.twitterTitle'))
    setMeta('meta[name="twitter:description"]', t('seo.twitterDescription'))
  }, [locale, t])

  const formatDateTime = useCallback(
    (value: string | number | Date) => {
      const date = value instanceof Date ? value : new Date(value)
      const formatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
      return formatter.format(date)
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, formatDateTime }),
    [locale, setLocale, t, formatDateTime],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export type { Locale, TranslationKey }
