import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { SessionTimeout } from "@/components/app/SessionTimeout";
import { PwaProvider } from "@/components/app/PwaProvider";
import { IntentProvider } from "@/lib/context/IntentContext";
import { PortfolioProvider } from "@/lib/hooks/usePortfolio";
import { ChaptersProvider } from "@/lib/context/ChaptersContext";
import { NotificationsProvider } from "@/lib/context/NotificationsContext";
import { EmployerProvider } from "@/lib/context/EmployerContext";
import { SavedCandidatesProvider } from "@/lib/context/SavedCandidatesContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Career OS — Navigate your career with intent",
  description:
    "Career OS is the candidate-centered career intelligence platform. See where you stand, where you can go, and what to do next.",
  // PWA (Feature 11): standalone launch on iOS; manifest + icons come
  // from the app/manifest.ts and app/apple-icon.tsx file conventions.
  appleWebApp: {
    capable: true,
    title: "Career OS",
    statusBarStyle: "black-translucent",
  },
};

// Mobile pass: explicit, responsive viewport (no forced zoom lock).
// themeColor matches the dark app ground (dark-mode-only app).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d14",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <SessionTimeout />
          <PwaProvider />
          <IntentProvider>
            <NotificationsProvider>
              <PortfolioProvider>
                <ChaptersProvider>
                  <EmployerProvider>
                    <SavedCandidatesProvider>
                      {children}
                    </SavedCandidatesProvider>
                  </EmployerProvider>
                </ChaptersProvider>
              </PortfolioProvider>
            </NotificationsProvider>
          </IntentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
