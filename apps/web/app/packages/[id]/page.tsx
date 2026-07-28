import { WorkspaceClient } from '../../../components/workspace-client';
import { getApiOrigin } from '../../../lib/runtime-config';

export const dynamic = 'force-dynamic';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceClient apiOrigin={getApiOrigin()} contentPackageId={id} />;
}
