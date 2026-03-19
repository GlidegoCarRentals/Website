import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─────────────────────────────────────────────
// GlideGo Load Test Suite
// Tests: Homepage, Fleet, Login, API endpoints
// ─────────────────────────────────────────────

const BASE_URL = 'https://glidego.vercel.app';

// Custom metrics
const errorRate = new Rate('error_rate');
const homepageTime = new Trend('homepage_duration');
const fleetTime = new Trend('fleet_duration');
const loginTime = new Trend('login_duration');
const apiTime = new Trend('api_duration');

// ─────────────────────────────────────────────
// Load Test Stages
// Ramp up → Hold → Ramp down
// ─────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm up — 10 users
    { duration: '1m',  target: 50 },   // Ramp to 50 users
    { duration: '2m',  target: 100 },  // Hold at 100 users
    { duration: '1m',  target: 200 },  // Ramp to 200 users
    { duration: '2m',  target: 200 },  // Hold at 200 users
    { duration: '1m',  target: 500 },  // Stress — 500 users
    { duration: '1m',  target: 500 },  // Hold at 500 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // 95% requests under 3 seconds
    http_req_duration: ['p(95)<3000'],
    // Error rate under 5%
    error_rate: ['rate<0.05'],
    // Homepage under 4 seconds
    homepage_duration: ['p(95)<4000'],
    // Fleet page under 4 seconds
    fleet_duration: ['p(95)<4000'],
    // Login page under 3 seconds
    login_duration: ['p(95)<3000'],
    // API under 2 seconds
    api_duration: ['p(95)<2000'],
  },
};

// ─────────────────────────────────────────────
// Main Test Function
// ─────────────────────────────────────────────
export default function () {
  // Randomly pick a user journey
  const journey = Math.random();

  if (journey < 0.3) {
    // 30% users — Homepage visitor
    homepageJourney();
  } else if (journey < 0.6) {
    // 30% users — Browse fleet
    fleetJourney();
  } else if (journey < 0.8) {
    // 20% users — Login flow
    loginJourney();
  } else {
    // 20% users — API calls
    apiJourney();
  }
}

// ─────────────────────────────────────────────
// Journey 1 — Homepage Visitor
// ─────────────────────────────────────────────
function homepageJourney() {
  const start = Date.now();

  const res = http.get(BASE_URL, {
    headers: { 'Accept': 'text/html' },
  });

  homepageTime.add(Date.now() - start);

  const success = check(res, {
    'Homepage — status 200': (r) => r.status === 200,
    'Homepage — loads under 5s': (r) => r.timings.duration < 5000,
    'Homepage — has content': (r) => r.body.length > 1000,
  });

  errorRate.add(!success);
  sleep(Math.random() * 3 + 1); // 1-4 seconds between actions
}

// ─────────────────────────────────────────────
// Journey 2 — Browse Fleet
// ─────────────────────────────────────────────
function fleetJourney() {
  // Visit fleet page
  const start = Date.now();
  const res = http.get(`${BASE_URL}/fleet`, {
    headers: { 'Accept': 'text/html' },
  });

  fleetTime.add(Date.now() - start);

  const success = check(res, {
    'Fleet — status 200': (r) => r.status === 200,
    'Fleet — loads under 5s': (r) => r.timings.duration < 5000,
    'Fleet — has content': (r) => r.body.length > 1000,
  });

  errorRate.add(!success);
  sleep(2);

  // Browse a specific car
  const carRes = http.get(`${BASE_URL}/cars/toyota-camry-hybrid-2024`, {
    headers: { 'Accept': 'text/html' },
  });

  check(carRes, {
    'Car page — status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(Math.random() * 2 + 1);
}

// ─────────────────────────────────────────────
// Journey 3 — Login Flow
// ─────────────────────────────────────────────
function loginJourney() {
  const start = Date.now();

  const res = http.get(`${BASE_URL}/login`, {
    headers: { 'Accept': 'text/html' },
  });

  loginTime.add(Date.now() - start);

  const success = check(res, {
    'Login page — status 200': (r) => r.status === 200,
    'Login page — loads under 4s': (r) => r.timings.duration < 4000,
    'Login page — has form': (r) => r.body.includes('email') || r.body.includes('Email'),
  });

  errorRate.add(!success);
  sleep(Math.random() * 2 + 1);
}

// ─────────────────────────────────────────────
// Journey 4 — API Endpoints
// ─────────────────────────────────────────────
function apiJourney() {
  const start = Date.now();

  // Test fleet page instead of direct Supabase API
  // (No hardcoded keys needed)
  const res = http.get(`${BASE_URL}/fleet`, {
    headers: { 'Accept': 'text/html' },
  });

  apiTime.add(Date.now() - start);

  const success = check(res, {
    'API — fleet responds': (r) => r.status === 200,
    'API — responds under 2s': (r) => r.timings.duration < 2000,
    'API — has content': (r) => r.body.length > 100,
  });

  errorRate.add(!success);
  sleep(1);
}

// ─────────────────────────────────────────────
// Setup — runs once before test
// ─────────────────────────────────────────────
export function setup() {
  console.log('🚀 GlideGo Load Test Starting...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('📊 Test stages: 10 → 50 → 100 → 200 → 500 users');
}

// ─────────────────────────────────────────────
// Teardown — runs once after test
// ─────────────────────────────────────────────
export function teardown() {
  console.log('✅ GlideGo Load Test Complete!');
  console.log('📋 Check results above for pass/fail thresholds');
}