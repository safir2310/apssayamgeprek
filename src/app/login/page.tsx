'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Flame, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Attempting login with email:', loginForm.email)

      // Try to login as staff first
      let staffResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      })

      if (staffResponse.ok) {
        const data = await staffResponse.json()
        if (data.success) {
          // Staff login successful
          localStorage.setItem('admin-user', JSON.stringify(data.user))
          localStorage.setItem('admin-session', Date.now().toString())

          // Redirect based on role (case-insensitive)
          const userRole = data.user.role?.toLowerCase()
          if (userRole === 'admin') {
            alert(`Selamat datang, ${data.user.name}! Mengalihkan ke Admin Dashboard...`)
            router.push('/admin')
          } else if (userRole === 'kasir' || userRole === 'cashier') {
            alert(`Selamat datang, ${data.user.name}! Mengalihkan ke POS...`)
            router.push('/pos')
          } else {
            alert('Role tidak dikenali. Hubungi administrator.')
          }
          setLoading(false)
          return
        }
      }

      // If staff login failed, try member login
      let memberResponse = await fetch('/api/members/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      })

      if (memberResponse.ok) {
        const data = await memberResponse.json()
        if (data.success) {
          // Member login successful
          localStorage.setItem('member', JSON.stringify(data.member))
          alert(`Selamat datang kembali, ${data.member.name}!`)
          router.push('/')
          setLoading(false)
          return
        }
      }

      // Both login attempts failed
      alert('Email atau password salah')

    } catch (error) {
      console.error('Login error:', error)
      alert('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!registerForm.name || !registerForm.username || !registerForm.phone || !registerForm.email || !registerForm.password) {
      alert('Mohon lengkapi semua field yang wajib diisi!')
      return
    }

    if (registerForm.username.length < 3) {
      alert('Username minimal 3 karakter!')
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
          username: registerForm.username,
          name: registerForm.name,
          phone: registerForm.phone,
          email: registerForm.email,
          address: registerForm.address || null,
          password: registerForm.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Show success notification and switch to login
        alert('Pendaftaran berhasil! Silakan login dengan email Anda.')
        setLoginForm({
          email: registerForm.email,
          password: ''
        })
        setRegisterForm({
          name: '',
          username: '',
          phone: '',
          email: '',
          address: '',
          password: '',
          confirmPassword: ''
        })
        setShowRegister(false)
      } else {
        // Show specific error message
        alert(data.error || 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pattern-gradient-orange flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-orange-600" />
            <span className="text-orange-600 font-medium">Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow hover:scale-105">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AYAM GEPREK SAMBAL IJO</h1>
              <p className="text-sm text-gray-500">Login</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="card-glass-orange shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Selamat Datang!</CardTitle>
            <CardDescription className="text-center">
              Masuk dengan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="input-glass border-orange-200/60"
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    className="input-glass border-orange-200/60 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Lupa Password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full btn-premium-orange py-6 text-lg"
              >
                {loading ? 'Memproses...' : 'Login'}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setShowRegister(!showRegister)}
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
              >
                {showRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar Sekarang'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Register Card (shown below) */}
        {showRegister && (
          <Card className="card-glass-orange shadow-2xl mt-6">
            <CardHeader>
              <CardTitle className="text-xl text-center">Daftar Member Baru</CardTitle>
              <CardDescription className="text-center">
                Isi form di bawah untuk mendaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    className="input-glass border-orange-200/60"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-username" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-600" />
                    Username *
                  </Label>
                  <Input
                    id="reg-username"
                    type="text"
                    placeholder="Minimal 3 karakter"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                    className="input-glass border-orange-200/60"
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
                    className="input-glass border-orange-200/60"
                  />
                </div>

                <div>
                  <Label htmlFor="reg-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-600" />
                    Email *
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="email@example.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    className="input-glass border-orange-200/60"
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
                  >
                    {loading ? 'Mendaftar...' : 'Daftar'}
                  </Button>
                </div>
              </form>
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
