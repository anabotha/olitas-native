import type { Metadata, Viewport } from 'next'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Script from 'next/script'
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
    'natacion',
    'olitas comodoro rivadavia',
    'ana botha'
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

const jsonLdWebApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Olitas',
  url: BASE_URL,
  description: 'Condiciones del mar en tiempo real para surf, natación y SUP en Comodoro Rivadavia y la costa patagónica. Oleaje, viento y temperatura al instante.',
  applicationCategory: 'WeatherApplication',
  operatingSystem: 'Web, Android, iOS',
  inLanguage: 'es-AR',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ARS',
  },
  author: {
    '@type': 'Person',
    name: 'Josefina Botha',
    email: 'josefinabotha@gmail.com',
  },
  featureList: [
    'Oleaje en tiempo real',
    'Velocidad y dirección del viento',
    'Temperatura del agua',
    'Pronóstico por hora',
    'Estado de la marea',
    'Recomendaciones para surf, SUP y natación',
  ],
  screenshot: `${BASE_URL}/android/launchericon-512x512.png`,
  image: `${BASE_URL}/android/launchericon-512x512.png`,
}

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Olitas',
  url: BASE_URL,
  description: 'Condiciones del mar en tiempo real para la costa patagónica.',
  inLanguage: 'es-AR',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className={`${dmSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Script defer src="https://cloud.umami.is/script.js" data-website-id="0966ee62-a7e2-4823-a307-0c8a3626e9e2"  data-domains="olitas.anabotha.dev"
  strategy="afterInteractive"/>
        <main>

          {children}
          <Analytics />
        </main>
      </body>
    </html>
  )
}
