import { LoginClient } from '../../components/login-client';
import { getApiOrigin } from '../../lib/runtime-config';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginClient apiOrigin={getApiOrigin()} />;
}
