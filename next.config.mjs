import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** 避免上层目录存在其它 lockfile 时被误判为 monorepo 根目录 */
  outputFileTracingRoot: __dirname,
}

export default nextConfig
