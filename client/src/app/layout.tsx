import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AppShell } from "@/components/AppShell";

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
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
