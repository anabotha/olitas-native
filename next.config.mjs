import withPWA from '@ducanh2912/next-pwa'

// const withPWAConfig = withPWA({
//   dest: 'public',
//   cacheOnFrontEndNav: true,
//   aggressiveFrontEndNavCaching: true,
//   reloadOnOnline: true,
//   disable: process.env.NODE_ENV === 'development',
// })

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   turbopack: {},  // ← acá, no dentro de withPWA
//   // el resto de tu config actual
// }

// export default withPWAConfig(nextConfig)
const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  clientsClaim: true
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}
}

export default withPWAConfig(nextConfig)