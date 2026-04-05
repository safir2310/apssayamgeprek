'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Clock, DollarSign, User, ArrowLeft, Search, Filter, Download, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface Shift {
  id: string
  openingBalance: number
  closingBalance: number | null
  totalSales: number | null
  totalCash: number | null
  totalNonCash: number | null
  systemBalance: number | null
  physicalBalance: number | null
  difference: number | null
  isOpen: boolean
  openedAt: string
  closedAt: string | null
  cashier: {
    id: string
    name: string
    email: string
  }
  transactions: any[]
}

export default function ShiftReports() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    cashierId: '',
    status: '',
    startDate: '',
    endDate: ''
  })
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)

  useEffect(() => {
    fetchShifts()
  }, [])

  const fetchShifts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.cashierId) params.append('cashierId', filters.cashierId)
      if (filters.status) params.append('isOpen', filters.status === 'open')

      const response = await fetch(`/api/shifts?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setShifts(data.shifts || [])
      }
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Rp0'
    return `Rp${amount.toLocaleString('id-ID')}`
  }

  const getDifferenceColor = (diff: number | null) => {
    if (diff === null) return 'text-gray-500'
    if (diff === 0) return 'text-green-600'
    if (diff > 0) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Laporan Shift</h1>
              <p className="text-sm text-gray-500">Rekapan shift kasir</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-orange-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-600" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Kasir</Label>
                <Input
                  placeholder="Cari kasir..."
                  value={filters.cashierId}
                  onChange={(e) => setFilters({ ...filters, cashierId: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">Semua</option>
                  <option value="open">Terbuka</option>
                  <option value="closed">Ditutup</option>
                </select>
              </div>
              <div>
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shifts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : shifts.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum ada data shift</h3>
              <p className="text-gray-500">Data shift kasir akan muncul di sini</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="border-orange-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedShift(shift)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{shift.cashier.name}</h3>
                        <p className="text-sm text-gray-500">{shift.cashier.email}</p>
                      </div>
                    </div>
                    <Badge className={shift.isOpen ? 'bg-green-500' : 'bg-gray-500'}>
                      {shift.isOpen ? 'Terbuka' : 'Ditutup'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Modal Awal</p>
                      <p className="font-semibold text-gray-800">{formatCurrency(shift.openingBalance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Penjualan</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(shift.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tunai</p>
                      <p className="font-semibold text-gray-800">{formatCurrency(shift.totalCash)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Non-Tunai</p>
                      <p className="font-semibold text-gray-800">{formatCurrency(shift.totalNonCash)}</p>
                    </div>
                  </div>

                  {shift.closedAt && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Saldo Sistem</p>
                        <p className="font-semibold text-gray-800">{formatCurrency(shift.systemBalance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Saldo Fisik</p>
                        <p className="font-semibold text-gray-800">{formatCurrency(shift.physicalBalance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Selisih</p>
                        <p className={`font-bold ${getDifferenceColor(shift.difference)}`}>
                          {shift.difference !== null && (shift.difference > 0 ? '+' : '')}{formatCurrency(shift.difference)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(shift.openedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {shift.closedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(shift.closedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{shift.transactions.length} transaksi</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
