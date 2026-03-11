import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: 'Olitas - ¿Como esta hoy?',
  description: 'Oleaje, viento y temperatura para tu proxima sesion.',
  icons: {
    icon: [
      { url: '/android/launchericon-144x144.png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Olitas',
  }
}

export const viewport: Viewport = {
  themeColor: '#4a90a4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>

        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${dmSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <main>

          {children}
          <Analytics />
        </main>
      </body>
    </html>
  )
}
