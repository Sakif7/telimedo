import { RuntimeProvider } from '@/components/providers/RuntimeProvider';
import { BookDemo } from '@/components/sections/book-demo/BookDemo';
import { Faq } from '@/components/sections/faq/Faq';
import { Hero } from '@/components/sections/hero/Hero';
import { LogoStrip } from '@/components/sections/logo-strip/LogoStrip';
import { Manifesto } from '@/components/sections/manifesto/Manifesto';
import { Pricing } from '@/components/sections/pricing/Pricing';
import { Product } from '@/components/sections/product/Product';
import { Results } from '@/components/sections/results/Results';
import { Security } from '@/components/sections/security/Security';
import { Solutions } from '@/components/sections/solutions/Solutions';
import { SayHi } from '@/components/studio/SayHi';
import { Story } from '@/components/story/Story';
import { brand } from '@/lib/brand';

export default function Home() {
  return (
    <RuntimeProvider brand={brand.raw}>
      <main id="main">
        <Hero />
        <LogoStrip />
        <Manifesto />
        <Story markSvg={brand.mark} />
        <Product />
        <Solutions />
        <Results />
        <Security />
        <Pricing />
        <Faq />
        <BookDemo />
      </main>
      <SayHi />
    </RuntimeProvider>
  );
}
