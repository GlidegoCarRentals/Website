-- ============================================================
-- GlideGo — Seed Data (plain SQL, no PL/pgSQL)
-- Run in Supabase Dashboard → SQL Editor
-- Requires at least one user in public.users first
-- Note: repeated string literals are idiomatic in SQL seed data
-- ============================================================

-- Remove previous seed cars (safe to re-run)
DELETE FROM public.cars WHERE description LIKE '%GlideGo seed%';

-- Insert 8 sample cars — host_id auto-picked from first host/any user
INSERT INTO public.cars (
  host_id, make, model, year, colour, body_type, engine,
  rego, rego_state, transmission, fuel_type, seats,
  price_daily, price_weekly, price_monthly, deposit_amount,
  min_days, min_age_years,
  instant_book, delivery_available, delivery_fee,
  location_name, latitude, longitude,
  photos, features, description,
  avg_rating, total_trips, total_reviews,
  available, status
)
SELECT
  COALESCE(
    (SELECT id FROM public.users WHERE role = 'host' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  ),
  make, model, year, colour, body_type, engine,
  rego, rego_state, transmission, fuel_type, seats,
  price_daily, price_weekly, price_monthly, deposit_amount,
  min_days, min_age_years,
  instant_book, delivery_available, delivery_fee,
  location_name, latitude, longitude,
  photos::jsonb, features::jsonb, description,
  avg_rating, total_trips, total_reviews,
  available, status
FROM (VALUES
  -- 1. Toyota Camry
  ('Toyota','Camry',2024,'Platinum White','Sedan','2.5L Hybrid 4-cyl',
   NULL,'VIC','Automatic','Hybrid',5,
   89,560,1800,300,1,21,
   true,false,0,
   'Melbourne Airport (MEL)',-37.6690,144.8410,
   '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80"]',
   '["Bluetooth","Backup Camera","Apple CarPlay","Heated Seats","Cruise Control","Lane Assist","Wireless Charging","Sunroof"]',
   'The perfect blend of comfort and efficiency. The Toyota Camry Hybrid delivers exceptional fuel economy without sacrificing premium comfort. GlideGo seed',
   4.8,128,94,true,'active'),

  -- 2. Tesla Model 3
  ('Tesla','Model 3',2024,'Pearl White','Sedan','Dual Motor Electric',
   NULL,'VIC','Automatic','Electric',5,
   149,950,3000,500,1,21,
   true,false,0,
   'Melbourne CBD',-37.8136,144.9631,
   '["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&q=80"]',
   '["Autopilot","15\" Touchscreen","Free Supercharging","Glass Roof","Sentry Mode","Premium Audio","Wireless CarPlay","Over-the-Air Updates"]',
   'Experience the future of driving. The Tesla Model 3 combines cutting-edge technology with exhilarating performance and up to 500km of range. GlideGo seed',
   4.9,214,187,true,'active'),

  -- 3. BMW X5
  ('BMW','X5 xDrive40i',2023,'Carbon Black','SUV','3.0L TwinPower Turbo',
   NULL,'VIC','Automatic','Petrol',7,
   199,1290,4200,700,2,25,
   false,false,0,
   'Southbank',-37.8224,144.9614,
   '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80"]',
   '["AWD/4WD","Apple CarPlay","Heated Seats","Panoramic Sunroof","Harman Kardon Audio","Adaptive Cruise","360 Camera","Ambient Lighting"]',
   'Pure luxury meets everyday versatility. The BMW X5 offers a commanding presence, sumptuous interior, and performance that makes every journey unforgettable. GlideGo seed',
   4.9,89,72,true,'active'),

  -- 4. Hyundai i30
  ('Hyundai','i30',2023,'Ceramic White','Hatchback','2.0L GDi',
   NULL,'VIC','Automatic','Petrol',5,
   59,370,1100,250,1,21,
   true,false,0,
   'Melbourne CBD',-37.8136,144.9631,
   '["https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=600&q=80"]',
   '["Bluetooth","Backup Camera","Apple CarPlay","Android Auto","Cruise Control","Lane Assist"]',
   'The ideal city companion. Economical, reliable, and easy to park. Perfect for exploring Melbourne without breaking the bank. GlideGo seed',
   4.6,312,241,true,'active'),

  -- 5. Mercedes-Benz GLE
  ('Mercedes-Benz','GLE 300d',2023,'Obsidian Black','SUV','2.0L Diesel Turbo',
   NULL,'VIC','Automatic','Diesel',7,
   259,1590,5200,900,2,25,
   false,false,0,
   'St Kilda',-37.8579,144.9771,
   '["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80"]',
   '["MBUX Infotainment","Heated & Cooled Seats","Burmester Sound","Panoramic Roof","4MATIC AWD","360 Camera","Adaptive Cruise","Keyless Entry"]',
   'The pinnacle of German luxury. The GLE combines a spacious seven-seat cabin, cutting-edge technology, and effortless performance in a stunning package. GlideGo seed',
   5.0,42,38,true,'active'),

  -- 6. Ford Ranger
  ('Ford','Ranger XLT',2023,'Meteor Grey','Ute / Pickup','2.0L Bi-Turbo Diesel',
   NULL,'VIC','Automatic','Diesel',5,
   129,880,2800,500,1,21,
   true,false,0,
   'Dandenong',-37.9878,145.2167,
   '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"]',
   '["Tow Bar","Roof Rack","Apple CarPlay","4WD","Backup Camera","Bluetooth","Cruise Control","Parking Sensors"]',
   'Built tough for any adventure. The Ranger combines serious off-road capability with on-road comfort and best-in-class towing. GlideGo seed',
   4.7,95,78,true,'active'),

  -- 7. Kia EV6
  ('Kia','EV6 GT-Line',2023,'Runway Red','SUV','Dual Motor Electric',
   NULL,'VIC','Automatic','Electric',5,
   109,1080,3400,550,1,21,
   true,false,0,
   'Docklands',-37.8144,144.9445,
   '["https://images.unsplash.com/photo-1626197030908-deef17d7f8e8?w=600&q=80"]',
   '["Dual Motor AWD","800V Ultra-Fast Charging","Panoramic Sunroof","Heated & Cooled Seats","Bose Audio","Heads Up Display","Wireless CarPlay","Vehicle-to-Load"]',
   'The electric SUV that rewrites the rules. Ultra-fast 800V charging, 500km range, stunning design and performance that puts most sports cars to shame. GlideGo seed',
   4.8,67,54,true,'active'),

  -- 8. Toyota RAV4
  ('Toyota','RAV4',2024,'Glacier White','SUV','2.5L Hybrid',
   NULL,'VIC','Automatic','Hybrid',5,
   139,750,2500,400,1,21,
   true,false,0,
   'Richmond',-37.8183,144.9988,
   '["https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=600&q=80"]',
   '["Apple CarPlay","Android Auto","AWD","Backup Camera","Adaptive Cruise","Lane Assist","Wireless Charging","Blind Spot Monitor"]',
   'Australia''s favourite SUV now in hybrid. The RAV4 Hybrid offers outstanding fuel efficiency, all-wheel drive confidence, and a spacious family-friendly interior. GlideGo seed',
   4.7,176,142,true,'active')

) AS v(
  make, model, year, colour, body_type, engine,
  rego, rego_state, transmission, fuel_type, seats,
  price_daily, price_weekly, price_monthly, deposit_amount,
  min_days, min_age_years,
  instant_book, delivery_available, delivery_fee,
  location_name, latitude, longitude,
  photos, features, description,
  avg_rating, total_trips, total_reviews,
  available, status
);
