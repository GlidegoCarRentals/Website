import { redirect } from 'next/navigation';
import GuestProfileDashboard from '@/components/profile/GuestProfileDashboard';
import { getGuestDashboardData } from '@/lib/profile/queries';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

export default async function AccountProfilePage() {
  const { user } = await requireAuthenticatedUser();

  if (!user) {
    redirect('/login?redirect=/account/profile');
  }

  const data = await getGuestDashboardData(user.id);
  if (!data) {
    redirect('/login?redirect=/account/profile');
  }

  return <GuestProfileDashboard data={data} />;
}
