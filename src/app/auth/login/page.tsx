'use client'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Login ke PEEKA</h1>
          <p className="text-gray-500 mt-2">Aplikasi Kasir Digital</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Cara Login:</p>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>1. Buka Telegram</li>
              <li>2. Cari bot <span className="font-semibold">@PeekaIdBot</span></li>
              <li>3. Ketik <span className="font-semibold">/login</span></li>
              <li>4. Klik link yang dikirimbot</li>
            </ol>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Link login berlaku 15 menit.<br/>
          Tidak punya akun? Hubungi admin
        </p>
      </div>
    </div>
  )
}