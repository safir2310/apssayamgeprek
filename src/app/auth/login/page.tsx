'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Flame, Mail, Lock, Eye, EyeOff, Store, User } from 'lucide-react'
import Link from 'next/link'

export default function AuthLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store user data in localStorage
        localStorage.setItem('admin-user', JSON.stringify(data.user))
        localStorage.setItem('admin-session', Date.now().toString())

        // Redirect based on role
        if (data.user.role === 'admin') {
          alert(`Selamat datang, ${data.user.name}! Mengalihkan ke Admin Dashboard...`)
          router.push('/admin')
        } else if (data.user.role === 'kasir') {
          alert(`Selamat datang, ${data.user.name}! Mengalihkan ke POS...`)
          router.push('/pos')
        } else {
          alert('Role tidak dikenali. Hubungi administrator.')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AYAM GEPREK SAMBAL IJO</h1>
              <p className="text-sm text-gray-500">Login Staff</p>
            </div>
          </div>
        </div>

        <Card className="border-orange-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login Staff</CardTitle>
            <CardDescription className="text-center">
              Masuk sebagai Admin atau Kasir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="border-orange-200 focus:border-orange-500"
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t border-orange-200 space-y-3">
              <Link href="/" className="block">
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Halaman Utama (Customer)
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button
                  variant="ghost"
                  className="w-full text-gray-600 hover:bg-orange-50"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login Member
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Default Accounts Info */}
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm text-orange-800 mb-3">📋 Akun Default:</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white p-2 rounded border border-orange-200">
                <div>
                  <span className="font-semibold">Admin:</span> admin@geprek.com / admin123
                </div>
                <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">Admin</span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded border border-orange-200">
                <div>
                  <span className="font-semibold">Kasir:</span> kasir@geprek.com / kasir123
                </div>
                <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">Kasir</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
