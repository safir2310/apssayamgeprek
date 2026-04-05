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
import { ShoppingCart, Package, Search, Plus, Minus, X, Clock, CheckCircle, Flame, User, Phone, MapPin, Printer } from 'lucide-react'

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
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  items: any[]
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
  }, [])

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
                      <td className="py-1">{item.productName}</td>
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
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="menu">Menu</TabsTrigger>
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
                <ScrollArea className="max-h-[calc(100vh-300px)]">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Belum ada pesanan</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id} className="border border-gray-200">
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
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{item.productName} x{item.quantity}</span>
                                  <span className="font-medium">Rp{item.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                              ))}
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
                                onClick={() => handlePrintReceipt(order)}
                                variant="outline"
                                size="sm"
                                className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak Struk
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
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
                  onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
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
    </div>
  )
}
