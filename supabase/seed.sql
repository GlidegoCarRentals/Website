-- ============================================================
-- GlideGo — Seed Data
-- 8 sample cars for development/testing
--
-- HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste and run this entire file
--   3. The script will use the first host-role user in your users table.
--      If no host user exists, sign up with role=host first, then run this.
-- ============================================================

DO $$
DECLARE
  host_uuid UUID;
BEGIN
  -- Use first host-role user, fall back to first user of any role
  SELECT id INTO host_uuid FROM public.users WHERE role = 'host' LIMIT 1;
  IF host_uuid IS NULL THEN
    SELECT id INTO host_uuid FROM public.users LIMIT 1;
  END IF;

  IF host_uuid IS NULL THEN
    RAISE NOTICE 'No users found. Create a user account first, then re-run this seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding cars with host_id = %', host_uuid;

  -- Clear existing seed cars (by slug prefix) to allow re-runs
  DELETE FROM public.cars WHERE slug LIKE 'seed-%';

  INSERT INTO public.cars (
    host_id, make, model, year, colour, body_type, engine,
    transmission, fuel_type, seats,
    price_daily, price_weekly, deposit_amount,
    min_days, min_age_years, instant_book,
    location_name, latitude, longitude,
    photos, features, title, description,
    avg_rating, total_trips, available, status,
    glidego_verified, slug
  ) VALUES

  -- 1. Toyota Camry
  (
    host_uuid, 'Toyota', 'Camry', 2024, 'Platinum White', 'Sedan', '2.5L Hybrid',
    'Automatic', 'Hybrid', 5,
    89, 560, 300,
    1, 21, true,
    'Melbourne Airport (MEL)', -37.6690, 144.8410,
    '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80"]',
    '["Bluetooth","Backup Camera","Apple CarPlay","Heated Seats","Cruise Control","Lane Assist","Wireless Charging","Sunroof"]',
    'Toyota Camry 2024',
    'The perfect blend of comfort and efficiency. The Toyota Camry Hybrid delivers exceptional fuel economy without sacrificing the premium comfort you deserve.',
    4.8, 128, true, 'active',
    true, 'seed-toyota-camry-2024'
  ),

  -- 2. Tesla Model 3
  (
    host_uuid, 'Tesla', 'Model 3', 2024, 'Pearl White', 'Sedan', 'Dual Motor Electric',
    'Automatic', 'Electric', 5,
    149, 950, 500,
    1, 21, true,
    'Melbourne CBD', -37.8136, 144.9631,
    '["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80"]',
    '["Autopilot","15\" Touchscreen","Free Supercharging","Glass Roof","Over-the-Air Updates","Sentry Mode","Dog Mode","Premium Audio"]',
    'Tesla Model 3 2024',
    'Experience the future of driving. The Tesla Model 3 combines cutting-edge technology with exhilarating performance and up to 500km of range.',
    4.9, 214, true, 'active',
    true, 'seed-tesla-model3-2024'
  ),

  -- 3. BMW X5
  (
    host_uuid, 'BMW', 'X5 xDrive40i', 2023, 'Carbon Black', 'SUV', '3.0L TwinPower Turbo',
    'Automatic', 'Petrol', 7,
    199, 1290, 700,
    2, 25, false,
    'Southbank', -37.8224, 144.9614,
    '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80"]',
    '["AWD/4WD","Apple CarPlay","Heated Seats","Panoramic Sunroof","Harman Kardon Audio","Adaptive Cruise Control","360° Camera","Ambient Lighting"]',
    'BMW X5 xDrive40i 2023',
    'Pure luxury meets everyday versatility. The BMW X5 offers a commanding presence, a sumptuous interior, and performance that makes every journey unforgettable.',
    4.9, 89, true, 'active',
    true, 'seed-bmw-x5-2023'
  ),

  -- 4. Hyundai i30
  (
    host_uuid, 'Hyundai', 'i30', 2023, 'Ceramic White', 'Hatchback', '2.0L GDi',
    'Automatic', 'Petrol', 5,
    59, 370, 250,
    1, 21, true,
    'Melbourne CBD', -37.8136, 144.9631,
    '["https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=600&q=80"]',
    '["Bluetooth","Backup Camera","Apple CarPlay","Android Auto","Cruise Control","Lane Assist"]',
    'Hyundai i30 2023',
    'The ideal city companion. Economical, reliable, and easy to park. Perfect for exploring Melbourne without breaking the bank.',
    4.6, 312, true, 'active',
    true, 'seed-hyundai-i30-2023'
  ),

  -- 5. Mercedes-Benz GLE
  (
    host_uuid, 'Mercedes-Benz', 'GLE 300d', 2023, 'Obsidian Black', 'SUV', '2.0L Diesel',
    'Automatic', 'Diesel', 7,
    249, 1590, 900,
    2, 25, false,
    'St Kilda', -37.8579, 144.9771,
    '["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80"]',
    '["MBUX Infotainment","Heated/Cooled Seats","Burmester Sound","Panoramic Roof","4MATIC AWD","360° Camera","Adaptive Cruise","Keyless Entry"]',
    'Mercedes-Benz GLE 300d 2023',
    'The pinnacle of German luxury. The GLE combines a spacious seven-seat cabin, cutting-edge technology, and effortless performance in a stunning package.',
    5.0, 42, true, 'active',
    true, 'seed-mercedes-gle-2023'
  ),

  -- 6. Toyota RAV4
  (
    host_uuid, 'Toyota', 'RAV4', 2024, 'Glacier White', 'SUV', '2.5L Hybrid',
    'Automatic', 'Hybrid', 5,
    119, 750, 400,
    1, 21, true,
    'Richmond', -37.8183, 144.9988,
    '["https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=600&q=80"]',
    '["Apple CarPlay","Android Auto","AWD","Backup Camera","Adaptive Cruise","Lane Assist","Wireless Charging","Blind Spot Monitor"]',
    'Toyota RAV4 2024',
    'Australia''s favourite SUV, now in hybrid. The RAV4 Hybrid offers outstanding fuel efficiency, all-wheel drive confidence, and a spacious family-friendly interior.',
    4.7, 176, true, 'active',
    true, 'seed-toyota-rav4-2024'
  ),

  -- 7. Ford Ranger
  (
    host_uuid, 'Ford', 'Ranger XLT', 2023, 'Meteor Grey', 'Ute / Pickup', '2.0L Bi-Turbo Diesel',
    'Automatic', 'Diesel', 5,
    139, 880, 500,
    1, 21, true,
    'Dandenong', -37.9878, 145.2167,
    '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"]',
    '["Tow Bar","Roof Rack","Apple CarPlay","4WD","Backup Camera","Bluetooth","Cruise Control","Parking Sensors"]',
    'Ford Ranger XLT 2023',
    'Built tough for any adventure. The Ford Ranger combines serious off-road capability with on-road comfort and best-in-class towing. Perfect for weekends away or moving jobs.',
    4.7, 95, true, 'active',
    true, 'seed-ford-ranger-2023'
  ),

  -- 8. Kia EV6
  (
    host_uuid, 'Kia', 'EV6 GT-Line', 2023, 'Runway Red', 'SUV', 'Dual Motor Electric',
    'Automatic', 'Electric', 5,
    169, 1080, 550,
    1, 21, true,
    'Docklands', -37.8144, 144.9445,
    '["https://images.unsplash.com/photo-1626197030908-deef17d7f8e8?w=600&q=80"]',
    '["Dual Motor AWD","800V Ultra-Fast Charging","Panoramic Sunroof","Heated/Cooled Seats","Bose Audio","Heads Up Display","Wireless CarPlay","Vehicle-to-Load"]',
    'Kia EV6 GT-Line 2023',
    'The electric SUV that rewrites the rules. Ultra-fast 800V charging, 500km range, stunning design, and performance that puts most sports cars to shame.',
    4.8, 67, true, 'active',
    true, 'seed-kia-ev6-2023'
  );

  RAISE NOTICE 'Seeded 8 cars successfully.';
END $$;
