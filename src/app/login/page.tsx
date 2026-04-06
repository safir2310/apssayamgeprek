'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Flame, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, ArrowLeft, KeyRound, Store, Shield, Users } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<'staff' | 'member'>('staff')
  const [showRegister, setShowRegister] = useState(false)

  // Login Form (Unified)
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
      console.log(`Attempting ${loginType} login with email:`, loginForm.email)

      // Determine which API to call based on login type
      const apiUrl = loginType === 'staff' ? '/api/auth/login' : '/api/members/login'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (loginType === 'staff') {
          // Store user data in localStorage
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
        } else {
          // Member login
          localStorage.setItem('member', JSON.stringify(data.member))
          alert(`Selamat datang kembali, ${data.member.name}!`)
          router.push('/')
        }
      } else {
        alert(data.error || 'Email atau password salah')
      }
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
              <p className="text-sm text-gray-500">Login</p>
            </div>
          </div>
        </div>

        <Card className="border-orange-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Selamat Datang!</CardTitle>
            <CardDescription className="text-center">
              Masuk sebagai Staff atau Member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="staff" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="member">Member</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              {/* Staff Login Tab */}
              <TabsContent value="staff">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="staff-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-600" />
                      Email Staff
                    </Label>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="admin@geprek.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="staff-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="staff-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
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
                    {loading ? 'Memproses...' : 'Login sebagai Staff'}
                  </Button>
                </form>

                {/* Staff Accounts Info */}
                <Card className="mt-6 border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm text-orange-800 mb-3">📋 Akun Staff:</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-white p-2 rounded border border-orange-200">
                        <div>
                          <span className="font-semibold">Admin:</span> admin@geprek.com / admin123
                        </div>
                        <Shield className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded border border-orange-200">
                        <div>
                          <span className="font-semibold">Kasir:</span> kasir@geprek.com / kasir123
                        </div>
                        <Store className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Member Login Tab */}
              <TabsContent value="member">
                <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="member-email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-orange-600" />
                      Email Member
                    </Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="member@example.com"
                      value={memberLoginForm.email}
                      onChange={(e) => setMemberLoginForm({ ...memberLoginForm, email: e.target.value })}
                      required
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="member-password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-orange-600" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="member-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan password"
                        value={memberLoginForm.password}
                        onChange={(e) => setMemberLoginForm({ ...memberLoginForm, password: e.target.value })}
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
                    {loading ? 'Memproses...' : 'Login sebagai Member'}
                  </Button>
                </form>

                {/* Member Account Info */}
                <Card className="mt-6 border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm text-orange-800 mb-2">👤 Akun Member Demo:</h3>
                    <p className="text-xs text-gray-600">
                      Email: member@geprek.com / Password: member123
                    </p>
                  </CardContent>
                </Card>
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
                      Email *
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="email@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
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
                    {loading ? 'Mendaftar...' : 'Daftar Member Baru'}
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
