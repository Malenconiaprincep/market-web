import './globals.css'

export const metadata = {
  title: 'ALPHA QUANT EMOTION HUB',
  description: 'A-Share Market Sentiment',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
