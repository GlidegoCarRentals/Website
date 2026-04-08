'use client';

// Generic skeleton block
export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style = {} }: Readonly<{
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}>) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

// Car card skeleton
export function CarCardSkeleton() {
  return (
    <div className="skeleton-card">
      <Skeleton height={180} borderRadius={0} />
      <div style={{ padding: '16px 18px' }}>
        <Skeleton height={18} width="70%" style={{ marginBottom: 8 }} />
        <Skeleton height={13} width="50%" style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <Skeleton height={40} width="33%" />
          <Skeleton height={40} width="33%" />
          <Skeleton height={40} width="33%" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton height={22} width="40%" />
          <Skeleton height={36} width={90} borderRadius={10} />
        </div>
      </div>
    </div>
  );
}

// Fleet grid skeleton — 8 cards
export function FleetSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <CarCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <Skeleton width={48} height={48} borderRadius={12} />
      <div style={{ flex: 1 }}>
        <Skeleton height={13} width="60%" style={{ marginBottom: 6 }} />
        <Skeleton height={24} width="40%" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }: Readonly<{ cols?: number }>) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`col-${i}`} style={{ padding: '14px 16px' }}>
          <Skeleton height={14} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Skeleton width={72} height={72} borderRadius={36} />
      <div style={{ flex: 1 }}>
        <Skeleton height={20} width="50%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="35%" />
      </div>
    </div>
  );
}
