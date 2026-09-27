import { UnderConstruction, underConstructionMetadata } from '@/components/sections/under-construction/UnderConstruction';

export const metadata = underConstructionMetadata('product');

export default function ProductPage() {
  return <UnderConstruction slug="product" />;
}
