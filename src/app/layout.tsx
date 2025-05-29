import type {Metadata, Viewport} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gastronomic Gatherer',
  description: 'Restaurant Billing System by Firebase Studio',
  manifest: '/manifest.json', // Link to the manifest file
};

export const viewport: Viewport = {
  themeColor: '#FF9933', // Matches theme_color in manifest
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* The manifest link is now handled by Next.js Metadata API */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
        {/* It's good practice to also have a meta theme-color tag */}
        <meta name="theme-color" content="#FF9933" />
        <link rel="apple-touch-icon" href="https://placehold.co/apple-touch-icon.png" />

      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
        <Script
          id="service-worker-registration"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('Service Worker registered: ', registration.scope))
                    .catch(registrationError => console.log('Service Worker registration failed: ', registrationError));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
