'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Settings, ArrowLeft, Store, Phone, MapPin, CreditCard, Save, Upload, X, LogOut } from 'lucide-react'
import Link from 'next/link'

interface StoreSettings {
  id: string
  storeName: string
  storeAddress: string | null
  storePhone: string | null
  qrisImage: string | null
  qrisEnabled: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    qrisImage: '',
    qrisEnabled: true
  })
  const [previewQris, setPreviewQris] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          storeName: data.storeName,
          storeAddress: data.storeAddress || '',
          storePhone: data.storePhone || '',
          qrisImage: data.qrisImage || '',
          qrisEnabled: data.qrisEnabled ?? true
        })
        if (data.qrisImage) {
          setPreviewQris(data.qrisImage)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        storeName: formData.storeName,
        storeAddress: formData.storeAddress || null,
        storePhone: formData.storePhone || null,
        qrisImage: formData.qrisImage || null,
        qrisEnabled: formData.qrisEnabled
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        alert('Gagal menyimpan pengaturan!')
        return
      }

      alert('Pengaturan berhasil disimpan!')
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Terjadi kesalahan saat menyimpan pengaturan!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setFormData({ ...formData, qrisImage: base64 })
      setPreviewQris(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleClearQris = () => {
    setFormData({ ...formData, qrisImage: '' })
    setPreviewQris(null)
  }

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar?')) {
      return
    }

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })

      if (response.ok) {
        localStorage.removeItem('admin-user')
        localStorage.removeItem('admin-session')
        window.location.href = '/'
      } else {
        alert('Gagal logout. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Error during logout:', error)
      alert('Terjadi kesalahan saat logout')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-sm text-gray-500">Pengaturan toko dan sistem</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Information */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-600" />
                Informasi Toko
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Nama Toko *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Masukkan nama toko"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="storeAddress">Alamat Toko</Label>
                <Input
                  id="storeAddress"
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  placeholder="Masukkan alamat lengkap toko"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="storePhone">Nomor Telepon Toko</Label>
                <Input
                  id="storePhone"
                  type="tel"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* QRIS Settings */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                Pengaturan QRIS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                  <Label htmlFor="qrisEnabled">Aktifkan Pembayaran QRIS</Label>
                </div>
                <Switch
                  id="qrisEnabled"
                  checked={formData.qrisEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, qrisEnabled: checked })}
                />
              </div>

              <Separator />

              <div>
                <Label>Gambar QRIS</Label>
                <div className="mt-2 space-y-3">
                  {previewQris ? (
                    <div className="relative inline-block">
                      <img
                        src={previewQris}
                        alt="QRIS Preview"
                        className="max-w-xs border-2 border-gray-200 rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleClearQris}
                        className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Belum ada gambar QRIS</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleQrisUpload}
                      disabled={!formData.qrisEnabled}
                      className="flex-1"
                    />
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload gambar QRIS (PNG, JPG, JPEG). Maksimal ukuran 1MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
