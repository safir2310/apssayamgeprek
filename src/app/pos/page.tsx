'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Flame, ShoppingCart, Plus, Minus, X, LogOut, DollarSign, CreditCard, Smartphone, Printer, Scan, Search, Package, User, Lock } from 'lucide-react'

// Store Information
const STORE_INFO = {
  name: 'AYAM GEPREK SAMBAL IJO',
  address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151',
  phone: '085260812758'
}

interface Product {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  stock: number
  category: string
  barcode: string | null
  isActive: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

interface CashierShift {
  id: string
  openingBalance: number
  isOpen: boolean
  openedAt: Date
}

export default function POSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cashier, setCashier] = useState<any>(null)
  const [currentShift, setCurrentShift] = useState<CashierShift | null>(null)
  const [showOpenShift, setShowOpenShift] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Shift form
  const [shiftForm, setShiftForm] = useState({ openingBalance: '', closingBalance: '', physicalBalance: '' })

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // PIN for void
  const [pinInput, setPinInput] = useState('')
  const [voidReason, setVoidReason] = useState('')

  // Loading state
  const [loading, setLoading] = useState(false)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

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
    }
  }

  // Fetch products on load
  useEffect(() => {
    fetchProducts()
  }, [])

  // Focus barcode input
  useEffect(() => {
    if (isLoggedIn && currentShift && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [isLoggedIn, currentShift, cart])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate login (in real app, call API)
    if (loginForm.email === 'admin@ayamgeprek.com' && loginForm.password === 'admin123') {
      setCashier({
        id: '1',
        name: 'Admin',
        email: loginForm.email
      })
      setIsLoggedIn(true)
      setShowOpenShift(true)
    } else {
      alert('Email atau password salah!')
    }

    setLoading(false)
  }

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()

    const shift = {
      id: `SHIFT-${Date.now()}`,
      openingBalance: parseFloat(shiftForm.openingBalance) || 0,
      isOpen: true,
      openedAt: new Date()
    }

    setCurrentShift(shift)
    setShowOpenShift(false)
    setShiftForm({ ...shiftForm, openingBalance: '' })
  }

  const handleCloseShift = () => {
    const totalSales = getCartTotal()
    const closingBalance = shiftForm.openingBalance + totalSales

    setCurrentShift({
      ...currentShift!,
      isOpen: false,
      closingBalance
    })

    alert(`Shift ditutup!\n\nTotal Penjualan: Rp${totalSales.toLocaleString('id-ID')}\nSaldo Awal: Rp${currentShift?.openingBalance.toLocaleString('id-ID')}\nSaldo Akhir: Rp${closingBalance.toLocaleString('id-ID')}`)

    // Reset
    setIsLoggedIn(false)
    setCashier(null)
    setCurrentShift(null)
    setShowCloseShift(false)
    setCart([])
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
          const newQuantity = Math.max(0, Math.min(item.quantity + change, item.product.stock))
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

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const handleBarcodeInput = (value: string) => {
    setBarcodeInput(value)

    // Check if it's a barcode (numeric)
    if (/^\d+$/.test(value)) {
      const product = products.find(p => p.barcode === value)
      if (product) {
        addToCart(product)
        setBarcodeInput('')
      }
    } else {
      // Search by name
      setSearchQuery(value)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchQuery) {
        const product = products.find(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode === searchQuery
        )
        if (product) {
          addToCart(product)
          setSearchQuery('')
          setBarcodeInput('')
        }
      }
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products.filter(p => p.isActive && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())))
    : products.filter(p => p.isActive && p.category === selectedCategory && (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())))

  const handlePayment = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!')
      return
    }

    const total = getCartTotal()
    const amount = parseFloat(paymentAmount)

    if (paymentMethod === 'CASH' && amount < total) {
      alert('Pembayaran kurang!')
      return
    }

    // Create transaction
    const transaction = {
      id: `TRX-${Date.now()}`,
      items: cart,
      total: total,
      paid: amount,
      change: amount - total,
      paymentMethod,
      cashier: cashier?.name,
      date: new Date()
    }

    setSelectedTransaction(transaction)
    setShowReceipt(true)
    setCart([])
    setPaymentAmount('')
    setShowPaymentDialog(false)
  }

  const handleVoidTransaction = async () => {
    if (!pinInput) {
      alert('Masukkan PIN supervisor!')
      return
    }

    if (pinInput !== '1234') {
      alert('PIN salah!')
      return
    }

    if (!voidReason) {
      alert('Masukkan alasan void!')
      return
    }

    // Void transaction logic
    alert('Transaksi berhasil di-void!')
    setShowVoidDialog(false)
    setPinInput('')
    setVoidReason('')
    setCart([])
  }

  const printReceipt = () => {
    if (!selectedTransaction) return

    const printWindow = window.open('', '', 'width=400,height=600')
    if (!printWindow) return

    const receiptContent = `
      <html>
        <head>
          <title>Struk - ${STORE_INFO.name}</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center bold">${STORE_INFO.name}</div>
          <div class="center">${STORE_INFO.address}</div>
          <div class="center">${STORE_INFO.phone}</div>
          <div class="divider"></div>
          <div>No: ${selectedTransaction.id}</div>
          <div>Tanggal: ${selectedTransaction.date.toLocaleString('id-ID')}</div>
          <div>Kasir: ${selectedTransaction.cashier}</div>
          <div class="divider"></div>
          <table>
            ${selectedTransaction.items.map((item: any) => `
              <tr>
                <td colspan="2">${item.product.name}</td>
              </tr>
              <tr>
                <td>${item.quantity} x ${item.product.price.toLocaleString('id-ID')}</td>
                <td class="right">${(item.quantity * item.product.price).toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td class="bold">TOTAL</td>
              <td class="right bold">${selectedTransaction.total.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td>Tunai</td>
              <td class="right">${selectedTransaction.paid.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td>Kembali</td>
              <td class="right">${selectedTransaction.change.toLocaleString('id-ID')}</td>
            </tr>
          </table>
          <div class="divider"></div>
          <div class="center">Terima kasih sudah berbelanja 🙏</div>
        </body>
      </html>
    `

    printWindow.document.write(receiptContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-orange-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-orange-800">POS Kasir</CardTitle>
            <p className="text-gray-600">{STORE_INFO.name}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="Masukkan email"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Masukkan password"
                  required
                  className="border-orange-200 focus:border-orange-500"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {loading ? 'Memproses...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Open Shift Dialog
  if (showOpenShift) {
    return (
      <Dialog open={showOpenShift} onOpenChange={setShowOpenShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-600" />
              Buka Shift
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOpenShift} className="space-y-4">
            <div>
              <Label htmlFor="openingBalance">Modal Awal</Label>
              <Input
                id="openingBalance"
                type="number"
                value={shiftForm.openingBalance}
                onChange={(e) => setShiftForm({ ...shiftForm, openingBalance: e.target.value })}
                placeholder="0"
                required
                className="border-orange-200 focus:border-orange-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Buka Shift
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  // Main POS Interface
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">POS Kasir</h1>
              <p className="text-xs text-gray-500">Shift Aktif: {currentShift?.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{cashier?.name}</p>
            <p className="text-xs text-gray-500">{new Date().toLocaleString('id-ID')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloseShift(true)}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Tutup Shift
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barcode Scanner & Search */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => handleBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Scan barcode atau cari produk..."
                  className="pl-10 border-orange-200 focus:border-orange-500"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setBarcodeInput('')}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
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
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-orange-200 overflow-hidden"
                  onClick={() => addToCart(product)}
                >
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-12 h-12 text-orange-400" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-orange-600 font-bold text-sm">
                      Rp{product.price.toLocaleString('id-ID')}
                    </p>
                    <Badge
                      variant={product.stock > 0 ? 'default' : 'secondary'}
                      className={`mt-2 text-xs ${
                        product.stock > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      Stok: {product.stock}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Cart & Payment Panel */}
        <div className="w-96 flex flex-col bg-white border-l border-gray-200">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg">Keranjang</h2>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {getCartCount()} item
              </Badge>
            </div>
            <div className="text-3xl font-bold">
              Rp{getCartTotal().toLocaleString('id-ID')}
            </div>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Keranjang kosong</p>
                <p className="text-sm">Scan atau pilih produk</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <Card key={item.product.id} className="border-orange-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
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
                          <p className="font-bold text-orange-600">
                            Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Payment Actions */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className={`flex flex-col items-center gap-1 py-3 ${
                  paymentMethod === 'CASH' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300'
                }`}
                onClick={() => { setPaymentMethod('CASH'); setShowPaymentDialog(true) }}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-xs">Tunai</span>
              </Button>
              <Button
                variant="outline"
                className={`flex flex-col items-center gap-1 py-3 ${
                  paymentMethod === 'QRIS' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300'
                }`}
                onClick={() => { setPaymentMethod('QRIS'); setShowPaymentDialog(true) }}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">QRIS</span>
              </Button>
              <Button
                variant="outline"
                className={`flex flex-col items-center gap-1 py-3 ${
                  paymentMethod === 'DEBIT' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300'
                }`}
                onClick={() => { setPaymentMethod('DEBIT'); setShowPaymentDialog(true) }}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Debit</span>
              </Button>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-4 font-bold text-lg"
              onClick={() => setShowPaymentDialog(true)}
              disabled={cart.length === 0}
            >
              Bayar - Rp{getCartTotal().toLocaleString('id-ID')}
            </Button>

            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowVoidDialog(true)}
              disabled={cart.length === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Void Transaksi
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Total Pembayaran</Label>
              <div className="text-3xl font-bold text-orange-600 mt-1">
                Rp{getCartTotal().toLocaleString('id-ID')}
              </div>
            </div>
            <Separator />
            <div>
              <Label htmlFor="paymentAmount">Jumlah Uang</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Masukkan jumlah"
                className="text-lg"
              />
            </div>
            {paymentMethod === 'CASH' && paymentAmount && (
              <div>
                <Label>Kembalian</Label>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  Rp{(parseFloat(paymentAmount) - getCartTotal()).toLocaleString('id-ID')}
                </div>
              </div>
            )}
            <Button
              onClick={handlePayment}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Proses Pembayaran
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Void Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>PIN Supervisor</Label>
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN"
                maxLength={4}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div>
              <Label>Alasan Void</Label>
              <Input
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Masukkan alasan"
              />
            </div>
            <Button
              onClick={() => setShowPinDialog(true)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Void Transaksi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Confirmation Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Void</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mb-4">Apakah Anda yakin ingin void transaksi ini?</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPinDialog(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleVoidTransaction}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Ya, Void
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran Berhasil!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
              <div className="text-center font-bold mb-2">{STORE_INFO.name}</div>
              <div className="text-center text-xs mb-2">{STORE_INFO.address}</div>
              <div className="text-center text-xs mb-2">{STORE_INFO.phone}</div>
              <Separator className="my-2" />
              <div>No: {selectedTransaction?.id}</div>
              <div>Tanggal: {selectedTransaction?.date.toLocaleString('id-ID')}</div>
              <div>Kasir: {selectedTransaction?.cashier}</div>
              <Separator className="my-2" />
              {selectedTransaction?.items.map((item: any) => (
                <div key={item.product.id} className="flex justify-between">
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>Rp{(item.quantity * item.product.price).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>Rp{selectedTransaction?.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tunai</span>
                <span>Rp{selectedTransaction?.paid.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kembali</span>
                <span>Rp{selectedTransaction?.change.toLocaleString('id-ID')}</span>
              </div>
              <Separator className="my-2" />
              <div className="text-center text-xs">Terima kasih sudah berbelanja 🙏</div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={printReceipt}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak Struk
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReceipt(false)}
                className="flex-1"
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={showCloseShift} onOpenChange={setShowCloseShift}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Modal Awal</span>
                <span className="font-semibold">Rp{currentShift?.openingBalance.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Penjualan</span>
                <span className="font-semibold">Rp{getCartTotal().toLocaleString('id-ID')}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Saldo Sistem</span>
                <span className="text-orange-600">
                  Rp{(currentShift?.openingBalance || 0 + getCartTotal()).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <Button
              onClick={handleCloseShift}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Tutup Shift
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCloseShift(false)}
              className="w-full"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
