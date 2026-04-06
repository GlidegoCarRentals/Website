import { redirect } from 'next/navigation';
import HostProfileDashboard from '@/components/profile/HostProfileDashboard';
import { getHostDashboardData } from '@/lib/profile/queries';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export default async function HostDashboardPage() {
  const { user, supabase } = await requireAuthenticatedUser();

  if (!user) {
    redirect('/login?redirect=/host/dashboard');
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile || !['host', 'admin'].includes(profile.role)) {
    redirect('/login?redirect=/host/dashboard');
  }

  const data = await getHostDashboardData(user.id);
  if (!data) {
    redirect('/login?redirect=/host/dashboard');
  }

  return <HostProfileDashboard data={data} />;
}
