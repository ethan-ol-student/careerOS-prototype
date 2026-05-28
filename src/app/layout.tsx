import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
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
        <IntentProvider>
          <NotificationsProvider>
            <PortfolioProvider>
              <ChaptersProvider>
                <EmployerProvider>
                  <SavedCandidatesProvider>{children}</SavedCandidatesProvider>
                </EmployerProvider>
              </ChaptersProvider>
            </PortfolioProvider>
          </NotificationsProvider>
        </IntentProvider>
      </body>
    </html>
  );
}
