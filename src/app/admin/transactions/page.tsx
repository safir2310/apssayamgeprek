'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Search, ArrowLeft, Eye, DollarSign, Calendar, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react'
import Link from 'next/link'

interface TransactionItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  discount: number
  subtotal: number
}

interface Payment {
  id: string
  amount: number
  method: string
  reference: string | null
  status: string
  createdAt: string
}

interface Transaction {
  id: string
  transactionNumber: string
  cashierId: string
  cashierName: string
  shiftId: string
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  notes: string | null
  items: TransactionItem[]
  payments: Payment[]
  memberName: string | null
  memberPhone: string | null
  createdAt: string
  updatedAt: string
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [viewDialog, setViewDialog] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions')
      if (response.ok) {
        const result = await response.json()
        setTransactions(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-500'
      case 'VOID':
        return 'bg-red-500'
      case 'REFUND':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'VOID':
        return <XCircle className="w-4 h-4" />
      case 'REFUND':
        return <DollarSign className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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
      case 'PARTIAL':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.memberName && transaction.memberName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || transaction.paymentStatus === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
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
              <h1 className="text-2xl font-bold text-gray-800">Transaction History</h1>
              <p className="text-sm text-gray-500">Riwayat semua transaksi POS</p>
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
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Daftar Transaksi ({transactions.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-500 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="VOID">Void</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40 border-orange-200">
                    <SelectValue placeholder="Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
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
                    <TableHead className="font-semibold text-gray-700">No. Transaksi</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kasir</TableHead>
                    <TableHead className="font-semibold text-gray-700">Member</TableHead>
                    <TableHead className="font-semibold text-gray-700">Jumlah Item</TableHead>
                    <TableHead className="font-semibold text-gray-700">Total</TableHead>
                    <TableHead className="font-semibold text-gray-700">Diskon</TableHead>
                    <TableHead className="font-semibold text-gray-700">Final</TableHead>
                    <TableHead className="font-semibold text-gray-700">Metode</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-orange-50">
                      <TableCell className="font-semibold text-gray-900">{transaction.transactionNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800">{transaction.cashierName}</p>
                          <p className="text-xs text-gray-500">Shift: {transaction.shiftId.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{transaction.memberName || '-'}</TableCell>
                      <TableCell className="text-gray-600">{transaction.items.length} item</TableCell>
                      <TableCell className="text-gray-600">
                        Rp{transaction.totalAmount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {transaction.discount > 0 ? `Rp${transaction.discount.toLocaleString('id-ID')}` : '-'}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        Rp{transaction.finalAmount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100">
                          {transaction.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(transaction.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewDialog(transaction)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        Tidak ada transaksi ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* View Transaction Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Detail Transaksi #{viewDialog?.transactionNumber}
            </DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Kasir</p>
                  <p className="font-medium">{viewDialog.cashierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shift ID</p>
                  <p className="font-medium">{viewDialog.shiftId.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-medium">
                    {new Date(viewDialog.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Member Info */}
              {viewDialog.memberName && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Informasi Member</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Nama</p>
                      <p className="font-medium">{viewDialog.memberName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Telepon</p>
                      <p className="font-medium">{viewDialog.memberPhone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Item Transaksi</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Produk</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Qty</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Harga</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Diskon</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDialog.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.productName}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">Rp{item.price.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right text-red-600">
                            {item.discount > 0 ? `Rp${item.discount.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="p-3 text-right font-semibold">Rp{item.subtotal.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-50">
                      <tr>
                        <td colSpan={4} className="p-3 text-right font-bold text-gray-800">Subtotal</td>
                        <td className="p-3 text-right font-bold">Rp{viewDialog.totalAmount.toLocaleString('id-ID')}</td>
                      </tr>
                      {viewDialog.discount > 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-right font-bold text-gray-800">Diskon</td>
                          <td className="p-3 text-right font-bold text-red-600">-Rp{viewDialog.discount.toLocaleString('id-ID')}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="p-3 text-right font-bold text-gray-800">Final Total</td>
                        <td className="p-3 text-right font-bold text-orange-600 text-lg">
                          Rp{viewDialog.finalAmount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Informasi Pembayaran</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Metode</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-700">Jumlah</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Referensi</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewDialog.payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="p-3">{payment.method}</td>
                          <td className="p-3 text-right font-semibold">Rp{payment.amount.toLocaleString('id-ID')}</td>
                          <td className="p-3">{payment.reference || '-'}</td>
                          <td className="p-3">
                            <Badge className={getPaymentStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status Transaksi</p>
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
    </div>
  )
}
