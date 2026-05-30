import type { Metadata } from 'next'
import { Lora, DM_Sans } from 'next/font/google'
import Nav from '@/components/Nav/Nav'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ToastProvider } from '@/components/Toast/ToastProvider'
import '@/styles/globals.scss'

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Recipes',
  description: 'A personal recipe collection.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(_){}`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Nav />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
