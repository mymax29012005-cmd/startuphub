import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/contexts/SessionContext";
import { I18nProvider } from "@/i18n/I18nProvider";

export const metadata: Metadata = {
  title: {
    default: "StartupHub",
    template: "%s | StartupHub",
  },
  description: "Premium marketplace of startups, ideas and investment requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <SessionProvider>
            <AppShell>{children}</AppShell>
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
