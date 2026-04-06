'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Flame, Mail, Phone, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'verify' | 'reset'>('verify')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Step 1: Verify email and phone
  const [verifyForm, setVerifyForm] = useState({
    email: '',
    phoneLast4: ''
  })
  
  // Step 2: Reset password
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  const [memberId, setMemberId] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate phone last 4 digits
      if (!/^\d{4}$/.test(verifyForm.phoneLast4)) {
        setError('Masukkan 4 digit terakhir nomor HP Anda')
        setLoading(false)
        return
      }

      const response = await fetch('/api/members/verify-forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: verifyForm.email,
          phoneLast4: verifyForm.phoneLast4
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMemberId(data.memberId)
        setStep('reset')
        setError('')
      } else {
        setError(data.error || 'Email atau 4 digit terakhir nomor HP tidak cocok')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate passwords
      if (resetForm.newPassword.length < 6) {
        setError('Password baru minimal 6 karakter')
        setLoading(false)
        return
      }

      if (resetForm.newPassword !== resetForm.confirmPassword) {
        setError('Password baru dan konfirmasi tidak cocok')
        setLoading(false)
        return
      }

      const response = await fetch('/api/members/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId,
          newPassword: resetForm.newPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || 'Gagal mengubah password. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-orange-600" />
            <span className="text-orange-600 font-medium">Kembali ke Login</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AYAM GEPREK SAMBAL IJO</h1>
              <p className="text-sm text-gray-500">Lupa Password</p>
            </div>
          </div>
        </div>

        {/* Step 1: Verify Email & Phone */}
        {step === 'verify' && !success && (
          <Card className="border-orange-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Verifikasi Akun</CardTitle>
              <CardDescription className="text-center">
                Masukkan email dan 4 digit terakhir nomor HP Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={verifyForm.email}
                    onChange={(e) => setVerifyForm({ ...verifyForm, email: e.target.value })}
                    required
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>

                <div>
                  <Label htmlFor="phone-last4" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-600" />
                    4 Digit Terakhir Nomor HP
                  </Label>
                  <Input
                    id="phone-last4"
                    type="text"
                    placeholder="Contoh: 5758"
                    value={verifyForm.phoneLast4}
                    onChange={(e) => {
                      // Only allow numbers, max 4 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setVerifyForm({ ...verifyForm, phoneLast4: value })
                    }}
                    required
                    maxLength={4}
                    className="border-orange-200 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Masukkan 4 digit terakhir nomor HP yang terdaftar
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                >
                  {loading ? 'Memverifikasi...' : 'Verifikasi'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Reset Password */}
        {step === 'reset' && !success && (
          <Card className="border-orange-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Buat Password Baru</CardTitle>
              <CardDescription className="text-center">
                Masukkan password baru untuk akun Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="new-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    Password Baru
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    Konfirmasi Password Baru
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Ulangi password baru"
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                    required
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                >
                  {loading ? 'Mengubah Password...' : 'Ubah Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {success && (
          <Card className="border-green-200 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
              <p className="text-gray-600 mb-4">
                Password Anda telah berhasil diubah. Anda akan dialihkan ke halaman login...
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
              >
                Login Sekarang
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact us at{' '}
          <a href="tel:085260812758" className="text-orange-600 font-medium hover:underline">
            085260812758
          </a>
        </p>
      </div>
    </div>
  )
}
