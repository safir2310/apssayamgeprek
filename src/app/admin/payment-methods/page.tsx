'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, Plus, Edit, Trash2, ArrowLeft, DollarSign, QrCode, Smartphone, Wallet, Landmark } from 'lucide-react'
import Link from 'next/link'

interface PaymentMethod {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const DEFAULT_ICONS = ['DollarSign', 'CreditCard', 'QrCode', 'Smartphone', 'Wallet', 'Landmark']

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<PaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    icon: '',
    isActive: true,
    sortOrder: 0
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder
      }

      const url = editingMethod
        ? `/api/admin/payment-methods/${editingMethod.id}`
        : '/api/admin/payment-methods'

      const method = editingMethod ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan metode pembayaran!')
        return
      }

      alert(editingMethod ? 'Metode pembayaran berhasil diperbarui!' : 'Metode pembayaran berhasil ditambahkan!')
      setShowDialog(false)
      setEditingMethod(null)
      resetForm()
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error saving payment method:', error)
      alert('Terjadi kesalahan saat menyimpan metode pembayaran!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      code: method.code,
      name: method.name,
      description: method.description || '',
      icon: method.icon || '',
      isActive: method.isActive,
      sortOrder: method.sortOrder
    })
    setShowDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteDialog) return

    try {
      const response = await fetch(`/api/admin/payment-methods/${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menghapus metode pembayaran!')
        return
      }

      alert('Metode pembayaran berhasil dihapus!')
      setDeleteDialog(null)
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      alert('Terjadi kesalahan saat menghapus metode pembayaran!')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      icon: '',
      isActive: true,
      sortOrder: 0
    })
  }

  const handleOpenDialog = () => {
    setEditingMethod(null)
    resetForm()
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingMethod(null)
    resetForm()
  }

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      DollarSign,
      CreditCard,
      QrCode,
      Smartphone,
      Wallet,
      Landmark
    }
    const Icon = icons[iconName] || CreditCard
    return <Icon className="w-5 h-5" />
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
              <h1 className="text-2xl font-bold text-gray-800">Payment Methods</h1>
              <p className="text-sm text-gray-500">Kelola metode pembayaran yang tersedia</p>
            </div>
          </div>
          <Button
            onClick={handleOpenDialog}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Metode
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              Daftar Metode Pembayaran ({paymentMethods.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead className="font-semibold text-gray-700">Icon</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kode</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nama</TableHead>
                    <TableHead className="font-semibold text-gray-700">Deskripsi</TableHead>
                    <TableHead className="font-semibold text-gray-700">Urutan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id} className="hover:bg-orange-50">
                      <TableCell>
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center text-orange-600">
                          {getIconComponent(method.icon || 'CreditCard')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">{method.code}</TableCell>
                      <TableCell className="font-semibold text-gray-800">{method.name}</TableCell>
                      <TableCell className="text-gray-600">{method.description || '-'}</TableCell>
                      <TableCell className="text-gray-600">{method.sortOrder}</TableCell>
                      <TableCell>
                        <Badge className={method.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {method.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(method)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog(method)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paymentMethods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Belum ada metode pembayaran
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              {editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Kode *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CASH, QRIS, DEBIT, dll."
                required
                className="border-orange-200 focus:border-orange-500 font-mono"
                disabled={!!editingMethod}
              />
              <p className="text-xs text-gray-500 mt-1">Kode unik untuk identifikasi metode pembayaran</p>
            </div>
            <div>
              <Label htmlFor="name">Nama Metode *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tunai, QRIS, Kartu Debit, dll."
                required
                className="border-orange-200 focus:border-orange-500"
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat (opsional)"
                className="border-orange-200 focus:border-orange-500"
              />
            </div>
            <div>
              <Label htmlFor="icon">Icon</Label>
              <select
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:border-orange-500"
              >
                <option value="">Pilih icon</option>
                {DEFAULT_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Urutan Tampilan</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="border-orange-200 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Semakin kecil angka, semakin di atas tampilannya</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Metode Aktif</Label>
              </div>
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {submitting ? 'Menyimpan...' : editingMethod ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Hapus Metode Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Apakah Anda yakin ingin menghapus metode pembayaran <strong>{deleteDialog?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Hapus
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
