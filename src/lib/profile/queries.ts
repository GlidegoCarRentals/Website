import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { GuestDashboardData, HostDashboardData } from '@/lib/profile/types';

function formatBookingRow(row: any) {
  return {
    id: row.id,
    bookingReference: row.booking_reference,
    status: row.status,
    paymentStatus: row.payment_status,
    startDate: row.start_date,
    endDate: row.end_date,
    tripDays: row.trip_days,
    totalAmount: Number(row.total_amount || 0),
    hostEarningsAmount: Number(row.host_earnings_amount || 0),
    pickupLocation: row.pickup_location,
    returnLocation: row.return_location,
    car: row.cars
      ? {
          id: row.cars.id,
          make: row.cars.make,
          model: row.cars.model,
          photos: Array.isArray(row.cars.photos) ? row.cars.photos : [],
          locationName: row.cars.location_name,
          priceDaily: row.cars.price_daily,
          status: row.cars.status,
          instantBook: row.cars.instant_book,
        }
      : null,
    guest: row.guest
      ? {
          id: row.guest.id,
          fullName: row.guest.full_name,
          avatarUrl: row.guest.avatar_url,
          trustScore: row.guest.trust_score,
          averageRating: row.guest.average_rating,
          totalTrips: row.guest.total_trips,
          driverLicenceStatus: row.guest.driver_licence_status,
        }
      : null,
    host: row.host
      ? {
          id: row.host.id,
          fullName: row.host.full_name,
          avatarUrl: row.host.avatar_url,
          trustScore: row.host.trust_score,
        }
      : null,
  };
}

const guestBookingSelect = `
  id,
  booking_reference,
  status,
  payment_status,
  start_date,
  end_date,
  trip_days,
  total_amount,
  host_earnings_amount,
  pickup_location,
  return_location,
  cars:car_id (
    id,
    make,
    model,
    photos,
    location_name,
    price_daily,
    status,
    instant_book
  ),
  host:host_id (
    id,
    full_name,
    avatar_url,
    trust_score
  )
`;

const hostBookingSelect = `
  id,
  booking_reference,
  status,
  payment_status,
  start_date,
  end_date,
  trip_days,
  total_amount,
  host_earnings_amount,
  pickup_location,
  return_location,
  cars:car_id (
    id,
    make,
    model,
    photos,
    location_name,
    price_daily,
    status,
    instant_book
  ),
  guest:guest_id (
    id,
    full_name,
    avatar_url,
    trust_score,
    average_rating,
    total_trips,
    driver_licence_status
  ),
  host:host_id (
    id,
    full_name,
    avatar_url,
    trust_score
  )
`;

