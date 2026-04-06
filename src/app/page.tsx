'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ShoppingCart, Minus, Plus, X, Phone, MapPin, Clock, Award, Flame,
  Home as HomeIcon, QrCode, History, Gift, User, Store, LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'

// Store Information
const STORE_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758',
  tagline: 'Pedasnya Bikin Nagih 🔥'
}

// Default address for checkout
const DEFAULT_ADDRESS = 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151'

interface Product {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  stock: number
  category: string
  isActive: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: Date
  items: any[]
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [activeTab, setActiveTab] = useState<'beranda' | 'menu' | 'qr-member' | 'riwayat' | 'tukar-point' | 'profile'>('beranda')

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: DEFAULT_ADDRESS,
    notes: ''
  })

  // Loading state
  const [loading, setLoading] = useState(true)

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [memberPoints, setMemberPoints] = useState(0)

  // Member state
  const [currentMember, setCurrentMember] = useState<any>(null)

  // Fetch products and categories and load member from localStorage
  useEffect(() => {
    fetchProducts()
    if (activeTab === 'riwayat') {
      fetchOrders()
    }

    // Load member from localStorage
    const savedMember = localStorage.getItem('member')
    if (savedMember) {
      try {
        const member = JSON.parse(savedMember)
        setCurrentMember(member)
        setMemberPoints(member.points || 0)
      } catch (error) {
        console.error('Error parsing member data:', error)
        localStorage.removeItem('member')
      }
    }
  }, [activeTab])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        const uniqueCategories = Array.from(new Set(data.map((p: Product) => p.category)))
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock === 0) return

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      } else {
        return [...prevCart, { product, quantity: 1 }]
      }
      return prevCart
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(0, Math.min(item.quantity + change, item.product.stock))
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!')
      return
    }

    const orderData = {
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: checkoutForm.address,
      notes: checkoutForm.notes,
      totalAmount: getCartTotal(),
      paymentMethod: 'CASH',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Pesanan berhasil dibuat! Order #${result.orderNumber}`)
        setCart([])
        setCheckoutForm({ name: '', phone: '', address: DEFAULT_ADDRESS, notes: '' })
        setShowCheckout(false)
        setShowCart(false)
      } else {
        alert('Gagal membuat pesanan. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products.filter(p => p.isActive)
    : products.filter(p => p.isActive && p.category === selectedCategory)

  // Navigation items
  const navItems = [
    { id: 'beranda' as const, label: 'Beranda', icon: HomeIcon },
    { id: 'menu' as const, label: 'Menu', icon: Flame },
    { id: 'qr-member' as const, label: 'QR Member', icon: QrCode },
    { id: 'riwayat' as const, label: 'Riwayat', icon: History },
    { id: 'tukar-point' as const, label: 'Tukar Point', icon: Gift },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ]



  // Generate QR code pattern
  const generateQRPattern = (phone: string) => {
    // Simple visual pattern based on phone number
    const gridSize = 25
    const cells: string[] = []
    const phoneHash = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const isBlack = ((i * 17) + phoneHash) % 3 === 0 || 
                      ((i % gridSize) === 0 || (i % gridSize) === gridSize - 1 || 
                       Math.floor(i / gridSize) === 0 || Math.floor(i / gridSize) === gridSize - 1)
      cells.push(isBlack ? '#000' : '#fff')
    }
    return cells
  }

  // Handle member logout
  const handleMemberLogout = () => {
    setCurrentMember(null)
    setMemberPoints(0)
    localStorage.removeItem('member')
  }

  // Handle navigation tab click
  const handleTabClick = (tabId: string) => {
    // If clicking profile tab and not logged in, redirect to login
    if (tabId === 'profile' && !currentMember) {
      router.push('/login')
      return
    }
    // Otherwise, set the active tab
    setActiveTab(tabId as any)
  }

  // Beranda Section Component
  const BerandaSection = () => (
    <div className="pb-20">
      {/* Hero Section with Dark Orange Gradient */}
      <section className="relative bg-gradient-to-br from-orange-700 via-orange-600 to-orange-500 text-white py-16 px-4 md:py-24 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <Flame className="w-16 h-16 mx-auto mb-4 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center justify-center">
            {STORE_INFO.name}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-orange-100 text-center justify-center font-medium">
            {STORE_INFO.tagline}
          </p>
          <Button
            size="lg"
            className="bg-white text-orange-600 hover:bg-orange-100 font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => setActiveTab('menu')}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Pesan Sekarang
          </Button>

          {/* Store Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-0 text-white">
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 mx-auto mb-3" />
                <p className="font-semibold text-sm">{STORE_INFO.phone}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-0 text-white">
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3" />
                <p className="font-semibold text-sm">{STORE_INFO.address}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-0 text-white">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-3" />
                <p className="font-semibold text-sm">Buka Setiap Hari</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 md:px-8 bg-orange-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-orange-800">Kenapa Memilih Kami?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-orange-200">
              <CardContent className="p-6 text-center">
                <Flame className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-bold mb-2 text-orange-800">Rasa Autentik</h3>
                <p className="text-sm text-gray-600 text-justify">Sambal ijo dengan resep asli yang bikin ketagihan</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-6 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-bold mb-2 text-orange-800">Kualitas Terjamin</h3>
                <p className="text-sm text-gray-600 text-justify">Bahan baku segar dan higienis setiap hari</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="font-bold mb-2 text-orange-800">Pesan Online</h3>
                <p className="text-sm text-gray-600 text-justify">Mudah dan cepat, pesan dari rumah saja</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-orange-800">Akses Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link href="/login">
              <Button variant="outline" className="w-full h-20 text-lg border-orange-300 hover:bg-orange-50">
                <Store className="w-6 h-6 mr-2" />
                POS Kasir
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full h-20 text-lg border-orange-300 hover:bg-orange-50">
                <LayoutDashboard className="w-6 h-6 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )

  // Menu Section Component
  const MenuSection = () => (
    <div className="pb-24 bg-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 text-white py-4 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Menu Kami</h1>
            <p className="text-orange-100 text-xs">Pilih menu favoritmu</p>
          </div>
          <Button
            onClick={() => setShowCart(true)}
            className="bg-white text-orange-600 hover:bg-orange-100 relative"
            size="sm"
          >
            <ShoppingCart className="h-5 w-5" />
            {getCartCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {getCartCount()}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white border-b border-orange-200 sticky top-[60px] z-9">
        <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className={`${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0'
                  : 'border-orange-300 text-orange-700 hover:bg-orange-50'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              Semua
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={`${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0'
                    : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="py-4 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-orange-700">Memuat menu...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada produk tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden border-orange-200 hover:shadow-lg transition-shadow">
                  {product.image ? (
                    <div className="aspect-square bg-orange-100 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <Flame className="w-16 h-16 text-orange-400" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-xs md:text-sm mb-2 text-gray-800 line-clamp-2 min-h-[2rem]">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm md:text-base font-bold text-orange-600">
                        Rp{product.price.toLocaleString('id-ID')}
                      </span>
                      <Badge
                        variant={product.stock > 0 ? 'default' : 'secondary'}
                        className={`text-xs ${
                          product.stock > 0
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white text-sm"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Tambah
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )

  // QR Member Section
  const QRMemberSection = () => (
    <div className="pb-24 bg-orange-50 min-h-screen">
      <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">QR Member</h1>
          <p className="text-orange-100 text-xs">Scan QR code untuk mendapatkan point</p>
        </div>
      </header>
      <main className="py-8 px-4">
        <div className="max-w-md mx-auto">
          {!currentMember ? (
            <Card className="border-orange-200">
              <CardContent className="p-8 text-center">
                <User className="w-24 h-24 mx-auto mb-6 text-orange-300" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Login</h2>
                <p className="text-gray-600 mb-6">Login sebagai member untuk melihat QR code Anda</p>
                <Link href="/login" className="block">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  >
                    Login Member
                  </Button>
                </Link>
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <p className="text-sm text-gray-600 mb-2">Belum punya akun?</p>
                  <Link href="/login" className="block">
                    <Button
                      variant="outline"
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      Daftar Member Baru
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Member Info Card */}
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800">{currentMember.name}</h2>
                      <p className="text-sm text-gray-500">{currentMember.phone}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMemberLogout}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Card */}
              <Card className="border-orange-200">
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">QR Code Member</h3>
                  <div className="bg-white p-4 rounded-lg border-4 border-orange-200 inline-block mb-4">
                    <svg width={200} height={200} viewBox="0 0 25 25" className="w-48 h-48">
                      {generateQRPattern(currentMember.phone).map((color, index) => (
                        <rect
                          key={index}
                          x={index % 25}
                          y={Math.floor(index / 25)}
                          width={1}
                          height={1}
                          fill={color}
                        />
                      ))}
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Scan QR code ini saat melakukan transaksi</p>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-xs text-gray-600 font-mono">ID: {currentMember.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Points Card */}
              <Card className="border-orange-200">
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                  <h2 className="text-3xl font-bold text-orange-600 mb-2">{memberPoints}</h2>
                  <p className="text-gray-600">Point Tersedia</p>
                  <div className="mt-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600">Rp1.000 = 1 Point</p>
                    <p className="text-sm text-gray-600 mt-2">Tukarkan point di menu Tukar Point</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )

  // Riwayat Pesanan Section
  const RiwayatSection = () => (
    <div className="pb-24 bg-orange-50 min-h-screen">
      <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Riwayat Pesanan</h1>
          <p className="text-orange-100 text-xs">Lihat riwayat pesanan Anda</p>
        </div>
      </header>
      <main className="py-4 px-4">
        <div className="max-w-4xl mx-auto">
          {orders.length === 0 ? (
            <Card className="border-orange-200">
              <CardContent className="p-12 text-center">
                <History className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Belum Ada Pesanan</h2>
                <p className="text-gray-500 mb-6">Anda belum memiliki riwayat pesanan</p>
                <Button
                  onClick={() => setActiveTab('menu')}
                  className="bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                >
                  Pesan Sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-800">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">
                          Rp{order.totalAmount.toLocaleString('id-ID')}
                        </p>
                        <Badge
                          className={
                            order.status === 'COMPLETED'
                              ? 'bg-green-500 text-white'
                              : order.status === 'PENDING'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-500 text-white'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="border-t border-orange-200 pt-3">
                      <p className="text-sm text-gray-600 mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.product?.name || 'Product'} x {item.quantity}</span>
                            <span className="text-gray-700">Rp{(item.quantity * item.price).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )

  // Tukar Point Section
  const TukarPointSection = () => (
    <div className="pb-24 bg-orange-50 min-h-screen">
      <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Tukar Point</h1>
            <p className="text-orange-100 text-xs">Tukarkan point Anda dengan hadiah</p>
          </div>
          <Badge className="bg-white/20 text-white">
            <Gift className="w-4 h-4 mr-1" />
            {memberPoints} Point
          </Badge>
        </div>
      </header>
      <main className="py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-orange-200">
              <CardContent className="p-6 text-center">
                <Gift className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <h3 className="font-bold text-lg mb-2">Diskon Rp10.000</h3>
                <p className="text-orange-600 font-bold text-2xl mb-2">100 Point</p>
                <p className="text-sm text-gray-500 mb-4">Diskon Rp10.000 untuk pembayaran</p>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  disabled={memberPoints < 100}
                >
                  Tukar
                </Button>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-6 text-center">
                <Gift className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <h3 className="font-bold text-lg mb-2">Diskon Rp25.000</h3>
                <p className="text-orange-600 font-bold text-2xl mb-2">250 Point</p>
                <p className="text-sm text-gray-500 mb-4">Diskon Rp25.000 untuk pembayaran</p>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  disabled={memberPoints < 250}
                >
                  Tukar
                </Button>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-6 text-center">
                <Gift className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                <h3 className="font-bold text-lg mb-2">Menu Gratis</h3>
                <p className="text-orange-600 font-bold text-2xl mb-2">500 Point</p>
                <p className="text-sm text-gray-500 mb-4">Dapatkan 1 menu gratis pilihan</p>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  disabled={memberPoints < 500}
                >
                  Tukar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )

  // Profile Section
  const ProfileSection = () => (
    <div className="pb-24 bg-orange-50 min-h-screen">
      <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Profile</h1>
            <p className="text-orange-100 text-xs">Kelola akun Anda</p>
          </div>
          {currentMember && (
            <Badge className="bg-white/20 text-white">
              <Award className="w-4 h-4 mr-1" />
              {memberPoints} Point
            </Badge>
          )}
        </div>
      </header>
      <main className="py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-orange-200 mb-4">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">{currentMember.name}</h2>
              <p className="text-gray-500 mb-2">{currentMember.phone}</p>
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-orange-500 text-white">
                  <Award className="w-3 h-3 mr-1" />
                  {memberPoints} Point
                </Badge>
                <Badge className="bg-green-500 text-white">
                  Active Member
                </Badge>
              </div>
            </CardContent>
          </Card>

          {currentMember && (
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                    <User className="w-5 h-5 mr-3 text-orange-600" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                    <MapPin className="w-5 h-5 mr-3 text-orange-600" />
                    Alamat Pengiriman
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                    <Gift className="w-5 h-5 mr-3 text-orange-600" />
                    Riwayat Point
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                    <Phone className="w-5 h-5 mr-3 text-orange-600" />
                    Pengaturan Notifikasi
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                    <Store className="w-5 h-5 mr-3 text-orange-600" />
                    Hubungi Kami
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentMember && (
            <Card className="border-orange-200 mt-4">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleMemberLogout}
                >
                  Keluar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )

  // Cart Dialog
  const CartDialog = () => (
    <Dialog open={showCart} onOpenChange={setShowCart}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keranjang Belanja</DialogTitle>
        </DialogHeader>
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-orange-300" />
            <p>Keranjang kosong</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="max-h-60">
              <div className="space-y-3">
                {cart.map(item => (
                  <Card key={item.product.id} className="border-orange-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                            <Flame className="w-8 h-8 text-orange-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-1">
                            {item.product.name}
                          </h4>
                          <p className="text-orange-600 font-bold text-sm">
                            Rp{item.product.price.toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 border-orange-300 hover:bg-orange-50"
                              onClick={() => updateQuantity(item.product.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 border-orange-300 hover:bg-orange-50"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              disabled={item.quantity >= item.product.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50 ml-auto"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600 text-sm">
                            Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-orange-200 pt-4">
              <div className="flex justify-between font-bold text-lg text-orange-800 mb-4">
                <span>Total</span>
                <span>Rp{getCartTotal().toLocaleString('id-ID')}</span>
              </div>
              <Button
                onClick={() => { setShowCheckout(true); setShowCart(false); }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
              >
                Lanjut ke Pembayaran
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  // Checkout Dialog
  const CheckoutDialog = () => (
    <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              required
              value={checkoutForm.name}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
              placeholder="Masukkan nama lengkap"
              className="border-orange-200 focus:border-orange-500"
            />
          </div>

          <div>
            <Label htmlFor="phone">No. WhatsApp *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={checkoutForm.phone}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className="border-orange-200 focus:border-orange-500"
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat Pengiriman *</Label>
            <Textarea
              id="address"
              required
              value={checkoutForm.address}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
              placeholder="Masukkan alamat lengkap"
              rows={3}
              className="border-orange-200 focus:border-orange-500"
            />
          </div>

          <div>
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={checkoutForm.notes}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
              placeholder="Catatan tambahan untuk pesanan"
              rows={2}
              className="border-orange-200 focus:border-orange-500"
            />
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Pembayaran:</span>
              <span className="text-orange-600">Rp{getCartTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white"
          >
            Konfirmasi Pesanan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Main Content */}
      {activeTab === 'beranda' && <BerandaSection />}
      {activeTab === 'menu' && <MenuSection />}
      {activeTab === 'qr-member' && <QRMemberSection />}
      {activeTab === 'riwayat' && <RiwayatSection />}
      {activeTab === 'tukar-point' && <TukarPointSection />}
      {activeTab === 'profile' && <ProfileSection />}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] transition-colors relative ${
                    isActive ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                  {/* Show points badge on Tukar Point */}
                  {item.id === 'tukar-point' && memberPoints > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                      {memberPoints}
                    </Badge>
                  )}
                </button>
              )}
            )}
          </div>
        </div>
      </nav>



      {/* Dialogs */}
      <CartDialog />
      <CheckoutDialog />
    </div>
  )
}
