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
import { Users, Plus, Edit, Trash2, Search, ArrowLeft, User, Shield, Lock, LogOut } from 'lucide-react'
import Link from 'next/link'

interface Cashier {
  id: string
  email: string
  name: string
  phone: string | null
  pin: string | null
  roleId: string
  roleName: string
  createdAt: string
  updatedAt: string
  transactionCount?: number
  shiftCount?: number
}

interface Role {
  id: string
  name: string
}

export default function CashierManagementPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Cashier | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    pin: '',
    roleId: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCashiers()
    fetchRoles()
  }, [])

  const fetchCashiers = async () => {
    try {
      const response = await fetch('/api/admin/cashiers')
      if (response.ok) {
        const result = await response.json()
        // Transform the data to match our interface
        const transformedCashiers = (result.data || []).map((c: any) => ({
          ...c,
          roleName: c.role?.name,
          transactionCount: c._count?.transactions || 0,
          shiftCount: c._count?.cashierShifts || 0
        }))
        setCashiers(transformedCashiers)
      }
    } catch (error) {
      console.error('Error fetching cashiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const result = await response.json()
        setRoles(result.data || [])
      } else {
        console.error('Failed to fetch roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || null,
        pin: formData.pin || null,
        roleId: formData.roleId
      }

      const url = editingCashier
        ? `/api/admin/cashiers/${editingCashier.id}`
        : '/api/admin/cashiers'

      const method = editingCashier ? 'PUT' : 'POST'

      // Don't send password if editing and it's empty
      if (editingCashier && !formData.password) {
        delete payload.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menyimpan kasir!')
        return
      }

      alert(editingCashier ? 'Kasir berhasil diperbarui!' : 'Kasir berhasil ditambahkan!')
      setShowDialog(false)
      setEditingCashier(null)
      resetForm()
      fetchCashiers()
    } catch (error) {
      console.error('Error saving cashier:', error)
      alert('Terjadi kesalahan saat menyimpan kasir!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cashier: Cashier) => {
    setEditingCashier(cashier)
    setFormData({
      email: cashier.email,
      password: '',
      name: cashier.name,
      phone: cashier.phone || '',
      pin: cashier.pin || '',
      roleId: cashier.roleId
    })
    setShowDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteDialog) return

    try {
      const response = await fetch(`/api/admin/cashiers/${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        alert('Gagal menghapus kasir!')
        return
      }

      alert('Kasir berhasil dihapus!')
      setDeleteDialog(null)
      fetchCashiers()
    } catch (error) {
      console.error('Error deleting cashier:', error)
      alert('Terjadi kesalahan saat menghapus kasir!')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      pin: '',
      roleId: ''
    })
  }

  const handleOpenDialog = () => {
    setEditingCashier(null)
    resetForm()
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingCashier(null)
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

  const filteredCashiers = cashiers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <h1 className="text-2xl font-bold text-gray-800">Cashier Management</h1>
              <p className="text-sm text-gray-500">Kelola semua kasir dan user</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenDialog}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kasir
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
                <Users className="w-5 h-5 text-orange-600" />
                Daftar Kasir ({cashiers.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari kasir..."
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
                    <TableHead className="font-semibold text-gray-700">Nama</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
                    <TableHead className="font-semibold text-gray-700">Role</TableHead>
                    <TableHead className="font-semibold text-gray-700">Jml Transaksi</TableHead>
                    <TableHead className="font-semibold text-gray-700">Jml Shift</TableHead>
                    <TableHead className="font-semibold text-gray-700">Terdaftar</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCashiers.map((cashier) => (
                    <TableRow key={cashier.id} className="hover:bg-orange-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{cashier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{cashier.email}</TableCell>
                      <TableCell className="text-gray-600">{cashier.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={cashier.roleName === 'Admin' ? 'bg-purple-500' : 'bg-blue-500'}>
                          <Shield className="w-3 h-3 mr-1" />
                          {cashier.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{cashier.transactionCount || 0}</TableCell>
                      <TableCell className="text-gray-600">{cashier.shiftCount || 0}</TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(cashier.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(cashier)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDialog(cashier)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCashiers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada kasir ditemukan
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              {editingCashier ? 'Edit Kasir' : 'Tambah Kasir Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  disabled={!!editingCashier}
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="password">
                  Password {editingCashier ? '(biarkan kosong jika tidak diubah)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password"
                  required={!editingCashier}
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081234567890 (opsional)"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="pin">PIN Supervisor</Label>
                <Input
                  id="pin"
                  type="text"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="1234 (opsional)"
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.roleId}
                  onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {submitting ? 'Menyimpan...' : editingCashier ? 'Update' : 'Simpan'}
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
              Hapus Kasir
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Apakah Anda yakin ingin menghapus kasir <strong>{deleteDialog?.name}</strong>?
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
