'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Member
  const [memberPhone, setMemberPhone] = useState<string>('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberLookupLoading, setMemberLookupLoading] = useState(false)

  // Search Popup
  const [showSearchPopup, setShowSearchPopup] = useState(false)

  // Product Tab
  const [activeProductTab, setActiveProductTab] = useState<'scan' | 'search'>('scan')

  // PIN for void
  const [pinInput, setPinInput] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [voidingItemId, setVoidingItemId] = useState<string | null>(null)

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
    if (isLoggedIn && currentShift && barcodeInputRef.current && activeProductTab === 'scan') {
      barcodeInputRef.current.focus()
    }
  }, [isLoggedIn, currentShift, cart, activeProductTab])

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
          setShowSearchPopup(false)
        }
      }
    }
    if (e.key === 'Escape') {
      setShowSearchPopup(false)
    }
  }

  const handleMemberLookup = async () => {
    if (!memberPhone.trim()) {
      alert('Masukkan nomor telepon member!')
      return
    }

    setMemberLookupLoading(true)
    try {
      const response = await fetch(`/api/members/lookup?phone=${encodeURIComponent(memberPhone)}`)
      const data = await response.json()

      if (data.found) {
        setSelectedMember(data.member)
      } else {
        alert('Member tidak ditemukan!')
        setSelectedMember(null)
      }
    } catch (error) {
      console.error('Error looking up member:', error)
      alert('Terjadi kesalahan saat mencari member!')
    } finally {
      setMemberLookupLoading(false)
    }
  }

  const handleMemberKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMemberLookup()
    }
  }

  const handleClearMember = () => {
    setMemberPhone('')
    setSelectedMember(null)
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

    // Check if voiding a specific item or the whole transaction
    if (voidingItemId) {
      // Void specific item
      setCart(prevCart => prevCart.filter(item => item.product.id !== voidingItemId))
      alert('Item berhasil di-void!')
    } else {
      // Void entire transaction
      alert('Transaksi berhasil di-void!')
      setCart([])
    }

    setShowVoidDialog(false)
    setPinInput('')
    setVoidReason('')
    setVoidingItemId(null)
  }

  const handleVoidItem = (productId: string) => {
    setVoidingItemId(productId)
    setShowVoidDialog(true)
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
        {/* Left Side - Cart Panel */}
        <div className="w-96 flex flex-col bg-white border-r border-gray-200 sticky top-0 h-screen">
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

          {/* Payment Button */}
          <div className="p-4 border-b border-gray-200">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-4 font-bold text-lg"
              onClick={() => setShowPaymentDialog(true)}
              disabled={cart.length === 0}
            >
              Bayar - Rp{getCartTotal().toLocaleString('id-ID')}
            </Button>
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
                              onClick={() => handleVoidItem(item.product.id)}
                              title="Void Item"
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
        </div>

        {/* Right Side - Products Panel */}
        <div className="flex-1 flex flex-col overflow-hidden sticky top-0 h-screen">
          {/* Member Lookup */}
          <div className="bg-white p-4 border-b border-gray-200">
            {selectedMember ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-green-700" />
                  <span className="font-semibold text-green-800">Member Aktif</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    onClick={handleClearMember}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-green-800">{selectedMember.name}</p>
                    <p className="text-green-700 text-sm">{selectedMember.phone}</p>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {selectedMember.points} poin
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    onKeyDown={handleMemberKeyPress}
                    placeholder="Cari member berdasarkan no. HP"
                    className="pl-10 border-orange-200 focus:border-orange-500"
                    disabled={memberLookupLoading}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleMemberLookup}
                  disabled={memberLookupLoading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {memberLookupLoading ? '...' : <Search className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Product Tabs */}
          <Tabs value={activeProductTab} onValueChange={(v) => setActiveProductTab(v as 'scan' | 'search')} className="flex-1 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan" className="flex items-center gap-2">
                  <Scan className="w-4 h-4" />
                  Scan Barcode
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Cari Produk
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scan Barcode Tab */}
            <TabsContent value="scan" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
              <div className="bg-white p-4 border-b border-gray-200">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => {
                        handleBarcodeInput(e.target.value)
                        setShowSearchPopup(e.target.value.length > 0)
                      }}
                      onFocus={() => setShowSearchPopup(barcodeInput.length > 0)}
                      onKeyDown={handleKeyPress}
                      placeholder="Scan barcode produk..."
                      className="pl-10 border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBarcodeInput('')
                      setSearchQuery('')
                      setShowSearchPopup(false)
                    }}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search Results Popup */}
                {showSearchPopup && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.slice(0, 10).map(product => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0"
                          onClick={() => {
                            addToCart(product)
                            setBarcodeInput('')
                            setSearchQuery('')
                            setShowSearchPopup(false)
                          }}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="w-6 h-6 text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-800 truncate">{product.name}</h4>
                            <p className="text-orange-600 font-bold text-sm">Rp{product.price.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge className={product.stock > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}>
                              Stok: {product.stock}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <p>Tidak ada produk ditemukan</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="text-center py-8 text-gray-500">
                  <Scan className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                  <p className="text-lg font-semibold">Scan Barcode</p>
                  <p className="text-sm">Arahkan scanner barcode ke produk</p>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Cari Produk Tab */}
            <TabsContent value="search" className="flex-1 flex flex-col m-0 p-0 overflow-hidden">
              {/* Search & Filter */}
              <div className="bg-white p-4 border-b border-gray-200 relative z-50">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama produk..."
                      className="pl-10 border-orange-200 focus:border-orange-500"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open)
        if (!open) {
          setPaymentAmount('')
        }
      }}>
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
              <Label>Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                  className={`flex flex-col items-center gap-1 py-3 ${
                    paymentMethod === 'CASH' ? 'bg-orange-500 text-white' : ''
                  }`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Tunai</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'QRIS' ? 'default' : 'outline'}
                  className={`flex flex-col items-center gap-1 py-3 ${
                    paymentMethod === 'QRIS' ? 'bg-orange-500 text-white' : ''
                  }`}
                  onClick={() => setPaymentMethod('QRIS')}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">QRIS</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'DEBIT' ? 'default' : 'outline'}
                  className={`flex flex-col items-center gap-1 py-3 ${
                    paymentMethod === 'DEBIT' ? 'bg-orange-500 text-white' : ''
                  }`}
                  onClick={() => setPaymentMethod('DEBIT')}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Debit</span>
                </Button>
              </div>
            </div>
            {paymentMethod === 'CASH' && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="paymentAmount">Jumlah Uang</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Masukkan jumlah"
                    className="text-lg mt-1"
                  />
                </div>
                {paymentAmount && parseFloat(paymentAmount) >= getCartTotal() && (
                  <div>
                    <Label>Kembalian</Label>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      Rp{(parseFloat(paymentAmount) - getCartTotal()).toLocaleString('id-ID')}
                    </div>
                  </div>
                )}
              </>
            )}
            <Separator />
            <Button
              onClick={handlePayment}
              disabled={paymentMethod === 'CASH' && (!paymentAmount || parseFloat(paymentAmount) < getCartTotal())}
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
            <DialogTitle className="text-red-600">
              {voidingItemId ? 'Void Item' : 'Void Transaksi'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {voidingItemId && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  {cart.find(item => item.product.id === voidingItemId)?.product.name}
                </p>
              </div>
            )}
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
              onClick={handleVoidTransaction}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {voidingItemId ? 'Void Item' : 'Void Transaksi'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Confirmation Dialog - Removed since not needed anymore */}

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
