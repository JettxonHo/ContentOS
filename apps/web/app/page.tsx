import { DashboardClient } from '../components/dashboard-client';
import { getApiOrigin } from '../lib/runtime-config';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const query = await searchParams;
  return <DashboardClient apiOrigin={getApiOrigin()} initialView={query.view === 'archived' ? 'archived' : 'active'} />;
}
