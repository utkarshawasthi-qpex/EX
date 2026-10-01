import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensures correct file tracing when a nested copy exists under percussion-project/
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config, { isServer, webpack }) => {
    const editorEntry = path.resolve(
      __dirname,
      'node_modules/@npm-questionpro/wick-ui-editor/dist/wick-ui-editor/es/index.js',
    )
    const tiptapReact = path.resolve(__dirname, 'src/lib/tiptapReact.ts')
    config.plugins = [
      ...(config.plugins ?? []),
      // Package exports only the "import" condition, which this webpack build does not match.
      new webpack.NormalModuleReplacementPlugin(/^@npm-questionpro\/wick-ui-editor$/, editorEntry),
      new webpack.NormalModuleReplacementPlugin(/^@tiptap\/react$/, tiptapReact),
    ]

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
