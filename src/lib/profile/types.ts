export type Role = 'guest' | 'host' | 'admin';

export type GuestDashboardData = {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: Role;
    city: string | null;
    countryCode: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    identityStatus: string;
    driverLicenceStatus: string;
    trustScore: number;
    averageRating: number | null;
    totalTrips: number;
    createdAt: string;
  };
  guestProfile: {
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    walletBalance: number;
    lifetimeSpend: number;
    referralCompletedCount: number;
  } | null;
  notificationPreferences: {
    emailTripUpdates: boolean;
    emailMarketing: boolean;
    emailPromotions: boolean;
    smsTripUpdates: boolean;
    smsSecurityAlerts: boolean;
    pushTripUpdates: boolean;
    pushMessages: boolean;
  } | null;
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    activeSessionCount: number;
    lastPasswordResetAt: string | null;
  } | null;
  wallet: {
    balance: number;
    promoCreditBalance: number;
    referralCreditBalance: number;
  } | null;
  upcomingTrips: any[];
  activeTrips: any[];
  pastTrips: any[];
  cancelledTrips: any[];
  favourites: any[];
  reviews: any[];
  paymentMethods: any[];
  paymentHistory: any[];
  walletTransactions: any[];
  trustEvents: any[];
};

export type HostDashboardData = {
  user: GuestDashboardData['user'];
  hostProfile: {
    displayName: string | null;
    about: string | null;
    responseRate: number;
    responseTimeMinutes: number;
    acceptanceRate: number;
    completionRate: number;
    onTimeRate: number;
    superhostStatus: boolean;
    instantBookingEnabled: boolean;
    hostedTripCount: number;
    totalEarnings: number;
    pendingPayoutAmount: number;
  } | null;
  notificationPreferences: GuestDashboardData['notificationPreferences'] & {
    pushHostBookingRequests?: boolean;
  } | null;
  fleet: any[];
  pendingBookings: any[];
  upcomingBookings: any[];
  activeBookings: any[];
  recentReviews: any[];
  payouts: any[];
  analytics: {
    totals: {
      fleetCount: number;
      activeVehicleCount: number;
      totalViews: number;
      totalBookingRequests: number;
      totalConfirmedBookings: number;
      totalRevenue: number;
      conversionRate: number;
    };
    perCar: any[];
  };
  conversations: any[];
  aiInsights: any[];
};
