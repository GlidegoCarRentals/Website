'use client';

import { useEffect, useState } from 'react';
import { fetchCars } from '@/lib/db-cars';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCars()
      .then((data) => setVehicles(data.map((vehicle) => ({
        id: String(vehicle.id),
        name: vehicle.name,
        seats: vehicle.seats,
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
        dailyRate: vehicle.price,
        weeklyRate: vehicle.weeklyPrice,
        status: vehicle.available ? 'active' : 'inactive',
      }))))
      .catch(() => setError('Vehicles could not be loaded.'));
  }, []);

  const persistVehicle = async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/host/cars/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Vehicle update failed.');
    return result.car;
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/host/cars/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'The vehicle could not be deleted.');
      return;
    }
    setVehicles((items) => items.filter((vehicle) => vehicle.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-500 text-sm mt-1">{vehicles.length} vehicles in fleet</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Vehicle', 'Details', 'Daily Rate', 'Weekly Rate', 'Status', 'Actions'].map((heading) => (
                <th key={heading} className="text-left px-6 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{vehicle.name}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">{vehicle.seats} seats · {vehicle.transmission} · {vehicle.fuel}</td>
                <td className="px-6 py-4 font-bold text-blue-600">${vehicle.dailyRate}/day</td>
                <td className="px-6 py-4 text-gray-700">${vehicle.weeklyRate}/wk</td>
                <td className="px-6 py-4">
                  <select
                    value={vehicle.status}
                    onChange={async (event) => {
                      try {
                        const updated = await persistVehicle(vehicle.id, { status: event.target.value });
                        setVehicles((items) => items.map((item) => item.id === vehicle.id ? { ...item, status: updated.status } : item));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'The vehicle status could not be updated.');
                      }
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button onClick={async () => {
                      const nextRate = globalThis.prompt('New daily rate', String(vehicle.dailyRate));
                      if (!nextRate) return;
                      try {
                        const updated = await persistVehicle(vehicle.id, { price_daily: Number(nextRate) });
                        setVehicles((items) => items.map((item) => item.id === vehicle.id ? { ...item, dailyRate: updated.price_daily } : item));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'The vehicle could not be updated.');
                      }
                    }} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Edit</button>
                    <button onClick={() => handleDelete(vehicle.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
