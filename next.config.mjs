import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      const browserEmptyModule = path.resolve(__dirname, 'src/lib/browserEmptyModule.ts')

      config.plugins = [
        ...(config.plugins ?? []),
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|https)$/, browserEmptyModule),
      ]

      config.resolve = config.resolve ?? {}
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        fs: false,
        'node:fs': false,
        https: false,
        'node:https': false,
        path: false,
        os: false,
        express: false,
        'image-size': false,
      }
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        'node:fs': false,
        https: false,
        'node:https': false,
        path: false,
        os: false,
      }
    }

    return config
  },
}

export default nextConfig;