export async function getGuestDashboardData(userId: string): Promise<GuestDashboardData | null> {
  const supabase = await createServerSupabaseClient();

  const [
    userResult,
    guestProfileResult,
    notificationResult,
    securityResult,
    walletResult,
    bookingsResult,
    favouritesResult,
    reviewsResult,
    paymentMethodsResult,
    paymentsResult,
    walletTransactionsResult,
    trustEventsResult,
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('guest_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('user_notification_preferences').select('*').eq('user_id', userId).single(),
    supabase.from('user_security_settings').select('*').eq('user_id', userId).single(),
    supabase.from('user_wallets').select('*').eq('user_id', userId).single(),
    supabase
      .from('bookings')
      .select(guestBookingSelect)
      .eq('guest_id', userId)
      .order('start_date', { ascending: true }),
    supabase
      .from('favourites')
      .select(`
        created_at,
        cars:car_id (
          id,
          make,
          model,
          photos,
          location_name,
          price_daily,
          avg_rating,
          total_trips,
          fuel_type,
          transmission
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        body,
        target_type,
        created_at,
        host_response,
        reviewee:reviewee_id (id, full_name),
        cars:car_id (id, make, model)
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('saved_payment_methods').select('*').eq('user_id', userId).order('is_default', { ascending: false }),
    supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        status,
        type,
        created_at,
        bookings:booking_id (
          id,
          booking_reference,
          car_id,
          cars:car_id (make, model)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('user_trust_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
  ]);

  if (userResult.error || !userResult.data) {
    return null;
  }

  const user = userResult.data;
  const bookings = (bookingsResult.data || []).map(formatBookingRow);

  return {
    user: {
      id: user.id,
      fullName: user.full_name || 'Guest',
      email: user.email || '',
      phone: user.phone || null,
      avatarUrl: user.avatar_url || null,
      role: user.role || 'guest',
      city: user.city || null,
      countryCode: user.country_code || null,
      emailVerified: Boolean(user.email_verified),
      phoneVerified: Boolean(user.phone_verified),
      identityStatus: user.identity_status || 'not_started',
      driverLicenceStatus: user.driver_licence_status || 'not_started',
      trustScore: Number(user.trust_score || 0),
      averageRating: user.average_rating ? Number(user.average_rating) : null,
      totalTrips: Number(user.total_trips || 0),
      createdAt: user.created_at || new Date().toISOString(),
    },
    guestProfile: guestProfileResult.data
      ? {
          emergencyContactName: guestProfileResult.data.emergency_contact_name,
          emergencyContactPhone: guestProfileResult.data.emergency_contact_phone,
          walletBalance: Number(guestProfileResult.data.wallet_balance || 0),
          lifetimeSpend: Number(guestProfileResult.data.lifetime_spend || 0),
          referralCompletedCount: Number(guestProfileResult.data.referral_completed_count || 0),
        }
      : null,
    notificationPreferences: notificationResult.data
      ? {
          emailTripUpdates: Boolean(notificationResult.data.email_trip_updates),
          emailMarketing: Boolean(notificationResult.data.email_marketing),
          emailPromotions: Boolean(notificationResult.data.email_promotions),
          smsTripUpdates: Boolean(notificationResult.data.sms_trip_updates),
          smsSecurityAlerts: Boolean(notificationResult.data.sms_security_alerts),
          pushTripUpdates: Boolean(notificationResult.data.push_trip_updates),
          pushMessages: Boolean(notificationResult.data.push_messages),
        }
      : null,
    security: securityResult.data
      ? {
          twoFactorEnabled: Boolean(securityResult.data.two_factor_enabled),
          loginAlerts: Boolean(securityResult.data.login_alerts),
          activeSessionCount: Number(securityResult.data.active_session_count || 0),
          lastPasswordResetAt: securityResult.data.last_password_reset_at,
        }
      : null,
    wallet: walletResult.data
      ? {
          balance: Number(walletResult.data.balance || 0),
          promoCreditBalance: Number(walletResult.data.promo_credit_balance || 0),
          referralCreditBalance: Number(walletResult.data.referral_credit_balance || 0),
        }
      : null,
    upcomingTrips: bookings.filter((booking) => ['pending', 'awaiting_payment', 'confirmed'].includes(booking.status)),
    activeTrips: bookings.filter((booking) => booking.status === 'active'),
    pastTrips: bookings.filter((booking) => booking.status === 'completed'),
    cancelledTrips: bookings.filter((booking) => ['cancelled', 'declined', 'expired', 'no_show'].includes(booking.status)),
    favourites: (favouritesResult.data || [])
      .map((row) => {
        const car = Array.isArray(row.cars) ? row.cars[0] : row.cars;
        return {
          savedAt: row.created_at,
          car,
        };
      })
      .filter((row) => row?.car?.id),
    reviews: reviewsResult.data || [],
    paymentMethods: paymentMethodsResult.data || [],
    paymentHistory: paymentsResult.data || [],
    walletTransactions: walletTransactionsResult.data || [],
    trustEvents: trustEventsResult.data || [],
  };
}

export async function getHostDashboardData(userId: string): Promise<HostDashboardData | null> {
  const supabase = await createServerSupabaseClient();

  const [
    userResult,
    hostProfileResult,
    notificationResult,
    fleetResult,
    bookingsResult,
    reviewsResult,
    payoutsResult,
    analyticsResult,
    conversationsResult,
    aiInsightsResult,
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('host_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('user_notification_preferences').select('*').eq('user_id', userId).single(),
    supabase
      .from('cars')
      .select(`
        id,
        make,
        model,
        photos,
        location_name,
        price_daily,
        status,
        available,
        instant_book,
        avg_rating,
        total_trips,
        total_views,
        created_at
      `)
      .eq('host_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select(hostBookingSelect)
      .eq('host_id', userId)
      .order('start_date', { ascending: true }),
    supabase
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        body,
        created_at,
        host_response,
        reviewer:reviewer_id (id, full_name, avatar_url),
        cars:car_id (id, make, model)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('payouts').select('*').eq('host_id', userId).order('created_at', { ascending: false }).limit(12),
    supabase
      .from('host_vehicle_analytics_daily')
      .select('*')
      .eq('host_id', userId)
      .order('activity_date', { ascending: false })
      .limit(90),
    supabase
      .from('conversations')
      .select(`
        id,
        booking_id,
        last_message_at,
        guest:guest_id (id, full_name, avatar_url),
        car:car_id (id, make, model),
        messages (
          id,
          body,
          is_read,
          sender_id,
          created_at
        )
      `)
      .eq('host_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(8),
    supabase.from('host_ai_insights').select('*').eq('host_id', userId).order('generated_at', { ascending: false }).limit(6),
  ]);

  if (userResult.error || !userResult.data) {
    return null;
  }

  const bookings = (bookingsResult.data || []).map(formatBookingRow);
  const analyticsRows = analyticsResult.data || [];
  const totals = analyticsRows.reduce(
    (acc, row) => {
      acc.totalViews += Number(row.view_count || 0);
      acc.totalBookingRequests += Number(row.booking_requests || 0);
      acc.totalConfirmedBookings += Number(row.confirmed_bookings || 0);
      acc.totalRevenue += Number(row.revenue_amount || 0);
      return acc;
    },
    {
      totalViews: 0,
      totalBookingRequests: 0,
      totalConfirmedBookings: 0,
      totalRevenue: 0,
    }
  );

  const analyticsPerCarMap = new Map<string, any>();
  analyticsRows.forEach((row) => {
    const existing = analyticsPerCarMap.get(row.car_id) || {
      carId: row.car_id,
      totalViews: 0,
      totalBookingRequests: 0,
      totalConfirmedBookings: 0,
      totalRevenue: 0,
      avgUtilizationRate: 0,
      samples: 0,
    };

    existing.totalViews += Number(row.view_count || 0);
    existing.totalBookingRequests += Number(row.booking_requests || 0);
    existing.totalConfirmedBookings += Number(row.confirmed_bookings || 0);
    existing.totalRevenue += Number(row.revenue_amount || 0);
    existing.avgUtilizationRate += Number(row.utilization_rate || 0);
    existing.samples += 1;
    analyticsPerCarMap.set(row.car_id, existing);
  });

  const fleet = fleetResult.data || [];
  const analyticsPerCar = fleet.map((car) => {
    const stats = analyticsPerCarMap.get(car.id) || {
      totalViews: 0,
      totalBookingRequests: 0,
      totalConfirmedBookings: 0,
      totalRevenue: 0,
      avgUtilizationRate: 0,
      samples: 0,
    };

    const averageUtilization = stats.samples > 0 ? stats.avgUtilizationRate / stats.samples : 0;
    return {
      car,
      totalViews: stats.totalViews,
      totalBookingRequests: stats.totalBookingRequests,
      totalConfirmedBookings: stats.totalConfirmedBookings,
      totalRevenue: stats.totalRevenue,
      conversionRate: stats.totalViews > 0 ? (stats.totalConfirmedBookings / stats.totalViews) * 100 : 0,
      avgUtilizationRate: averageUtilization,
    };
  });

  const user = userResult.data;
  return {
    user: {
      id: user.id,
      fullName: user.full_name || 'Host',
      email: user.email || '',
      phone: user.phone || null,
      avatarUrl: user.avatar_url || null,
      role: user.role || 'host',
      city: user.city || null,
      countryCode: user.country_code || null,
      emailVerified: Boolean(user.email_verified),
      phoneVerified: Boolean(user.phone_verified),
      identityStatus: user.identity_status || 'not_started',
      driverLicenceStatus: user.driver_licence_status || 'not_started',
      trustScore: Number(user.trust_score || 0),
      averageRating: user.average_rating ? Number(user.average_rating) : null,
      totalTrips: Number(user.host_trips || 0),
      createdAt: user.created_at || new Date().toISOString(),
    },
    hostProfile: hostProfileResult.data
      ? {
          displayName: hostProfileResult.data.display_name,
          about: hostProfileResult.data.about,
          responseRate: Number(hostProfileResult.data.response_rate || 0),
          responseTimeMinutes: Number(hostProfileResult.data.response_time_minutes || 0),
          acceptanceRate: Number(hostProfileResult.data.acceptance_rate || 0),
          completionRate: Number(hostProfileResult.data.completion_rate || 0),
          onTimeRate: Number(hostProfileResult.data.on_time_rate || 0),
          superhostStatus: Boolean(hostProfileResult.data.superhost_status),
          instantBookingEnabled: Boolean(hostProfileResult.data.instant_booking_enabled),
          hostedTripCount: Number(hostProfileResult.data.hosted_trip_count || 0),
          totalEarnings: Number(hostProfileResult.data.total_earnings || 0),
          pendingPayoutAmount: Number(hostProfileResult.data.pending_payout_amount || 0),
        }
      : null,
    notificationPreferences: notificationResult.data
      ? {
          emailTripUpdates: Boolean(notificationResult.data.email_trip_updates),
          emailMarketing: Boolean(notificationResult.data.email_marketing),
          emailPromotions: Boolean(notificationResult.data.email_promotions),
          smsTripUpdates: Boolean(notificationResult.data.sms_trip_updates),
          smsSecurityAlerts: Boolean(notificationResult.data.sms_security_alerts),
          pushTripUpdates: Boolean(notificationResult.data.push_trip_updates),
          pushMessages: Boolean(notificationResult.data.push_messages),
          pushHostBookingRequests: Boolean(notificationResult.data.push_host_booking_requests),
        }
      : null,
    fleet,
    pendingBookings: bookings.filter((booking) => booking.status === 'pending'),
    upcomingBookings: bookings.filter((booking) => ['confirmed', 'awaiting_payment'].includes(booking.status)),
    activeBookings: bookings.filter((booking) => booking.status === 'active'),
    recentReviews: reviewsResult.data || [],
    payouts: payoutsResult.data || [],
    analytics: {
      totals: {
        fleetCount: fleet.length,
        activeVehicleCount: fleet.filter((car) => car.available).length,
        totalViews: totals.totalViews,
        totalBookingRequests: totals.totalBookingRequests,
        totalConfirmedBookings: totals.totalConfirmedBookings,
        totalRevenue: totals.totalRevenue,
        conversionRate: totals.totalViews > 0 ? (totals.totalConfirmedBookings / totals.totalViews) * 100 : 0,
      },
      perCar: analyticsPerCar,
    },
    conversations: (conversationsResult.data || []).map((row) => {
      const messages = row.messages || [];
      const lastMessage = messages.sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1))[0];
      return {
        id: row.id,
        bookingId: row.booking_id,
        lastMessageAt: row.last_message_at,
        guest: row.guest,
        car: row.car,
        unreadCount: messages.filter((message: any) => !message.is_read && message.sender_id !== userId).length,
        lastMessage,
      };
    }),
    aiInsights: aiInsightsResult.data || [],
  };
}
