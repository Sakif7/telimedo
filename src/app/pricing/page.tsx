import { UnderConstruction, underConstructionMetadata } from '@/components/sections/under-construction/UnderConstruction';

export const metadata = underConstructionMetadata('pricing');

export default function PricingPage() {
  return <UnderConstruction slug="pricing" />;
}
