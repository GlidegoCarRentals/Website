'use client';

import { useEffect, useState, Suspense } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams } from 'next/navigation';
import CheckoutForm from '@/components/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const totalAmount = parseFloat(searchParams.get('amount') || '0');

  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId || !totalAmount) {
      setError('Missing booking details.');
      setIsLoading(false);
      return;
    }

    fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        totalAmount,
        customerEmail: 'customer@glidego.com.au',
        customerName: 'Customer',
        skipDatabase: true,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setClientSecret(data.clientSecret);
      })
      .catch(() => setError('Failed to initialise payment. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [bookingId, totalAmount]);

  const handlePaymentSuccess = () => {
    window.location.href = `/booking/confirmation?bookingId=${bookingId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Setting up secure payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-500 mt-1">GlideGo Melbourne Car Rentals</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                    borderRadius: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  },
                },
              }}
            >
              <CheckoutForm
                bookingId={bookingId!}
                totalAmount={totalAmount}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
