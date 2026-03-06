import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata = {
  title: 'Collab Sheets',
  description: 'Real-time collaborative spreadsheet built with Next.js and Firebase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
