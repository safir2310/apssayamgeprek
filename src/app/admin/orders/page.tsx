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
import { FileText, Search, ArrowLeft, Package, Eye, CheckCircle, XCircle, Clock, Truck, LogOut, Printer } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

interface Order {
  id: string
  orderNumber: string
  customerId: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  notes: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewDialog, setViewDialog] = useState<Order | null>(null)
  const [updateDialog, setUpdateDialog] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [viewOrderDialog, setViewOrderDialog] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const result = await response.json()
        setOrders(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!updateDialog || !newStatus) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/orders/${updateDialog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        alert('Gagal mengupdate status pesanan!')
        return
      }

      alert('Status pesanan berhasil diupdate!')
      setUpdateDialog(null)
      setNewStatus('')
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Terjadi kesalahan saat mengupdate status!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickStatusUpdate = async (orderId: string, status: string) => {
    if (!confirm(`Ubah status pesanan menjadi ${status}?`)) return

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        alert('Gagal mengupdate status pesanan!')
        return
      }

      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Terjadi kesalahan saat mengupdate status!')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'PROCESSING':
        return 'bg-blue-500'
      case 'READY':
        return 'bg-purple-500'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'PROCESSING':
        return <Package className="w-4 h-4" />
      case 'READY':
        return <Truck className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'FAILED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
              <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
              <p className="text-sm text-gray-500">Kelola semua pesanan online</p>
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
      <div className="p-6">
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Daftar Pesanan ({orders.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-500 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead className="font-semibold text-gray-700">No. Pesanan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Pelanggan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Jumlah Item</TableHead>
                    <TableHead className="font-semibold text-gray-700">Total</TableHead>
                    <TableHead className="font-semibold text-gray-700">Pembayaran</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-orange-50">
                      <TableCell className="font-semibold text-gray-900">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{order.items.length} item</TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        Rp{order.totalAmount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{order.paymentMethod}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(order.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewDialog(order)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setUpdateDialog(order)
                              setNewStatus(order.status)
                            }}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Update Status"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          {order.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickStatusUpdate(order.id, 'PROCESSING')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Proses"
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                          )}
                          {order.status === 'PROCESSING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickStatusUpdate(order.id, 'READY')}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              title="Siap"
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          )}
                          {(order.status === 'READY' || order.status === 'PROCESSING') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickStatusUpdate(order.id, 'COMPLETED')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Selesai"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickStatusUpdate(order.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Batal"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada pesanan ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* View Order Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Detail Pesanan #{viewDialog?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Informasi Pelanggan</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Nama</p>
                    <p className="font-medium">{viewDialog.customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Telepon</p>
                    <p className="font-medium">{viewDialog.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Alamat</p>
                    <p className="font-medium">{viewDialog.customerAddress}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Item Pesanan</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Produk</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Harga</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDialog.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.productName}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">Rp{item.price.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right font-semibold">Rp{item.subtotal.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-bold text-gray-800">Total</td>
                        <td className="p-3 text-right font-bold text-orange-600">
                          Rp{viewDialog.totalAmount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status Pesanan</p>
                  <Badge className={getStatusColor(viewDialog.status)}>
                    {getStatusIcon(viewDialog.status)}
                    <span className="ml-1">{viewDialog.status}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status Pembayaran</p>
                  <Badge className={getPaymentStatusColor(viewDialog.paymentStatus)}>
                    {viewDialog.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Metode Pembayaran</p>
                  <p className="font-medium">{viewDialog.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal Pesanan</p>
                  <p className="font-medium">
                    {new Date(viewDialog.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {viewDialog.notes && (
                <div>
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="font-medium bg-gray-50 p-3 rounded">{viewDialog.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Update Status Pesanan
            </DialogTitle>
          </DialogHeader>
          {updateDialog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pesanan</p>
                <p className="font-semibold">{updateDialog.orderNumber}</p>
              </div>
              <div>
                <Label htmlFor="status">Status Baru</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="border-orange-200">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setUpdateDialog(null)}>
                  Batal
                </Button>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={submitting || !newStatus || newStatus === updateDialog.status}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
