'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Ticket, Plus, Edit, Trash2, ArrowLeft, Calendar, Gift, Percent, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  isActive: boolean
}

interface Promo {
  id: string
  code: string
  name: string
  description: string | null
  type: string
  value: number
  minPurchase: number | null
  maxDiscount: number | null
  productId: string | null
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Promo | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    minPurchase: 0,
    maxDiscount: 0,
    productId: '',
    startDate: '',
    endDate: '',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPromos()
    fetchProducts()
  }, [])

  const fetchPromos = async () => {
    try {
      const response = await fetch('/api/admin/promos')
      if (response.ok) {
        const data = await response.json()
        setPromos(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching promos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: parseFloat(formData.value.toString()),
        minPurchase: formData.minPurchase > 0 ? parseFloat(formData.minPurchase.toString()) : null,
        maxDiscount: formData.maxDiscount > 0 ? parseFloat(formData.maxDiscount.toString()) : null,
        productId: (formData.type === 'FREE_PRODUCT' || formData.type === 'BOGO') ? formData.productId : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      }

      const url = editingPromo
        ? `/api/admin/promos/${editingPromo.id}`
        : '/api/admin/promos'

      const method = editingPromo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan promo!')
        return
      }

      alert(editingPromo ? 'Promo berhasil diperbarui!' : 'Promo berhasil ditambahkan!')
      setShowDialog(false)
      setEditingPromo(null)
      resetForm()
      fetchPromos()
    } catch (error) {
      console.error('Error saving promo:', error)
      alert('Terjadi kesalahan saat menyimpan promo!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (promo: Promo) => {
    setEditingPromo(promo)
    setFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      value: promo.value,
      minPurchase: promo.minPurchase || 0,
      maxDiscount: promo.maxDiscount || 0,
      productId: promo.productId || '',
      startDate: new Date(promo.startDate).toISOString().split('T')[0],
      endDate: new Date(promo.endDate).toISOString().split('T')[0],
      isActive: promo.isActive
    })
    setShowDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteDialog) return

    try {
      const response = await fetch(`/api/admin/promos/${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menghapus promo!')
        return
      }

      alert('Promo berhasil dihapus!')
      setDeleteDialog(null)
      fetchPromos()
    } catch (error) {
      console.error('Error deleting promo:', error)
      alert('Terjadi kesalahan saat menghapus promo!')
    }
  }

  const resetForm = () => {
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minPurchase: 0,
      maxDiscount: 0,
      productId: '',
      startDate: today.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      isActive: true
    })
  }

  const handleOpenDialog = () => {
    setEditingPromo(null)
    resetForm()
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingPromo(null)
    resetForm()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-4 h-4" />
      case 'FIXED':
        return <DollarSign className="w-4 h-4" />
      case 'FREE_PRODUCT':
      case 'BOGO':
        return <Gift className="w-4 h-4" />
      default:
        return <Ticket className="w-4 h-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Badge className="bg-blue-500">Persentase</Badge>
      case 'FIXED':
        return <Badge className="bg-green-500">Fixed</Badge>
      case 'FREE_PRODUCT':
        return <Badge className="bg-purple-500">Produk Gratis</Badge>
      case 'BOGO':
        return <Badge className="bg-orange-500">BOGO</Badge>
      default:
        return <Badge className="bg-gray-500">{type}</Badge>
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
              <h1 className="text-2xl font-bold text-gray-800">Voucher & Promo</h1>
              <p className="text-sm text-gray-500">Kelola voucher dan promo untuk pelanggan</p>
            </div>
          </div>
          <Button
            onClick={handleOpenDialog}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Voucher
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-600" />
              Daftar Voucher ({promos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead className="font-semibold text-gray-700">Kode</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nama</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tipe</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nilai</TableHead>
                    <TableHead className="font-semibold text-gray-700">Periode</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promos.map((promo) => (
                    <TableRow key={promo.id} className="hover:bg-orange-50">
                      <TableCell className="font-mono text-sm text-orange-600 font-semibold">
                        {promo.code}
                      </TableCell>
                      <TableCell className="text-gray-800">{promo.name}</TableCell>
                      <TableCell>{getTypeBadge(promo.type)}</TableCell>
                      <TableCell className="text-gray-600">
                        {promo.type === 'PERCENTAGE'
                          ? `${promo.value}%`
                          : promo.type === 'FIXED'
                          ? `Rp${promo.value.toLocaleString('id-ID')}`
                          : 'Produk Gratis'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(promo.startDate).toLocaleDateString('id-ID')} - {new Date(promo.endDate).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={promo.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {promo.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(promo)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog(promo)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {promos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Belum ada voucher atau promo
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-600" />
              {editingPromo ? 'Edit Voucher/Promo' : 'Tambah Voucher/Promo Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Kode Voucher *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="PROMO123"
                required
                className="border-orange-200 focus:border-orange-500 font-mono uppercase"
                disabled={!!editingPromo}
              />
              <p className="text-xs text-gray-500 mt-1">Kode unik yang akan dimasukkan pelanggan</p>
            </div>

            <div>
              <Label htmlFor="name">Nama Promo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Promo Spesial Lebaran"
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
                placeholder="Deskripsi singkat promo (opsional)"
                className="border-orange-200 focus:border-orange-500"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipe Promo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="border-orange-200 focus:border-orange-500">
                  <SelectValue placeholder="Pilih tipe promo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Diskon Persentase (%)</SelectItem>
                  <SelectItem value="FIXED">Diskon Fixed (Rp)</SelectItem>
                  <SelectItem value="BOGO">Buy One Get One</SelectItem>
                  <SelectItem value="FREE_PRODUCT">Produk Gratis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'PERCENTAGE' && (
              <>
                <div>
                  <Label htmlFor="value">Persentase Diskon *</Label>
                  <Input
                    id="value"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder="10"
                    required
                    className="border-orange-200 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Persentase diskon (1-100%)</p>
                </div>

                <div>
                  <Label htmlFor="maxDiscount">Maksimal Diskon (Opsional)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                    placeholder="50000"
                    className="border-orange-200 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maksimal diskon dalam Rupiah</p>
                </div>
              </>
            )}

            {formData.type === 'FIXED' && (
              <div>
                <Label htmlFor="value">Nilai Diskon *</Label>
                <Input
                  id="value"
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  placeholder="10000"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">Nilai diskon dalam Rupiah</p>
              </div>
            )}

            {(formData.type === 'BOGO' || formData.type === 'FREE_PRODUCT') && (
              <div>
                <Label htmlFor="productId">Produk *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData({ ...formData, productId: value })}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(p => p.isActive && p.stock > 0)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - Rp{product.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'BOGO'
                    ? 'Produk yang akan diberikan gratis (Buy 1 Get 1)'
                    : 'Produk yang akan diberikan gratis'}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="minPurchase">Minimal Pembelian (Opsional)</Label>
              <Input
                id="minPurchase"
                type="number"
                min="0"
                step="1000"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                placeholder="50000"
                className="border-orange-200 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Minimal pembelian agar voucher bisa digunakan</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Tanggal Mulai *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Tanggal Selesai *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Promo Aktif</Label>
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
                {submitting ? 'Menyimpan...' : editingPromo ? 'Update' : 'Simpan'}
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
              Hapus Voucher
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Apakah Anda yakin ingin menghapus voucher <strong>{deleteDialog?.name}</strong>?
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
