'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Flame, TrendingUp, ShoppingBag, Package, Users, BarChart3, LayoutDashboard, Settings, Menu, X, DollarSign, Calendar, Clock, ArrowUpRight, ArrowDownRight, Store, Printer, FileText, LogOut, Home, CreditCard, Gift, Cpu } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Store Information
const STORE_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758'
}

interface DashboardStats {
  todaySales: number
  weeklySales: number
  monthlySales: number
  totalOrders: number
  totalProducts: number
  activeMembers: number
}

interface SalesData {
  name: string
  date?: string
  week?: number
  month?: number
  year?: number
  sales: number
}

interface TopProduct {
  id: string
  name: string
  category: string
  totalQuantity: number
  totalRevenue: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  type: string
  customerName: string
  totalAmount: number
  status: string
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  itemCount: number
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dailySales, setDailySales] = useState<SalesData[]>([])
  const [weeklySales, setWeeklySales] = useState<SalesData[]>([])
  const [monthlySales, setMonthlySales] = useState<SalesData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [statsRes, dailyRes, weeklyRes, monthlyRes, topProductsRes, recentOrdersRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/sales-chart?period=daily'),
        fetch('/api/admin/dashboard/sales-chart?period=weekly'),
        fetch('/api/admin/dashboard/sales-chart?period=monthly'),
        fetch('/api/admin/dashboard/top-products?limit=10'),
        fetch('/api/admin/dashboard/recent-orders?limit=10')
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (dailyRes.ok) setDailySales(await dailyRes.json())
      if (weeklyRes.ok) setWeeklySales(await weeklyRes.json())
      if (monthlyRes.ok) setMonthlySales(await monthlyRes.json())
      if (topProductsRes.ok) setTopProducts(await topProductsRes.json())
      if (recentOrdersRes.ok) setRecentOrders(await recentOrdersRes.json())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
        // Clear localStorage
        localStorage.removeItem('admin-user')
        localStorage.removeItem('admin-session')

        // Redirect to login page
        window.location.href = '/'
      } else {
        alert('Gagal logout. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Error during logout:', error)
      alert('Terjadi kesalahan saat logout')
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
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
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

  const StatCard = ({ title, value, icon: Icon, trend, prefix = 'Rp' }: any) => (
    <Card className="border-orange-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {prefix}{value.toLocaleString('id-ID')}
            </p>
            {trend && (
              <p className={`text-sm mt-2 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {Math.abs(trend)}% dari periode sebelumnya
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const SalesChart = ({ data, title }: { data: SalesData[], title: string }) => (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f97316" opacity={0.1} />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff7ed',
                border: '1px solid #f97316',
                borderRadius: '8px'
              }}
              formatter={(value: number) => `Rp${value.toLocaleString('id-ID')}`}
            />
            <Bar dataKey="sales" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={1} />
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const navigationItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, href: '/admin' },
    { id: 'products', label: 'Product Management', icon: Package, href: '/admin/products' },
    { id: 'categories', label: 'Category Management', icon: ShoppingBag, href: '/admin/categories' },
    { id: 'point-exchange', label: 'Produk Tukar Point', icon: Gift, href: '/admin/point-exchange-products' },
    { id: 'orders', label: 'Order Management', icon: FileText, href: '/admin/orders' },
    { id: 'members', label: 'Member Management', icon: Users, href: '/admin/members' },
    { id: 'transactions', label: 'Transaction History', icon: BarChart3, href: '/admin/transactions' },
    { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard, href: '/admin/payment-methods' },
    { id: 'void-logs', label: 'Void Logs', icon: LogOut, href: '/admin/void-logs' },
    { id: 'cashiers', label: 'Cashier Management', icon: Users, href: '/admin/cashiers' },
    { id: 'shifts', label: 'Shift Reports', icon: Calendar, href: '/admin/shifts' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
    { id: 'development', label: 'Pengembangan', icon: Cpu, href: '/admin/development' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-white flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-orange-200 z-50 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-orange-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800 text-sm">Admin Panel</h1>
                <p className="text-xs text-gray-500">{STORE_INFO.name}</p>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              if (item.href && item.href !== '/admin') {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarOpen ? '' : 'mx-auto'}`} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                      : 'text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${sidebarOpen ? '' : 'mx-auto'}`} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-orange-200 flex-shrink-0 bg-white">
          <div className="space-y-2">
            <a
              href="/pos"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 transition-colors"
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Kembali ke POS</span>}
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className="bg-white border-b border-orange-200 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {navigationItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">Admin</p>
                <p className="text-xs text-gray-500">admin@ayamgeprek.com</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  title="Penjualan Hari Ini"
                  value={stats?.todaySales || 0}
                  icon={DollarSign}
                  trend={5.2}
                />
                <StatCard
                  title="Penjualan Minggu Ini"
                  value={stats?.weeklySales || 0}
                  icon={TrendingUp}
                  trend={8.1}
                />
                <StatCard
                  title="Penjualan Bulan Ini"
                  value={stats?.monthlySales || 0}
                  icon={Calendar}
                  trend={12.3}
                />
                <StatCard
                  title="Total Pesanan"
                  value={stats?.totalOrders || 0}
                  icon={ShoppingBag}
                  trend={3.5}
                  prefix=""
                />
                <StatCard
                  title="Total Produk"
                  value={stats?.totalProducts || 0}
                  icon={Package}
                  trend={0}
                  prefix=""
                />
                <StatCard
                  title="Member Aktif"
                  value={stats?.activeMembers || 0}
                  icon={Users}
                  trend={7.8}
                  prefix=""
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SalesChart data={dailySales} title="Penjualan Harian (7 Hari Terakhir)" />
                </div>
                <div className="lg:col-span-1">
                  <SalesChart data={weeklySales} title="Penjualan Mingguan" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <SalesChart data={monthlySales} title="Penjualan Bulanan" />
                </div>
                <div className="lg:col-span-2">
                  <Card className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                        Top 10 Produk Terlaris
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-3 pr-4">
                          {topProducts.map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                'bg-gray-400'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-600 text-sm">
                                {product.totalQuantity} terjual
                              </p>
                              <p className="text-xs text-gray-500">
                                Rp{product.totalRevenue.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ))}
                          {topProducts.length === 0 && (
                            <p className="text-center text-gray-500 py-8">Belum ada data penjualan</p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Orders */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Pesanan Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[500px]">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                      <thead>
                        <tr className="border-b border-orange-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">No. Pesanan</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tipe</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pelanggan</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Jumlah Item</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pembayaran</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Metode</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-orange-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                            <td className="py-3 px-4">
                              <Badge variant={order.type === 'POS' ? 'default' : 'secondary'} className={
                                order.type === 'POS' ? 'bg-blue-500' : 'bg-purple-500'
                              }>
                                {order.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{order.customerName}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{order.itemCount}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-orange-600">
                              Rp{order.totalAmount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                {order.paymentStatus}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{order.paymentMethod}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))}
                        {recentOrders.length === 0 && (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-gray-500">
                              Belum ada pesanan
                            </td>
                          </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== 'overview' && (
            <Card className="border-orange-200">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {navigationItems.find(i => i.id === activeTab)?.label}
                </h3>
                <p className="text-gray-600">Halaman ini sedang dalam pengembangan</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
