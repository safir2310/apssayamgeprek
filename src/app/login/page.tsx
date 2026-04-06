'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Flame, User, Lock, Mail, Phone, MapPin, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  })
  const [forgotForm, setForgotForm] = useState({
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if user exists in member database
      const response = await fetch(`/api/members/lookup?phone=${loginForm.phone}`)
      if (response.ok) {
        const data = await response.json()
        if (data.found && data.member) {
          // Store member info in localStorage
          localStorage.setItem('member', JSON.stringify(data.member))
          alert(`Selamat datang kembali, ${data.member.name}!`)
          router.push('/')
        } else {
          alert('Nomor telepon tidak terdaftar. Silakan daftar terlebih dahulu.')
        }
      } else {
        alert('Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!registerForm.name || !registerForm.phone || !registerForm.password) {
      alert('Mohon lengkapi semua field yang wajib diisi!')
      return
    }

    if (registerForm.phone.length < 10) {
      alert('Nomor telepon harus minimal 10 digit!')
      return
    }

    if (registerForm.password.length < 6) {
      alert('Password harus minimal 6 karakter!')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Password tidak cocok!')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/members/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: registerForm.name,
          phone: registerForm.phone,
          email: registerForm.email || null,
          address: registerForm.address || null,
          password: registerForm.password
        })
      })

      if (response.ok) {
        setRegisterSuccess(true)
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal mendaftar. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if member exists
      const response = await fetch(`/api/members/lookup?phone=${forgotForm.phone}`)
      if (response.ok) {
        const data = await response.json()
        if (data.found) {
          alert(`Reset password link akan dikirim ke nomor ${forgotForm.phone} (Simulasi)`)
          setForgotForm({ phone: '' })
        } else {
          alert('Nomor telepon tidak terdaftar!')
        }
      } else {
        alert('Terjadi kesalahan. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (registerSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-orange-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-gray-600 mb-6">Akun member Anda telah berhasil dibuat. Silakan login untuk melanjutkan.</p>
            <Button
              onClick={() => {
                setRegisterSuccess(false)
                setRegisterForm({
                  name: '',
                  phone: '',
                  email: '',
                  address: '',
                  password: '',
                  confirmPassword: ''
                })
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
            >
              Login Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-orange-600" />
            <span className="text-orange-600 font-medium">Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AYAM GEPREK SAMBAL IJO</h1>
              <p className="text-sm text-gray-500">Member Area</p>
            </div>
          </div>
        </div>

        <Card className="border-orange-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Selamat Datang!</CardTitle>
            <CardDescription className="text-center">
              Login atau daftar untuk menikmati promo dan poin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
                <TabsTrigger value="forgot">Lupa Password</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-600" />
                      Nomor Telepon
                    </Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={loginForm.phone}
                      onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="border-orange-200 focus:border-orange-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                  >
                    {loading ? 'Memproses...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-600" />
                      Nama Lengkap *
                    </Label>
                    <Input
                      id="reg-name"
                      placeholder="Masukkan nama lengkap"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-600" />
                      Nomor Telepon *
                    </Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-600" />
                      Email
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="email@example.com (opsional)"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      Alamat
                    </Label>
                    <textarea
                      id="reg-address"
                      placeholder="Alamat lengkap (opsional)"
                      rows={2}
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        className="border-orange-200 focus:border-orange-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-confirm-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      Konfirmasi Password *
                    </Label>
                    <Input
                      id="reg-confirm-password"
                      type="password"
                      placeholder="Ulangi password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                  >
                    {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                  </Button>
                </form>
              </TabsContent>

              {/* Forgot Password Tab */}
              <TabsContent value="forgot">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-orange-500" />
                    </div>
                    <p className="text-gray-600">
                      Masukkan nomor telepon yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="forgot-phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-orange-600" />
                      Nomor Telepon
                    </Label>
                    <Input
                      id="forgot-phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={forgotForm.phone}
                      onChange={(e) => setForgotForm({ ...forgotForm, phone: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                  >
                    {loading ? 'Memproses...' : 'Kirim Link Reset'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
