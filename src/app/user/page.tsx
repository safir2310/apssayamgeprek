'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingCart, Package, Search, Plus, Minus, X, Clock, CheckCircle, Flame, User, Phone, MapPin, Printer, QrCode, Star, Scan, Award, Gift } from 'lucide-react'
import QRCode from 'qrcode'

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

interface Member {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  points: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  items: {
    id: string
    productId: string
    productName?: string
    quantity: number
    price: number
    subtotal: number
    product?: {
      id: string
      name: string
      price: number
    }
  }[]
}

interface Member {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  points: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Member {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  points: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function UserDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartDialog, setShowCartDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [showMemberDialog, setShowMemberDialog] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [memberPhoneInput, setMemberPhoneInput] = useState('')
  const [searchingMember, setSearchingMember] = useState(false)
  const [orderSubTab, setOrderSubTab] = useState<'list' | 'receipt'>('list')

  // Order Form
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: ''
  })
  const [submittingOrder, setSubmittingOrder] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchOrders()
  }, [orderForm.customerPhone])

  // Fetch member info when phone changes
  useEffect(() => {
    if (orderForm.customerPhone && orderForm.customerPhone.length >= 10) {
      fetchMemberInfo(orderForm.customerPhone)
    } else {
      setMember(null)
    }
  }, [orderForm.customerPhone])

  // Generate QR Code when member changes
  useEffect(() => {
    if (member && member.phone) {
      QRCode.toDataURL(member.phone, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeUrl).catch(console.error)
    } else {
      setQrCodeUrl('')
    }
  }, [member])

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

  const fetchMemberByPhone = async (phone: string) => {
    if (!phone) {
      alert('Masukkan nomor telepon!')
      return
    }

    setSearchingMember(true)
    try {
      const response = await fetch(`/api/members/lookup?phone=${encodeURIComponent(phone)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          setMember(data.data)
          setMemberPhoneInput('')
          alert('Member ditemukan!')
        } else {
          alert('Member tidak ditemukan dengan nomor telepon ini!')
        }
      } else {
        alert('Gagal mencari member!')
      }
    } catch (error) {
      console.error('Error fetching member:', error)
      alert('Terjadi kesalahan saat mencari member!')
    } finally {
      setSearchingMember(false)
    }
  }

  // Generate simple barcode pattern based on phone number
  const generateBarcodePattern = (phone: string) => {
    const bars = phone.split('').map((char, index) => {
      const charCode = char.charCodeAt(0)
      const barWidth = (charCode % 5) + 2
      const isBlack = index % 2 === 0
      return {
        width: barWidth,
        color: isBlack ? '#000' : '#fff'
      }
    })
    return bars
  }

  const fetchMemberInfo = async (phone: string) => {
    try {
      const response = await fetch(`/api/members/lookup?phone=${phone}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setMember(data.data)
        } else {
          setMember(null)
        }
      }
    } catch (error) {
      console.error('Error fetching member info:', error)
      setMember(null)
    }
  }

  const fetchMember = async (phone: string) => {
    if (!phone) return
    try {
      const response = await fetch(`/api/members/lookup?phone=${encodeURIComponent(phone)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          setMember(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching member:', error)
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert('Stok habis!')
      return
    }

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
        alert('Stok tidak mencukupi!')
      } else {
        return [...prevCart, { product, quantity: 1 }]
      }
      return prevCart
    })
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, Math.min(item.quantity + change, item.product.stock))
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!')
      return
    }

    if (!orderForm.customerName || !orderForm.customerPhone || !orderForm.customerAddress) {
      alert('Mohon lengkapi semua data pengiriman!')
      return
    }

    setSubmittingOrder(true)

    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          customerAddress: orderForm.customerAddress,
          items,
          totalAmount: getCartTotal(),
          paymentMethod: 'CASH',
          notes: orderForm.notes
        })
      })

      if (!response.ok) {
        alert('Gagal membuat pesanan!')
        return
      }

      alert('Pesanan berhasil dibuat!')
      setCart([])
      setOrderForm({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        notes: ''
      })
      setShowOrderDialog(false)
      setShowCartDialog(false)
      fetchOrders()
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Terjadi kesalahan saat membuat pesanan!')
    } finally {
      setSubmittingOrder(false)
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products.filter(p => p.isActive && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())))
    : products.filter(p => p.isActive && p.category === selectedCategory && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())))

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

  const handlePrintReceipt = (order: Order) => {
    setSelectedOrderForPrint(order)
    setTimeout(() => {
      window.print()
      setSelectedOrderForPrint(null)
    }, 100)
  }

  // Generate QR code pattern based on phone number
  const generateQRPattern = (phone: string) => {
    const size = 200
    const modules = 25
    const cellSize = size / modules
    
    // Create a simple pattern based on phone number
    const pattern: boolean[][] = []
    for (let i = 0; i < modules; i++) {
      pattern[i] = []
      for (let j = 0; j < modules; j++) {
        // Create deterministic pattern from phone
        const charIndex = (i * modules + j) % phone.length
        const charCode = phone.charCodeAt(charIndex)
        const isBlack = (charCode + i + j) % 2 === 0
        
        // Add positioning patterns (corners)
        const isPositionPattern = 
          (i < 7 && j < 7) || 
          (i < 7 && j >= modules - 7) || 
          (i >= modules - 7 && j < 7)
        
        pattern[i][j] = isPositionPattern ? true : isBlack
      }
    }
    return { pattern, modules, cellSize }
  }

  // Generate simple barcode pattern based on phone number
  const generateBarcodePattern = (phone: string) => {
    const bars = phone.split('').map((char, index) => {
      const charCode = char.charCodeAt(0)
      const barWidth = (charCode % 5) + 2
      const isBlack = index % 2 === 0
      return {
        width: barWidth,
        color: isBlack ? '#000' : '#fff'
      }
    })
    return bars
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
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-receipt, #print-receipt * {
            visibility: visible;
          }
          #print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Hidden Print Receipt */}
      {selectedOrderForPrint && (
        <div id="print-receipt" className="hidden print:block">
          <div className="max-w-sm mx-auto bg-white p-6 text-center">
            <div className="mb-4">
              <div className="text-2xl font-bold text-orange-600">AYAM GEPREK</div>
              <div className="text-lg font-bold">SAMBAL IJO</div>
              <div className="text-xs text-gray-500 mt-1">Receipt</div>
            </div>
            <div className="border-t-2 border-b-2 border-dashed border-gray-300 py-3 my-3">
              <div className="text-left text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Pesanan:</span>
                  <span className="font-semibold">{selectedOrderForPrint.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-semibold">
                    {new Date(selectedOrderForPrint.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode Bayar:</span>
                  <span className="font-semibold">{selectedOrderForPrint.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold">{selectedOrderForPrint.status}</span>
                </div>
              </div>
            </div>
            <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-600">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderForPrint.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="py-1">{item.product?.name || item.productName || 'Unknown Product'}</td>
                      <td className="py-1 text-center">x{item.quantity}</td>
                      <td className="py-1 text-right">Rp{item.subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t-2 border-dashed border-gray-300 pt-3">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>TOTAL</span>
                <span className="text-orange-600">
                  Rp{selectedOrderForPrint.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p>Terima kasih atas pesanan Anda!</p>
                <p className="mt-1">Simpan struk ini sebagai bukti pembayaran.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-orange-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">AYAM GEPREK SAMBAL IJO</h1>
              <p className="text-xs text-gray-500">Order Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {member && (
              <Button
                onClick={() => setShowMemberDialog(true)}
                variant="outline"
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-0 hover:from-yellow-500 hover:to-yellow-600"
              >
                <Star className="w-4 h-4 mr-2" />
                {member.points} Poin
              </Button>
            )}
            <Button
              onClick={() => setShowCartDialog(true)}
              className="relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Keranjang
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((count, item) => count + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
          {member && (
            <Button
              onClick={() => setShowMemberDialog(true)}
              variant="outline"
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
            >
              <Star className="w-4 h-4 mr-2" />
              {member.points} Poin
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="member">Member</TabsTrigger>
            <TabsTrigger value="qr-member">QR Member</TabsTrigger>
            <TabsTrigger value="cetak-kartu">Cetak Kartu</TabsTrigger>
            <TabsTrigger value="orders">Pesanan Saya</TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-500"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  size="sm"
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  className={`${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  } whitespace-nowrap`}
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
                    } whitespace-nowrap`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-orange-200">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-12 h-12 text-orange-400" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-orange-600 font-bold">Rp{product.price.toLocaleString('id-ID')}</p>
                      <Badge className={product.stock > 0 ? 'bg-green-500' : 'bg-gray-400'}>
                        {product.stock > 0 ? `${product.stock} tersedia` : 'Habis'}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada produk ditemukan</p>
              </Card>
            )}
          </TabsContent>

          {/* Member Tab */}
          <TabsContent value="member" className="space-y-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  Member Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member ? (
                  <div className="space-y-6">
                    {/* Member Info Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border-2 border-orange-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800">{member.name}</h3>
                          <p className="text-gray-600">{member.phone}</p>
                          {member.email && (
                            <p className="text-sm text-gray-500">{member.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Points Display */}
                      <div className="bg-white rounded-lg p-4 shadow-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="w-6 h-6 text-yellow-500" />
                            <span className="text-lg font-semibold text-gray-700">Poin Anda</span>
                          </div>
                          <div className="text-3xl font-bold text-orange-600">
                            {member.points}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          1 poin = Rp 1.000 pembelian
                        </p>
                      </div>
                    </div>

                    {/* Barcode Section */}
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Scan className="w-5 h-5 text-purple-600" />
                        Barcode Member
                      </h4>
                      <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center mb-4">
                          <p className="text-xs text-gray-500 mb-4">SCAN BARCODE INI</p>
                          <div className="flex justify-center">
                            {(() => {
                              const pattern = generateBarcodePattern(member.phone)
                              const totalWidth = pattern.reduce((sum, bar) => sum + bar.width, 0)
                              return (
                                <svg width={totalWidth} height={80} className="border-2 border-gray-800 rounded">
                                  {pattern.map((bar, index) => (
                                    <rect
                                      key={index}
                                      x={pattern.slice(0, index).reduce((sum, b) => sum + b.width, 0)}
                                      y={0}
                                      width={bar.width}
                                      height={80}
                                      fill={bar.color}
                                    />
                                  ))}
                                </svg>
                              )
                            })()}
                          </div>
                        </div>
                        <div className="text-center mt-6">
                          <p className="text-lg font-mono font-bold text-gray-800 bg-gray-100 py-3 px-6 rounded-lg">
                            {member.phone}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Gunakan nomor telepon untuk scan di kasir
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Cara Menggunakan:</strong> Tampilkan barcode ini kepada kasir saat melakukan pembelian untuk mengumpulkan poin.
                        </p>
                      </div>
                    </div>

                    {/* Points Info */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-yellow-600" />
                        Keuntungan Member
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>Dapatkan <strong>1 poin</strong> untuk setiap Rp 1.000 pembelian</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Gift className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>Poin otomatis masuk setelah pesanan selesai</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Cek poin Anda kapan saja di menu Member</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Terdaftar sebagai Member</h3>
                    <p className="text-gray-600 mb-6">
                      Daftar sebagai member untuk mendapatkan poin dan keuntungan eksklusif!
                    </p>
                    <div className="bg-orange-50 p-6 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-orange-800 mb-2">
                        <strong>Cara Mendaftar:</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Lakukan pemesanan dengan mengisi nomor telepon Anda. Anda akan otomatis terdaftar sebagai member!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Riwayat Pesanan ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Sub-tabs for Orders */}
                <Tabs value={orderSubTab} onValueChange={(v) => setOrderSubTab(v as 'list' | 'receipt')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="list">Daftar Pesanan</TabsTrigger>
                    <TabsTrigger value="receipt" disabled={!selectedOrderForPrint}>
                      Cetak Struk
                    </TabsTrigger>
                  </TabsList>

                  {/* Order List Tab */}
                  <TabsContent value="list">
                    <ScrollArea className="max-h-[calc(100vh-400px)]">
                      {orders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p>Belum ada pesanan</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order) => (
                            <Card 
                              key={order.id} 
                              className={`border transition-all hover:shadow-md cursor-pointer ${
                                selectedOrderForPrint?.id === order.id 
                                  ? 'border-orange-400 ring-2 ring-orange-200' 
                                  : 'border-gray-200'
                              }`}
                              onClick={() => {
                                setSelectedOrderForPrint(order)
                                setOrderSubTab('receipt')
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(order.createdAt).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className={getStatusColor(order.status)}>
                                      {order.status}
                                    </Badge>
                                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                                      {order.paymentStatus}
                                    </Badge>
                                  </div>
                                </div>
                                <Separator className="my-3" />
                                <div className="space-y-2 mb-3">
                                  {order.items.slice(0, 3).map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm">
                                      <span className="text-gray-600">{item.product?.name || item.productName || 'Unknown Product'} x{item.quantity}</span>
                                      <span className="font-medium">Rp{item.subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                  ))}
                                  {order.items.length > 3 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      +{order.items.length - 3} item lainnya
                                    </p>
                                  )}
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-800">Total</span>
                                  <span className="font-bold text-orange-600">
                                    Rp{order.totalAmount.toLocaleString('id-ID')}
                                  </span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedOrderForPrint(order)
                                      setOrderSubTab('receipt')
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                                  >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Lihat Struk
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Receipt/Print Tab */}
                  <TabsContent value="receipt">
                    {selectedOrderForPrint ? (
                      <div className="space-y-4">
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                          <div className="text-center mb-6">
                            <div className="text-2xl font-bold text-orange-600 mb-1">AYAM GEPREK</div>
                            <div className="text-lg font-bold text-gray-800">SAMBAL IJO</div>
                            <div className="text-xs text-gray-500 mt-2">STRUK PEMBELIAN</div>
                          </div>
                          
                          <div className="border-t-2 border-b-2 border-dashed border-gray-300 py-4 my-4">
                            <div className="text-left text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">No. Pesanan:</span>
                                <span className="font-semibold text-gray-800">{selectedOrderForPrint.orderNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tanggal:</span>
                                <span className="font-semibold text-gray-800">
                                  {new Date(selectedOrderForPrint.createdAt).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Metode Bayar:</span>
                                <span className="font-semibold text-gray-800">{selectedOrderForPrint.paymentMethod}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <Badge className={getStatusColor(selectedOrderForPrint.status)}>
                                  {selectedOrderForPrint.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Pembayaran:</span>
                                <Badge className={getPaymentStatusColor(selectedOrderForPrint.paymentStatus)}>
                                  {selectedOrderForPrint.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-gray-600 border-b border-gray-200">
                                  <th className="pb-2">Item</th>
                                  <th className="pb-2 text-center">Qty</th>
                                  <th className="pb-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedOrderForPrint.items.map((item: any, index: number) => (
                                  <tr key={index} className="border-b border-gray-100">
                                    <td className="py-2">{item.product?.name || item.productName || 'Unknown Product'}</td>
                                    <td className="py-2 text-center">x{item.quantity}</td>
                                    <td className="py-2 text-right">Rp{item.subtotal.toLocaleString('id-ID')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="border-t-2 border-dashed border-gray-300 pt-4">
                            <div className="flex justify-between items-center text-xl font-bold">
                              <span className="text-gray-800">TOTAL</span>
                              <span className="text-orange-600">
                                Rp{selectedOrderForPrint.totalAmount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500 text-center space-y-1">
                              <p>Terima kasih atas pesanan Anda!</p>
                              <p>Simpan struk ini sebagai bukti pembayaran.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => setOrderSubTab('list')}
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Kembali ke Daftar
                          </Button>
                          <Button
                            onClick={() => handlePrintReceipt(selectedOrderForPrint)}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak Struk
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg mb-2">Pilih pesanan untuk melihat struk</p>
                        <p className="text-sm">Klik pada salah satu pesanan di tab "Daftar Pesanan"</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Member Tab */}
          <TabsContent value="member" className="space-y-4">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  Cari Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Masukkan nomor telepon..."
                      value={memberPhoneInput}
                      onChange={(e) => setMemberPhoneInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchMemberByPhone(memberPhoneInput)}
                      className="pl-10 border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <Button
                    onClick={() => fetchMemberByPhone(memberPhoneInput)}
                    disabled={searchingMember}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {searchingMember ? 'Mencari...' : 'Cari'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {member ? (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-600" />
                    Informasi Member
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Member Info Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-orange-50 p-6 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                        <p className="text-gray-600">{member.phone}</p>
                        {member.email && (
                          <p className="text-sm text-gray-500">{member.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Poin Kamu</p>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-8 h-8 text-yellow-500" />
                          <span className="text-4xl font-bold text-orange-600">{member.points}</span>
                          <span className="text-xl text-gray-600">poin</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          1 poin = Rp1.000
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR/Barcode Section */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Scan className="w-5 h-5 text-purple-600" />
                      QR Code Member
                    </h4>
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 text-center">
                      <p className="text-xs text-gray-500 mb-3">SCAN QR CODE INI</p>
                      <div className="flex justify-center mb-4">
                        {(() => {
                          const pattern = generateBarcodePattern(member.phone)
                          const totalWidth = pattern.reduce((sum, bar) => sum + bar.width, 0)
                          return (
                            <svg width={totalWidth} height={80} className="border border-gray-300 rounded">
                              {pattern.map((bar, index) => (
                                <rect
                                  key={index}
                                  x={pattern.slice(0, index).reduce((sum, b) => sum + b.width, 0)}
                                  y={0}
                                  width={bar.width}
                                  height={80}
                                  fill={bar.color}
                                />
                              ))}
                            </svg>
                          )
                        })()}
                      </div>
                      <div className="bg-gray-100 py-3 px-4 rounded inline-block">
                        <p className="text-lg font-mono font-bold text-gray-800">{member.phone}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Gunakan QR code ini untuk mendapatkan poin saat berbelanja
                      </p>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Detail Member</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama:</span>
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telepon:</span>
                        <span className="font-medium">{member.phone}</span>
                      </div>
                      {member.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{member.email}</span>
                        </div>
                      )}
                      {member.address && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Alamat:</span>
                          <span className="font-medium text-right max-w-[60%]">{member.address}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Terdaftar sejak:</span>
                        <span className="font-medium">
                          {new Date(member.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setMember(null)}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50"
                  >
                    Keluar dari Akun Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200">
                <CardContent className="p-12 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Login Member</h3>
                  <p className="text-gray-500 mb-4">Masukkan nomor telepon untuk melihat QR code dan poin Anda</p>
                  <Award className="w-12 h-12 text-orange-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Dapatkan poin dari setiap pembelian!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* QR Member Tab */}
          <TabsContent value="qr-member" className="space-y-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-orange-600" />
                  QR Code Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member ? (
                  <div className="space-y-6">
                    {/* Search Member */}
                    <div className="bg-orange-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-orange-600" />
                        Cari Member untuk Tampilkan QR
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Masukkan nomor telepon member"
                          value={orderForm.customerPhone}
                          onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                          className="flex-1"
                        />
                        <Button onClick={() => orderForm.customerPhone && fetchMemberInfo(orderForm.customerPhone)}>
                          Cari
                        </Button>
                      </div>
                    </div>

                    {/* Large QR Code Display */}
                    <div className="bg-white p-8 rounded-2xl border-4 border-orange-300 shadow-xl max-w-md mx-auto text-center">
                      {/* Member Name */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">{member.name}</h2>
                        <p className="text-gray-600">{member.phone}</p>
                      </div>

                      {/* QR Code */}
                      {qrCodeUrl && (
                        <div className="bg-white p-6 rounded-xl border-4 border-gray-200 shadow-lg mb-6">
                          <p className="text-sm font-semibold text-orange-600 mb-4">SCAN QR CODE INI</p>
                          <img
                            src={qrCodeUrl}
                            alt="QR Code Member"
                            className="mx-auto border-8 border-white shadow-xl"
                            style={{ width: '280px', height: '280px' }}
                          />
                        </div>
                      )}

                      {/* Barcode */}
                      <div className="bg-gray-50 p-6 rounded-xl mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-3">ATAU SCAN BARCODE</p>
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                          <div className="flex justify-center">
                            {(() => {
                              const pattern = generateBarcodePattern(member.phone)
                              const totalWidth = pattern.reduce((sum, bar) => sum + bar.width, 0)
                              return (
                                <svg width={totalWidth} height={80}>
                                  {pattern.map((bar, index) => (
                                    <rect
                                      key={index}
                                      x={pattern.slice(0, index).reduce((sum, b) => sum + b.width, 0)}
                                      y={0}
                                      width={bar.width}
                                      height={80}
                                      fill={bar.color}
                                    />
                                  ))}
                                </svg>
                              )
                            })()}
                          </div>
                        </div>
                        <p className="text-xl font-mono font-bold text-gray-800 bg-gray-200 py-3 px-6 rounded-lg mt-4 inline-block">
                          {member.phone}
                        </p>
                      </div>

                      {/* Points Display */}
                      <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-6 rounded-xl text-white">
                        <p className="text-sm mb-2">Poin Anda Saat Ini</p>
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-8 h-8" />
                          <span className="text-4xl font-bold">{member.points}</span>
                          <span className="text-xl">poin</span>
                        </div>
                        <p className="text-xs mt-2 opacity-90">1 poin = Rp 1.000 pembelian</p>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Cara Menggunakan QR Member:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Tampilkan QR Code atau Barcode ini di kasir</li>
                        <li>• Kasir akan scan untuk mengumpulkan poin</li>
                        <li>• Poin otomatis bertambah setiap pembelian</li>
                        <li>• Poin bisa ditukar dengan diskon atau hadiah</li>
                        <li>• Scan QR Code ini juga bisa untuk menukarkan poin</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <QrCode className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Cari Member Terlebih Dahulu</h3>
                    <p className="text-gray-600 mb-6">
                      Masukkan nomor telepon member untuk menampilkan QR Code member
                    </p>
                    <div className="bg-orange-50 p-6 rounded-lg max-w-md mx-auto">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Masukkan nomor telepon member"
                          value={orderForm.customerPhone}
                          onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                          className="flex-1"
                        />
                        <Button onClick={() => orderForm.customerPhone && fetchMemberInfo(orderForm.customerPhone)}>
                          Cari
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Print Card Tab */}
          <TabsContent value="cetak-kartu" className="space-y-6">
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-orange-600" />
                  Cetak Kartu Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member ? (
                  <div className="space-y-6">
                    {/* Search Member for Print */}
                    <div className="bg-orange-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-orange-600" />
                        Cari Member untuk Cetak Kartu
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Masukkan nomor telepon member"
                          value={orderForm.customerPhone}
                          onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                          className="flex-1"
                        />
                        <Button onClick={() => member && orderForm.customerPhone && fetchMemberInfo(orderForm.customerPhone)}>
                          Cari
                        </Button>
                      </div>
                    </div>

                    {/* Member Card Preview - For Printing */}
                    <div id="member-card-print" className="bg-white p-8 rounded-xl border-4 border-orange-300 shadow-xl max-w-md mx-auto">
                      {/* Store Header */}
                      <div className="text-center mb-6 pb-4 border-b-4 border-orange-500">
                        <h1 className="text-3xl font-bold text-orange-600">AYAM GEPREK</h1>
                        <h2 className="text-xl font-bold text-green-700">SAMBAL IJO</h2>
                        <p className="text-sm text-gray-500 mt-2">Kartu Member Resmi</p>
                      </div>

                      {/* Member Info */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Nama:</span>
                          <span className="font-bold text-gray-800">{member.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">No. HP:</span>
                          <span className="font-bold text-gray-800">{member.phone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Poin:</span>
                          <span className="font-bold text-orange-600 text-lg">{member.points}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Terdaftar:</span>
                          <span className="font-medium text-gray-700 text-sm">
                            {new Date(member.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* QR Code */}
                      {qrCodeUrl && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
                          <p className="text-sm font-semibold text-gray-700 mb-3">QR Code Member</p>
                          <img
                            src={qrCodeUrl}
                            alt="QR Code Member"
                            className="mx-auto border-4 border-white shadow-lg"
                            style={{ width: '200px', height: '200px' }}
                          />
                          <p className="text-xs text-gray-500 mt-2">Scan QR Code ini untuk akses member</p>
                        </div>
                      )}

                      {/* Barcode */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Barcode Member</p>
                        <div className="bg-white p-4 rounded border-2 border-gray-300">
                          <div className="flex justify-center">
                            {(() => {
                              const pattern = generateBarcodePattern(member.phone)
                              const totalWidth = pattern.reduce((sum, bar) => sum + bar.width, 0)
                              return (
                                <svg width={totalWidth} height={60}>
                                  {pattern.map((bar, index) => (
                                    <rect
                                      key={index}
                                      x={pattern.slice(0, index).reduce((sum, b) => sum + b.width, 0)}
                                      y={0}
                                      width={bar.width}
                                      height={60}
                                      fill={bar.color}
                                    />
                                  ))}
                                </svg>
                              )
                            })()}
                          </div>
                          <p className="text-lg font-mono font-bold text-gray-800 bg-gray-100 py-2 px-4 rounded mt-3 inline-block">
                            {member.phone}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="text-center pt-4 border-t-2 border-gray-200">
                        <p className="text-xs text-gray-500">Gunakan kartu ini saat berbelanja</p>
                        <p className="text-xs text-gray-500">untuk mengumpulkan poin dan keuntungan eksklusif</p>
                      </div>
                    </div>

                    {/* Print Button */}
                    <div className="flex justify-center gap-4 no-print">
                      <Button
                        onClick={() => {
                          const printContent = document.getElementById('member-card-print')
                          if (printContent) {
                            const printWindow = window.open('', '', 'height=600,width=800')
                            if (printWindow) {
                              printWindow.document.write('<html><head><title>Kartu Member</title>')
                              printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; }</style>')
                              printWindow.document.write('</head><body>')
                              printWindow.document.write(printContent.innerHTML)
                              printWindow.document.write('</body></html>')
                              printWindow.document.close()
                              printWindow.print()
                            }
                          }
                        }}
                        className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white px-8"
                      >
                        <Printer className="w-5 h-5 mr-2" />
                        Cetak Kartu
                      </Button>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg no-print">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        Cara Menggunakan Kartu:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Tampilkan QR Code atau Barcode ini di kasir</li>
                        <li>• Kasir akan scan untuk mengumpulkan poin</li>
                        <li>• 1 poin = Rp 1.000 pembelian</li>
                        <li>• Poin bisa ditukar dengan diskon atau hadiah</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Printer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Cari Member Terlebih Dahulu</h3>
                    <p className="text-gray-600 mb-6">
                      Masukkan nomor telepon member untuk mencetak kartu member
                    </p>
                    <div className="bg-orange-50 p-6 rounded-lg max-w-md mx-auto">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Masukkan nomor telepon member"
                          value={orderForm.customerPhone}
                          onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                          className="flex-1"
                        />
                        <Button onClick={() => orderForm.customerPhone && fetchMemberInfo(orderForm.customerPhone)}>
                          Cari
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
              Keranjang Belanja
            </DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Keranjang kosong</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded flex items-center justify-center">
                          <Package className="w-8 h-8 text-orange-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{item.product.name}</p>
                        <p className="text-orange-600 font-bold text-sm">Rp{item.product.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-orange-600 text-xl">Rp{getCartTotal().toLocaleString('id-ID')}</span>
              </div>
              <Button
                onClick={() => {
                  setShowCartDialog(false)
                  setShowOrderDialog(true)
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                Lanjut ke Pembayaran
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Form Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              Konfirmasi Pesanan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Order Summary */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <p className="font-semibold text-gray-800 mb-2">Ringkasan Pesanan:</p>
                <div className="space-y-1 text-sm">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">Rp{getCartTotal().toLocaleString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info Form */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="customerName">Nama Lengkap *</Label>
                <Input
                  id="customerName"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Nomor Telepon *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={orderForm.customerPhone}
                  onChange={(e) => {
                    setOrderForm({ ...orderForm, customerPhone: e.target.value })
                    fetchMember(e.target.value)
                  }}
                  placeholder="081234567890"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">Alamat Pengiriman *</Label>
                <textarea
                  id="customerAddress"
                  value={orderForm.customerAddress}
                  onChange={(e) => setOrderForm({ ...orderForm, customerAddress: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <textarea
                  id="notes"
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  placeholder="Catatan tambahan untuk pesanan"
                  rows={2}
                  className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrderDialog(false)
                  setShowCartDialog(true)
                }}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={submittingOrder}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {submittingOrder ? 'Memproses...' : 'Buat Pesanan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Member QR Code
            </DialogTitle>
          </DialogHeader>
          {member && (
            <div className="space-y-6">
              {/* Member Info */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.phone}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Poin:</span>
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    {member.points}
                  </Badge>
                </div>
              </div>

              {/* Barcode */}
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 mb-4">SCAN BARCODE INI</p>
                  <div className="flex justify-center">
                    {(() => {
                      const pattern = generateBarcodePattern(member.phone)
                      const totalWidth = pattern.reduce((sum, bar) => sum + bar.width, 0)
                      return (
                        <svg width={totalWidth} height={80} className="border-2 border-gray-800 rounded">
                          {pattern.map((bar, index) => (
                            <rect
                              key={index}
                              x={pattern.slice(0, index).reduce((sum, b) => sum + b.width, 0)}
                              y={0}
                              width={bar.width}
                              height={80}
                              fill={bar.color}
                            />
                          ))}
                        </svg>
                      )
                    })()}
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-lg font-mono font-bold text-gray-800 bg-gray-100 py-3 px-6 rounded-lg">
                    {member.phone}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
