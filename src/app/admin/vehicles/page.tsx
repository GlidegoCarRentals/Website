'use client';

import { useState } from 'react';

interface Vehicle {
  id: number;
  name: string;
  seats: number;
  transmission: string;
  fuel: string;
  dailyRate: number;
  weeklyRate: number;
  status: 'available' | 'booked' | 'maintenance';
}

const initialVehicles: Vehicle[] = [
  { id: 1, name: 'Toyota Camry', seats: 5, transmission: 'Automatic', fuel: 'Petrol', dailyRate: 89, weeklyRate: 560, status: 'available' },
  { id: 2, name: 'Hyundai i30', seats: 5, transmission: 'Automatic', fuel: 'Petrol', dailyRate: 69, weeklyRate: 440, status: 'available' },
  { id: 3, name: 'Mazda CX-5', seats: 5, transmission: 'Automatic', fuel: 'Petrol', dailyRate: 109, weeklyRate: 700, status: 'booked' },
  { id: 4, name: 'Ford Ranger', seats: 5, transmission: 'Manual', fuel: 'Diesel', dailyRate: 129, weeklyRate: 820, status: 'maintenance' },
  { id: 5, name: 'Tesla Model 3', seats: 5, transmission: 'Automatic', fuel: 'Electric', dailyRate: 149, weeklyRate: 950, status: 'available' },
  { id: 6, name: 'Toyota HiAce', seats: 12, transmission: 'Automatic', fuel: 'Diesel', dailyRate: 179, weeklyRate: 1100, status: 'available' },
];

const statusColors = {
  available: 'bg-green-100 text-green-700',
  booked: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-red-100 text-red-700',
};

const defaultForm = { name: '', seats: 5, transmission: 'Automatic', fuel: 'Petrol', dailyRate: 89, weeklyRate: 560, status: 'available' as Vehicle['status'] };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const handleSave = () => {
    if (!form.name) return alert('Please enter vehicle name');
    if (editingId !== null) {
      setVehicles(vehicles.map(v => v.id === editingId ? { ...v, ...form } : v));
    } else {
      setVehicles([...vehicles, { ...form, id: Date.now() }]);
    }
    setForm(defaultForm);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (v: Vehicle) => {
    setForm({ name: v.name, seats: v.seats, transmission: v.transmission, fuel: v.fuel, dailyRate: v.dailyRate, weeklyRate: v.weeklyRate, status: v.status });
    setEditingId(v.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-500 text-sm mt-1">{vehicles.length} vehicles in fleet</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultForm); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          + Add Vehicle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5 text-lg">{editingId ? '✏️ Edit Vehicle' : '➕ Add New Vehicle'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Vehicle Name *', key: 'name', type: 'text', placeholder: 'e.g. Toyota Camry', span: true },
              { label: 'Daily Rate (AUD)', key: 'dailyRate', type: 'number', placeholder: '89' },
              { label: 'Weekly Rate (AUD)', key: 'weeklyRate', type: 'number', placeholder: '560' },
              { label: 'Seats', key: 'seats', type: 'number', placeholder: '5' },
            ].map((field) => (
              <div key={field.key} className={field.span ? 'md:col-span-2 lg:col-span-1' : ''}>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            {[
              { label: 'Transmission', key: 'transmission', options: ['Automatic', 'Manual'] },
              { label: 'Fuel Type', key: 'fuel', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
              { label: 'Status', key: 'status', options: ['available', 'booked', 'maintenance'] },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{field.label}</label>
                <select
                  value={(form as any)[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value as any })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              {editingId ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Vehicle', 'Details', 'Daily Rate', 'Weekly Rate', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">{v.name}</td>
                <td className="px-6 py-4 text-gray-500 text-xs">{v.seats} seats · {v.transmission} · {v.fuel}</td>
                <td className="px-6 py-4 font-bold text-blue-600">${v.dailyRate}/day</td>
                <td className="px-6 py-4 text-gray-700">${v.weeklyRate}/wk</td>
                <td className="px-6 py-4">
                  <select
                    value={v.status}
                    onChange={e => setVehicles(vehicles.map(veh => veh.id === v.id ? { ...veh, status: e.target.value as Vehicle['status'] } : veh))}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${statusColors[v.status]}`}
                  >
                    <option value="available">✅ Available</option>
                    <option value="booked">📅 Booked</option>
                    <option value="maintenance">🔧 Maintenance</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(v)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">Edit</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Delete</button>
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
