import type { Metadata } from "next"
import { DM_Sans, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "SemanticZap Admin",
  description: "Painel de administração dos agentes SemanticZap",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html
        lang="pt-BR"
        className={`${dmSans.variable} ${jetbrainsMono.variable} h-full`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  )
}
