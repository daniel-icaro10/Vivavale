import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
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
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
