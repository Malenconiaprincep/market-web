import './globals.css'

import { Providers } from './providers.jsx'

export const metadata = {
  title: 'ALPHA QUANT EMOTION HUB',
  description: 'A-Share Market Sentiment',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
