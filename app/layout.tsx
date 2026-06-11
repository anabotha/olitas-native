import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const BASE_URL = 'https://olitas.anabotha.dev/'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Olitas ',
  description: 'Condiciones del mar en tiempo real para surf, natación y SUP en Comodoro Rivadavia y la costa patagónica. Oleaje, viento y temperatura para tu próxima sesión.',
  keywords: [
    'condiciones del mar',
    'oleaje Comodoro Rivadavia',
    'surf Patagonia',
    'Rada Tilly mar',
    'viento Comodoro',
    'temperatura del mar',
    'SUP Patagonia',
    'natación Comodoro',
    'pronostico marino',
    'olitas',
    'mar',
    'sup',
    'surf',
    'natacion'
  ],
  authors: [{ name: 'Olitas' }],
  creator: 'Olitas',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: BASE_URL,
    siteName: 'Olitas',
    title: 'Olitas — ¿Cómo está el mar hoy?',
    description: 'Condiciones del mar en tiempo real para surf, natación y SUP en la costa patagónica. Oleaje, viento y temperatura al instante.',
    images: [
      {
        url: '/android/launchericon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Olitas — Condiciones del mar en Patagonia',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Olitas — ¿Cómo está el mar hoy?',
    description: 'Condiciones del mar en tiempo real para surf, natación y SUP en la costa patagónica.',
    images: ['/android/launchericon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/android/launchericon-144x144.png' },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Olitas',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
    <html lang="es-AR">
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
