// src/lib/vehicles.ts
// Reliable vehicle operations with proper error handling

import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  rego: string;
  fuel_type: string;
  transmission: string;
  seats: number;
  price_daily: number;
  description?: string;
  image_url?: string;
  location: string;
  host_id: string;
}

export interface VehicleResult {
  ok: boolean;
  id?: string;
  error?: string;
}

// Validate vehicle data before insert
function validateVehicle(data: Partial<VehicleData>): string | null {
  if (!data.make?.trim()) return 'Please enter the car make (e.g. Toyota)';
  if (!data.model?.trim()) return 'Please enter the car model (e.g. Camry)';
  if (!data.year || data.year < 1990 || data.year > new Date().getFullYear() + 1) {
    return 'Please enter a valid year (1990 or later)';
  }
  if (!data.rego?.trim()) return 'Please enter the registration number';
  if (!data.fuel_type) return 'Please select a fuel type';
  if (!data.transmission) return 'Please select transmission type';
  if (!data.seats || data.seats < 1 || data.seats > 20) return 'Please enter valid number of seats';
  if (!data.price_daily || data.price_daily < 10) return 'Daily price must be at least $10';
  if (!data.location?.trim()) return 'Please enter the pickup location';
  return null;
}

// Insert vehicle with proper error handling
export async function insertVehicle(data: VehicleData): Promise<VehicleResult> {
  // Validate first
  const validationError = validateVehicle(data);
  if (validationError) return { ok: false, error: validationError };

  try {
    const { data: vehicle, error } = await supabase
      .from('cars')
      .insert({
        make: data.make.trim(),
        model: data.model.trim(),
        year: data.year,
        rego: data.rego.trim().toUpperCase(),
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        seats: data.seats,
        price_daily: data.price_daily,
        description: data.description?.trim() || '',
        image_url: data.image_url || '',
        location: data.location.trim(),
        host_id: data.host_id,
        status: 'active',
        available: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('insertVehicle error:', error);
      if (error.code === '23505') return { ok: false, error: 'This registration number already exists.' };
      if (error.code === '42501') return { ok: false, error: 'You do not have permission to add vehicles.' };
      return { ok: false, error: 'Failed to save vehicle. Please try again.' };
    }

    return { ok: true, id: vehicle.id };
  } catch (err) {
    console.error('insertVehicle unexpected error:', err);
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

// Fetch host vehicles
export async function fetchHostVehicles(hostId: string) {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchHostVehicles error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('fetchHostVehicles unexpected error:', err);
    return [];
  }
}

// Update vehicle availability
export async function updateVehicleAvailability(vehicleId: string, available: boolean) {
  try {
    const { error } = await supabase
      .from('cars')
      .update({ available })
      .eq('id', vehicleId);

    if (error) {
      console.error('updateVehicleAvailability error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('updateVehicleAvailability unexpected error:', err);
    return false;
  }
}
