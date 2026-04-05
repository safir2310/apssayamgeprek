'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LogOut, Search, ArrowLeft, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface VoidLog {
  id: string
  transactionId: string | null
  transactionNumber: string | null
  itemId: string | null
  type: string
  reason: string
  approvedBy: string | null
  approvedByName: string | null
  createdBy: string | null
  createdByName: string | null
  amount: number
  createdAt: string
}

export default function VoidLogsPage() {
  const [voidLogs, setVoidLogs] = useState<VoidLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchVoidLogs()
  }, [])

  const fetchVoidLogs = async () => {
    try {
      const response = await fetch('/api/admin/void-logs')
      if (response.ok) {
        const result = await response.json()
        // Transform the data to match our interface
        const transformedLogs = (result.data || []).map((log: any) => ({
          ...log,
          transactionNumber: log.transaction?.transactionNumber || null,
          approvedByName: log.approvedByUser?.name || null,
          createdByName: log.createdByUser?.name || null
        }))
        setVoidLogs(transformedLogs)
      }
    } catch (error) {
      console.error('Error fetching void logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TRANSACTION':
        return 'bg-red-500'
      case 'ITEM':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const filteredVoidLogs = voidLogs.filter(log => {
    const matchesSearch =
      log.transactionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.approvedByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.createdByName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || log.type === typeFilter

    return matchesSearch && matchesType
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
              <h1 className="text-2xl font-bold text-gray-800">Void Logs</h1>
              <p className="text-sm text-gray-500">Riwayat transaksi yang dibatalkan</p>
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
                <LogOut className="w-5 h-5 text-orange-600" />
                Riwayat Void ({voidLogs.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari void log..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-orange-200 focus:border-orange-500 w-64"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-orange-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="TRANSACTION">Transaction</option>
                  <option value="ITEM">Item</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[calc(100vh-300px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead className="font-semibold text-gray-700">Tipe</TableHead>
                    <TableHead className="font-semibold text-gray-700">No. Transaksi</TableHead>
                    <TableHead className="font-semibold text-gray-700">Alasan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Jumlah</TableHead>
                    <TableHead className="font-semibold text-gray-700">Dibuat Oleh</TableHead>
                    <TableHead className="font-semibold text-gray-700">Disetujui Oleh</TableHead>
                    <TableHead className="font-semibold text-gray-700">Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVoidLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-orange-50">
                      <TableCell>
                        <Badge className={getTypeColor(log.type)}>
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {log.transactionNumber || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate">
                        {log.reason}
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        -Rp{log.amount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800">{log.createdByName || '-'}</p>
                          <p className="text-xs text-gray-500">{log.createdBy || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-800">{log.approvedByName || '-'}</p>
                          <p className="text-xs text-gray-500">{log.approvedBy || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(log.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVoidLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="w-12 h-12 text-gray-300 mb-2" />
                          <p>Belum ada void log</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
