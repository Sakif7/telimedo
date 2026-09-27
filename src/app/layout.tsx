import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Mono, Figtree } from 'next/font/google';
import { site } from '@/content/site';
import { Doors } from '@/components/layout/Doors';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PageTransitions } from '@/components/layout/PageTransitions';
import { brand } from '@/lib/brand';
import { siteUrl } from '@/lib/site-url';
import '@/styles/tokens.css';
import '@/styles/globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.meta.title, template: `%s | ${site.meta.siteName}` },
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

/* Before first paint: mark that scripts run (entrance animations only play then;
   nothing waits hidden without JS), apply a theme the visitor picked earlier, and
   skip the doors when motion is reduced or they already opened in this tab
   (sessionStorage), unless the URL asks for them again with ?doors. */
const BOOT = `(function(){var d=document.documentElement,c=d.classList;c.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')d.setAttribute('data-theme',t)}catch(e){}try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches,f=/[?&]doors\\b/.test(location.search);if(r||(!f&&sessionStorage.getItem('telimedo:doors')))c.add('doors-open','doors-done')}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>
        <a className="skip" href="#main">
          {site.a11y.skip}
        </a>
        <Doors wordmark={brand.wordmark} />
        <Header wordmark={brand.wordmark} />
        {children}
        <Footer wordmarkMono={brand.wordmarkMono} year={new Date().getFullYear()} />
        <PageTransitions />
      </body>
    </html>
  );
}
