import Link from 'next/link';

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-6">
          Your car has been booked successfully. A confirmation email will be sent shortly.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 text-sm font-medium">✅ Payment successful</p>
          <p className="text-green-600 text-xs mt-1">Bond pre-authorised — will be released on return</p>
        </div>
        <Link href="/"
          className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
