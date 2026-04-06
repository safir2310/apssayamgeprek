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
import { Gift, Plus, Edit, Trash2, Search, Package, ArrowLeft, Upload, X, LogOut } from 'lucide-react'
import Link from 'next/link'

interface PointExchangeProduct {
  id: string
  name: string
  description: string | null
  image: string | null
  points: number
  type: string
  value: number | null
  productId: string | null
  stock: number
  isActive: boolean
  availableRedeemCodes: number
  createdAt: string
  updatedAt: string
}

export default function PointExchangeProductsPage() {
  const [products, setProducts] = useState<PointExchangeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<PointExchangeProduct | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<PointExchangeProduct | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    points: '',
    type: 'DISCOUNT_FIXED',
    value: '',
    productId: '',
    stock: '',
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/point-exchange-products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching point exchange products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        image: formData.image || null,
        points: parseInt(formData.points),
        type: formData.type,
        value: formData.value ? parseFloat(formData.value) : null,
        productId: formData.productId || null,
        stock: parseInt(formData.stock),
        isActive: formData.isActive
      }

      const url = editingProduct
        ? `/api/admin/point-exchange-products/${editingProduct.id}`
        : '/api/admin/point-exchange-products'

      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan produk!')
        return
      }

      alert(editingProduct ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!')
      setShowDialog(false)
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Terjadi kesalahan saat menyimpan produk!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product: PointExchangeProduct) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      image: product.image || '',
      points: product.points.toString(),
      type: product.type,
      value: product.value?.toString() || '',
      productId: product.productId || '',
      stock: product.stock.toString(),
      isActive: product.isActive
    })
    setImagePreview(product.image || null)
    setShowDialog(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Mohon upload file gambar saja!')
      return
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimal 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setFormData({ ...formData, image: base64 })
      setImagePreview(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleClearImage = () => {
    setFormData({ ...formData, image: '' })
    setImagePreview(null)
  }

  const handleDelete = async () => {
    if (!deleteDialog) return

    try {
      const response = await fetch(`/api/admin/point-exchange-products/${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menghapus produk!')
        return
      }

      alert('Produk berhasil dihapus!')
      setDeleteDialog(null)
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Terjadi kesalahan saat menghapus produk!')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      points: '',
      type: 'DISCOUNT_FIXED',
      value: '',
      productId: '',
      stock: '',
      isActive: true
    })
    setImagePreview(null)
  }

  const handleOpenDialog = () => {
    setEditingProduct(null)
    resetForm()
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingProduct(null)
    resetForm()
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DISCOUNT_FIXED':
        return 'Diskon Tetap'
      case 'DISCOUNT_PERCENT':
        return 'Diskon Persen'
      case 'FREE_PRODUCT':
        return 'Produk Gratis'
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DISCOUNT_FIXED':
        return 'bg-green-100 text-green-700'
      case 'DISCOUNT_PERCENT':
        return 'bg-blue-100 text-blue-700'
      case 'FREE_PRODUCT':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk Tukar Point</h1>
              <p className="text-sm text-gray-500">Kelola produk yang dapat ditukar dengan poin member</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenDialog}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Produk
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-orange-600" />
                Daftar Produk Tukar Point ({products.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-500 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead className="font-semibold text-gray-700">Nama Produk</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tipe</TableHead>
                    <TableHead className="font-semibold text-gray-700">Poin</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nilai/Produk</TableHead>
                    <TableHead className="font-semibold text-gray-700">Stok</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kode Aktif</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-orange-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                              <Gift className="w-6 h-6 text-orange-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(product.type)}>
                          {getTypeLabel(product.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-orange-600">
                        {product.points.toLocaleString()} Poin
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {product.type === 'FREE_PRODUCT' ? (
                          <span className="text-xs">ID: {product.productId || '-'}</span>
                        ) : product.value ? (
                          product.type === 'DISCOUNT_PERCENT' ? (
                            `${product.value}%`
                          ) : (
                            `Rp${product.value.toLocaleString('id-ID')}`
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {product.availableRedeemCodes}
                      </TableCell>
                      <TableCell>
                        <Badge className={product.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {product.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada produk ditemukan
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
              <Gift className="w-5 h-5 text-orange-600" />
              {editingProduct ? 'Edit Produk Tukar Point' : 'Tambah Produk Tukar Point Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama produk"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi produk (opsional)"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipe Produk *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT_FIXED">Diskon Tetap (Rp)</SelectItem>
                    <SelectItem value="DISCOUNT_PERCENT">Diskon Persen (%)</SelectItem>
                    <SelectItem value="FREE_PRODUCT">Produk Gratis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="points">Poin yang Diperlukan *</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="0"
                  required
                  min="1"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              {formData.type === 'DISCOUNT_FIXED' || formData.type === 'DISCOUNT_PERCENT' ? (
                <div>
                  <Label htmlFor="value">
                    {formData.type === 'DISCOUNT_PERCENT' ? 'Persentase Diskon (%) *' : 'Nilai Diskon (Rp) *'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="0"
                    required
                    min="0.01"
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>
              ) : null}
              {formData.type === 'FREE_PRODUCT' ? (
                <div>
                  <Label htmlFor="productId">ID Produk *</Label>
                  <Input
                    id="productId"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    placeholder="Masukkan ID produk"
                    required
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>
              ) : null}
              <div>
                <Label htmlFor="stock">Stok *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  required
                  min="0"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="image">Foto Produk</Label>
                <div className="mt-2 space-y-3">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs h-48 object-contain border-2 border-gray-200 rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleClearImage}
                        className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Gift className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Belum ada foto produk</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                          <Upload className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-gray-700">Upload dari Perangkat</span>
                        </div>
                      </Label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => {
                          setFormData({ ...formData, image: e.target.value })
                          setImagePreview(e.target.value)
                        }}
                        placeholder="Atau masukkan URL gambar..."
                        className="border-orange-200 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload gambar (PNG, JPG, JPEG). Maksimal ukuran 2MB.
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Produk Aktif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {submitting ? 'Menyimpan...' : editingProduct ? 'Update' : 'Simpan'}
                </Button>
              </div>
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
              Hapus Produk
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Apakah Anda yakin ingin menghapus produk <strong>{deleteDialog?.name}</strong>?
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
