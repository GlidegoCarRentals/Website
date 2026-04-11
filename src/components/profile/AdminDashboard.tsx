'use client'

export default function AdminDashboard({ stats }: any) {
  return (
    <div style={{ padding: 30 }}>
      <h1 style={{ fontSize: 32, fontWeight: 'bold' }}>
        Admin Dashboard 🚀
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 30 }}>
        
        <div className="card">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>

        <div className="card">
          <h3>Total Hosts</h3>
          <p>{stats.totalHosts}</p>
        </div>

        <div className="card">
          <h3>Total Guests</h3>
          <p>{stats.totalGuests}</p>
        </div>

        <div className="card">
          <h3>Total Bookings</h3>
          <p>{stats.totalBookings}</p>
        </div>

        <div className="card">
          <h3>Active Bookings</h3>
          <p>{stats.activeBookings}</p>
        </div>

        <div className="card">
          <h3>Revenue</h3>
          <p>${stats.totalRevenue}</p>
        </div>

      </div>
    </div>
  )
}
