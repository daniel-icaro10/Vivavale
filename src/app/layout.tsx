import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { InstallPrompt } from "@/components/shared/InstallPrompt";
import { PerformanceProvider } from "@/features/shared/components/PerformanceProvider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFAFF",
};

export const metadata: Metadata = {
  title: {
    default: "VivaLeve",
    template: "%s | VivaLeve",
  },
  description:
    "Acompanhamento gentil para pessoas com fibromialgia e dores crônicas.",
  applicationName: "VivaLeve",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VivaLeve",
    startupImage: [],
  },
  icons: {
    apple: [{ url: "/icon.svg", sizes: "any" }],
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "VivaLeve",
    title: "VivaLeve",
    description:
      "Acompanhamento gentil para pessoas com fibromialgia e dores crônicas.",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary",
    title: "VivaLeve",
    description:
      "Acompanhamento gentil para pessoas com fibromialgia e dores crônicas.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PerformanceProvider />
        <ServiceWorkerRegistration />
        <OfflineBanner />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}
