import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Mono, Figtree } from 'next/font/google';
import { site } from '@/content/site';
import { siteUrl } from '@/lib/site-url';
import '@/styles/tokens.css';
import '@/styles/globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.meta.title,
  description: site.meta.description,
  applicationName: site.meta.siteName,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: site.meta.siteName,
    title: site.meta.title,
    description: site.meta.description,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title: site.meta.title, description: site.meta.description },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F6F7' },
    { media: '(prefers-color-scheme: dark)', color: '#071116' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Entrance animations only run when scripts do; nothing waits hidden without JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip" href="#main">
          {site.a11y.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
