import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { buildOrganizationJsonLd, buildSiteMetadata, resolveSiteVariantFromHost } from './metadata'
import { UIPreferenceProvider } from '@/components/ui-preference-provider'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  return buildSiteMetadata(resolveSiteVariantFromHost(host))
}

const preferenceBootScript = `
(() => {
  try {
    const languageKey = 'sk-ui-language';
    const themeModeKey = 'sk-ui-theme-mode';
    const language = localStorage.getItem(languageKey) === 'en' ? 'en' : 'zh';
    const themeModeRaw = localStorage.getItem(themeModeKey);
    const themeMode = themeModeRaw === 'light' || themeModeRaw === 'dark' || themeModeRaw === 'system'
      ? themeModeRaw
      : 'system';
    const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;
    const root = document.documentElement;
    root.lang = language === 'en' ? 'en' : 'zh-CN';
    root.dataset.uiLanguage = language;
    root.dataset.themeMode = themeMode;
    root.dataset.themeResolved = resolvedTheme;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  } catch (error) {
    void error;
  }
})();
`

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const requestHeaders = headers()
  const nonce = requestHeaders.get('x-nonce') || undefined
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const organizationJsonLd = buildOrganizationJsonLd(resolveSiteVariantFromHost(host))

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: preferenceBootScript }} />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <UIPreferenceProvider>
          {children}
          <Toaster />
        </UIPreferenceProvider>
      </body>
    </html>
  )
}
