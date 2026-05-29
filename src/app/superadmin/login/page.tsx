'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, Database } from 'lucide-react'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)

  useEffect(() => {
    // Cek apakah setup diperlukan
    fetch('/superadmin/api/check')
      .then(async res => {
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('Non-JSON response:', text.substring(0, 200))
          // Jika response bukan JSON, anggap perlu setup
          return { success: false, setupNeeded: true }
        }
        return res.json()
      })
      .then(data => {
        console.log('Check result:', data)
        if (data.tableMissing) {
          setTableMissing(true)
          setSetupNeeded(true)
        } else if (!data.success || data.setupNeeded || data.adminCount === 0) {
          setSetupNeeded(true)
        }
      })
      .catch(err => {
        console.error('Check error:', err)
        // Jika error, tetap tampilkan halaman login (setup mungkin diperlukan)
        setSetupNeeded(true)
      })
  }, [])

  const handleSetup = async () => {
    setSetupLoading(true)
    setError('')
    try {
      const response = await fetch('/superadmin/api/setup', { method: 'POST' })
      const contentType = response.headers.get('content-type')
      
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON setup response:', text.substring(0, 200))
        throw new Error('Server mengembalikan response yang tidak valid')
      }
      
      console.log('Setup result:', data)
      
      if (data.success) {
        setSetupNeeded(false)
        setError('Setup berhasil! Silakan login dengan email: admin@peeka.id dan password: admin123')
      } else {
        setError('Setup gagal: ' + (data.error || 'Unknown error'))
      }
    } catch (err: any) {
      console.error('Setup error:', err)
      setError('Setup error: ' + err.message)
    } finally {
      setSetupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/superadmin/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const contentType = response.headers.get('content-type')
      
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON login response:', text.substring(0, 500))
        throw new Error('Server mengembalikan response yang tidak valid')
      }
      
      console.log('Parsed response:', data)

      if (data.success) {
        router.push('/superadmin')
        router.refresh()
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image
                src="/logo/logo-peeka.png"
                alt="Peeka"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div className="text-left">
                <h1
                  className="text-xl font-bold text-gray-900 dark:text-white"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Peeka
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Superadmin Panel
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-brand-500">
              <Shield size={20} />
              <span className="text-sm font-medium">Superadmin Access</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl ${error.includes('berhasil') ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <p className={`text-sm text-center ${error.includes('berhasil') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {error}
              </p>
            </div>
          )}

          {/* Setup Button */}
          {setupNeeded && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              {tableMissing ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Database size={20} className="text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                      Tabel admin_users belum dibuat
                    </p>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mb-3 text-center">
                    Jalankan SQL berikut di Supabase SQL Editor:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3">
                    <pre>{`create table if not exists public.admin_users (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  password_hash text not null,
  nama text not null default 'Admin',
  aktif boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

create index if not exists idx_admin_users_email on public.admin_users(email);
alter table public.admin_users enable row level security;`}</pre>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Sudah Buat Tabel - Refresh
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center mb-3">
                    Setup admin belum dilakukan
                  </p>
                  <button
                    onClick={handleSetup}
                    disabled={setupLoading}
                    className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-medium rounded-lg transition-colors"
                  >
                    {setupLoading ? 'Setup...' : 'Setup Admin Sekarang'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@peeka.id"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Memuat...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-brand-500 transition-colors"
            >
              ← Kembali ke website
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Peeka Superadmin Panel © 2024
        </p>
      </div>
    </div>
  )
}