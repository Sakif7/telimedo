import { UnderConstruction, underConstructionMetadata } from '@/components/sections/under-construction/UnderConstruction';

export const metadata = underConstructionMetadata('security');

export default function SecurityPage() {
  return <UnderConstruction slug="security" />;
}
