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
import { Flame, ShoppingCart, Plus, Minus, X, LogOut, DollarSign, CreditCard, Smartphone, Printer, Scan, Search, Package, User, Lock, Ticket, CheckCircle2 } from 'lucide-react'

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

interface Member {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  points: number
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

  // Voucher
  const [voucherCode, setVoucherCode] = useState<string>('')
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)

  // Search Popup
  const [showSearchPopup, setShowSearchPopup] = useState(false)

  // PIN for void
  const [pinInput, setPinInput] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [voidingItemId, setVoidingItemId] = useState<string | null>(null)

  // PIN for close shift
  const [closeShiftPin, setCloseShiftPin] = useState('')

  // Current shift details with actual totals
  const [currentShiftDetails, setCurrentShiftDetails] = useState<any>(null)

  // Loading state
  const [loading, setLoading] = useState(false)

  // Store settings
  const [storeSettings, setStoreSettings] = useState<any>(null)

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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setStoreSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchCurrentShiftDetails = async () => {
    if (!currentShift?.id) return

    try {
      const response = await fetch(`/api/shifts?cashierId=${cashier?.id}&isOpen=true`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.shifts.length > 0) {
          const shift = data.shifts.find((s: any) => s.id === currentShift.id)
          if (shift) {
            setCurrentShiftDetails(shift)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shift details:', error)
    }
  }

  // Fetch products and settings on load
  useEffect(() => {
    fetchProducts()
    fetchSettings()
  }, [])

  // Focus barcode input
  useEffect(() => {
    if (isLoggedIn && currentShift && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [isLoggedIn, currentShift, cart])

  // Fetch shift details when closing shift dialog opens
  useEffect(() => {
    if (showCloseShift && currentShift?.id) {
      fetchCurrentShiftDetails()
    }
  }, [showCloseShift, currentShift?.id])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Email atau password salah!')
        setLoading(false)
        return
      }

      setCashier({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        pin: data.user.pin
      })
      setIsLoggedIn(true)

      // Check if cashier has an open shift
      const shiftsResponse = await fetch(`/api/shifts?cashierId=${data.user.id}&isOpen=true`)
      if (shiftsResponse.ok) {
        const shiftsData = await shiftsResponse.json()
        if (shiftsData.success && shiftsData.shifts.length > 0) {
          const openShift = shiftsData.shifts[0]
          setCurrentShift({
            id: openShift.id,
            openingBalance: openShift.openingBalance,
            isOpen: openShift.isOpen,
            openedAt: new Date(openShift.openedAt)
          })
          // Don't show the open shift dialog if shift already exists
          setLoading(false)
          return
        }
      }

      // Show open shift dialog if no open shift exists
      setShowOpenShift(true)
    } catch (error) {
      console.error('Error during login:', error)
      alert('Terjadi kesalahan saat login!')
    }

    setLoading(false)
  }

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'open',
          cashierId: cashier?.id,
          openingBalance: parseFloat(shiftForm.openingBalance) || 0
        })
      })

      const data = await response.json()

      // Check if cashier already has an open shift
      if (!response.ok && data.error === 'Cashier already has an open shift' && data.shift) {
        // Load the existing open shift instead of showing error
        const shift = data.shift
        setCurrentShift({
          id: shift.id,
          openingBalance: shift.openingBalance,
          isOpen: shift.isOpen,
          openedAt: new Date(shift.openedAt)
        })
        setShowOpenShift(false)
        setShiftForm({ ...shiftForm, openingBalance: '' })
        alert('Anda sudah memiliki shift yang terbuka. Shift tersebut telah dimuat otomatis.')
        return
      }

      if (!response.ok) {
        alert(data.error || 'Gagal membuka shift!')
        return
      }

      const shift = data.shift
      setCurrentShift({
        id: shift.id,
        openingBalance: shift.openingBalance,
        isOpen: shift.isOpen,
        openedAt: new Date(shift.openedAt)
      })
      setShowOpenShift(false)
      setShiftForm({ ...shiftForm, openingBalance: '' })
    } catch (error) {
      console.error('Error opening shift:', error)
      alert('Gagal membuka shift! Terjadi kesalahan.')
    }
  }

  const handleCloseShift = async () => {
    // Validate PIN
    if (!closeShiftPin) {
      alert('Masukkan PIN otorisasi!')
      return
    }

    if (closeShiftPin !== '1234') {
      alert('PIN salah! Anda tidak diizinkan menutup shift.')
      return
    }

    try {
      // Use the API-calculated system balance as physical balance
      const systemBalance = currentShiftDetails?.systemBalance || (currentShift?.openingBalance || 0) + (currentShiftDetails?.totalSales || 0)

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'close',
          shiftId: currentShift?.id,
          physicalBalance: systemBalance
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Gagal menutup shift!')
        return
      }

      const shift = data.shift

      // Show detailed summary
      const summary = `
Ringkasan Shift
================
Total Penjualan: Rp${shift.totalSales.toLocaleString('id-ID')}
  - Tunai: Rp${shift.totalCash.toLocaleString('id-ID')}
  - Non-Tunai: Rp${shift.totalNonCash.toLocaleString('id-ID')}

Modal Awal: Rp${shift.openingBalance.toLocaleString('id-ID')}
Saldo Sistem: Rp${shift.systemBalance.toLocaleString('id-ID')}
Saldo Fisik: Rp${shift.closingBalance.toLocaleString('id-ID')}

Jumlah Transaksi: ${shift.transactions?.length || 0}
      `.trim()

      alert(summary)

      // Reset
      setIsLoggedIn(false)
      setCashier(null)
      setCurrentShift(null)
      setCurrentShiftDetails(null)
      setShowCloseShift(false)
      setCloseShiftPin('')
      setCart([])
    } catch (error) {
      console.error('Error closing shift:', error)
      alert('Gagal menutup shift! Terjadi kesalahan.')
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
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
    const discount = appliedVoucher?.discountAmount || 0
    return Math.max(0, subtotal - discount)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
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

      // Check if response is OK
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText)
        alert('Terjadi kesalahan saat mencari member!')
        setSelectedMember(null)
        return
      }

      // Check content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType)
        alert('Terjadi kesalahan pada server!')
        setSelectedMember(null)
        return
      }

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
      setSelectedMember(null)
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

  const handleVoucherApply = async () => {
    if (!voucherCode.trim()) {
      alert('Masukkan kode voucher!')
      return
    }

    setVoucherLoading(true)
    try {
      const cartTotal = getCartTotal()
      const response = await fetch(`/api/vouchers?code=${encodeURIComponent(voucherCode)}&cartTotal=${cartTotal}`)

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Terjadi kesalahan saat memvalidasi voucher!')
        return
      }

      const data = await response.json()

      if (!data.valid) {
        alert(data.error || 'Kode voucher tidak valid!')
        return
      }

      const promo = data.promo
      setAppliedVoucher(promo)

      // If voucher has a free product, add it to cart
      if (promo.freeProductId) {
        const product = products.find(p => p.id === promo.freeProductId)
        if (product) {
          addToCart(product)
          alert(`Voucher berhasil! Produk gratis "${promo.freeProductName}" ditambahkan ke keranjang.`)
        }
      } else if (promo.discountAmount > 0) {
        alert(`Voucher berhasil! Diskon Rp${promo.discountAmount.toLocaleString('id-ID')} diterapkan.`)
      } else {
        alert('Voucher berhasil diterapkan!')
      }

      setVoucherCode('')
    } catch (error) {
      console.error('Error applying voucher:', error)
      alert('Terjadi kesalahan saat memvalidasi voucher!')
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleVoucherKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVoucherApply()
    }
  }

  const handleVoucherClear = () => {
    setVoucherCode('')
    setAppliedVoucher(null)
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

    // Check if shift is open
    if (!currentShift?.id) {
      alert('Shift belum dibuka! Silakan buka shift terlebih dahulu.')
      return
    }

    const total = getCartTotal()
    const amount = parseFloat(paymentAmount)

    if (paymentMethod === 'CASH' && amount < total) {
      alert('Pembayaran kurang!')
      return
    }

    try {
      // Calculate subtotal before discount
      const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const discount = appliedVoucher?.discountAmount || 0

      // Prepare transaction items
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))

      // Send transaction to API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          totalAmount: subtotal,
          paymentMethod,
          paidAmount: amount || total,
          cashierId: cashier?.id || '1',
          shiftId: currentShift.id,
          memberId: selectedMember?.id || null,
          discount: discount,
          voucherCode: appliedVoucher?.code || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Gagal memproses pembayaran!')
        return
      }

      // Create transaction for receipt
      const transaction = {
        id: data.transaction.transactionNumber,
        items: cart,
        total: total,
        paid: amount,
        change: (amount || total) - total,
        paymentMethod,
        cashier: cashier?.name,
        date: new Date()
      }

      setSelectedTransaction(transaction)
      setShowReceipt(true)
      setCart([])
      setPaymentAmount('')
      setVoucherCode('')
      setAppliedVoucher(null)
      setSelectedMember(null) // Reset member setelah transaksi selesai
      setMemberPhone('') // Reset member phone input
      setShowPaymentDialog(false)
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Gagal memproses pembayaran! Terjadi kesalahan.')
    }
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
                suppressHydrationWarning
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
        {/* Left Side - Products Panel */}
        <div className="flex-1 flex flex-col overflow-hidden sticky top-0 h-screen">
          {/* Member Lookup & Search Bar */}
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex gap-3">
              {/* Member Lookup */}
              <div className="w-1/3">
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
                        <p className="font-bold text-green-800 text-sm">{selectedMember.name}</p>
                        <p className="text-green-700 text-xs">{selectedMember.phone}</p>
                      </div>
                      <Badge className="bg-green-600 text-white text-xs">
                        {selectedMember.points} poin
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      onKeyDown={handleMemberKeyPress}
                      placeholder="Cari member..."
                      className="pl-10 border-orange-200 focus:border-orange-500 h-10 text-sm"
                      disabled={memberLookupLoading}
                    />
                  </div>
                )}
              </div>

              {/* Product Search & Barcode Scanner - Combined */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  ref={barcodeInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)
                    setShowSearchPopup(value.length > 0)

                    // Check if it's a barcode (numeric only and at least 3 digits)
                    if (/^\d{3,}$/.test(value)) {
                      const product = products.find(p => p.barcode === value)
                      if (product) {
                        addToCart(product)
                        setSearchQuery('')
                        setShowSearchPopup(false)
                      }
                    }
                  }}
                  onFocus={() => setShowSearchPopup(searchQuery.length > 0)}
                  onKeyDown={handleKeyPress}
                  placeholder="Scan barcode atau cari nama produk..."
                  className="pl-10 border-orange-200 focus:border-orange-500 h-10"
                />
              </div>

              {/* Show All Products Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchPopup(true)
                  barcodeInputRef.current?.focus()
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-50 h-10 px-3"
              >
                <Package className="w-4 h-4" />
              </Button>

              {/* Clear Button */}
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchPopup(false)
                  }}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 h-10 px-3"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search Results Popup */}
            {showSearchPopup && (
              <div className="absolute top-20 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto mx-4">
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

          {/* Category Filter */}
          <div className="bg-white px-4 py-3 border-b border-gray-200">
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

          {/* Product Grid - Scrollable */}
          <ScrollArea className="flex-1 p-4" style={{ height: 'calc(100vh - 280px)' }}>
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

        {/* Right Side - Cart Panel */}
        <div className="w-96 flex flex-col bg-white border-l border-gray-200 sticky top-0 h-screen shadow-xl">
          {/* Cart Header */}
          <div className="p-5 bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 text-white flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-xl">Keranjang</h2>
                <p className="text-white/80 text-sm">{getCartCount()} item terpilih</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
              <span className="text-white/90 text-sm">Total Belanja</span>
              <span className="text-2xl font-bold">Rp{getCartTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Voucher Section */}
          <div className="p-4 border-b border-gray-200 bg-orange-50/30 flex-shrink-0">
            {appliedVoucher ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-green-800 text-sm">{appliedVoucher.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        onClick={handleVoucherClear}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-green-700 text-xs">Kode: {appliedVoucher.code}</p>
                    {appliedVoucher.discountAmount > 0 && (
                      <p className="text-green-700 text-xs font-semibold mt-1">
                        Diskon: Rp{appliedVoucher.discountAmount.toLocaleString('id-ID')}
                      </p>
                    )}
                    {appliedVoucher.freeProductName && (
                      <p className="text-green-700 text-xs font-semibold mt-1">
                        Gratis: {appliedVoucher.freeProductName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-4 h-4" />
                  <Input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    onKeyDown={handleVoucherKeyPress}
                    placeholder="Masukkan kode voucher..."
                    className="pl-10 border-orange-200 focus:border-orange-500 h-10 text-sm"
                    disabled={voucherLoading}
                  />
                </div>
                <Button
                  onClick={handleVoucherApply}
                  disabled={voucherLoading || !voucherCode.trim()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-10 px-4"
                >
                  {voucherLoading ? '...' : 'Terapkan'}
                </Button>
              </div>
            )}
          </div>

          {/* Cart Items - Scrollable */}
          <ScrollArea className={`flex-1 ${cart.length > 3 ? 'bg-gray-50/80' : ''}`} style={{ maxHeight: 'calc(100vh - 460px)' }}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">Keranjang Kosong</h3>
                <p className="text-gray-500 text-sm text-center">Pilih produk untuk memulai transaksi</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map(item => (
                  <Card key={item.product.id} className="border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.image ? (
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="w-8 h-8 text-orange-400" />
                          )}
                        </div>

                        {/* Product Info & Controls */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-800 line-clamp-1 mb-1">
                              {item.product.name}
                            </h4>
                            <p className="text-orange-600 font-bold text-sm">
                              Rp{item.product.price.toLocaleString('id-ID')}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-orange-100 text-orange-600"
                                onClick={() => updateQuantity(item.product.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-semibold text-sm w-6 text-center text-gray-700">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-orange-100 text-orange-600"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                disabled={item.quantity >= item.product.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-sm text-gray-800">
                                Rp{(item.quantity * item.product.price).toLocaleString('id-ID')}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                                onClick={() => handleVoidItem(item.product.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Hapus
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Payment Button - Always at Bottom */}
          <div className="p-5 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-5 font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowPaymentDialog(true)}
              disabled={cart.length === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Bayar Sekarang
              <span className="ml-2 text-white/80 text-base font-normal">
                - Rp{getCartTotal().toLocaleString('id-ID')}
              </span>
            </Button>
          </div>
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

            {paymentMethod === 'QRIS' && storeSettings?.qrisImage && storeSettings?.qrisEnabled && (
              <>
                <Separator />
                <div className="flex flex-col items-center">
                  <Label className="mb-3">Scan QRIS</Label>
                  <div className="border-4 border-gray-200 rounded-lg p-4 bg-white">
                    <img
                      src={storeSettings.qrisImage}
                      alt="QRIS Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Scan QRIS ini untuk membayar Rp{getCartTotal().toLocaleString('id-ID')}
                  </p>
                </div>
              </>
            )}

            {paymentMethod === 'QRIS' && (!storeSettings?.qrisImage || !storeSettings?.qrisEnabled) && (
              <>
                <Separator />
                <div className="text-center py-6">
                  <Smartphone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">QRIS belum dikonfigurasi</p>
                  <p className="text-sm text-gray-400">Hubungi admin untuk mengatur QRIS</p>
                </div>
              </>
            )}

            {paymentMethod === 'DEBIT' && (
              <>
                <Separator />
                <div className="text-center py-6">
                  <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Silakan gunakan mesin EDC</p>
                  <p className="text-sm text-gray-400">Kartu Debit: Rp{getCartTotal().toLocaleString('id-ID')}</p>
                </div>
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
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-600" />
              Tutup Shift
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentShiftDetails ? (
              <div className="bg-orange-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Modal Awal</span>
                  <span className="font-semibold">Rp{currentShiftDetails.openingBalance.toLocaleString('id-ID')}</span>
                </div>
                <Separator className="bg-orange-200" />
                <div className="flex justify-between">
                  <span className="text-gray-600 font-semibold">Total Penjualan</span>
                  <span className="font-bold text-orange-600">Rp{(currentShiftDetails.totalSales || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tunai</span>
                    <span className="font-medium">Rp{(currentShiftDetails.totalCash || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Non-Tunai</span>
                    <span className="font-medium">Rp{(currentShiftDetails.totalNonCash || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Jumlah Transaksi</span>
                  <span className="font-medium">{currentShiftDetails.transactions?.length || 0}</span>
                </div>
                <Separator className="bg-orange-200" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Saldo Sistem</span>
                  <span className="text-orange-600">
                    Rp{(currentShiftDetails.systemBalance || currentShiftDetails.openingBalance + (currentShiftDetails.totalSales || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 p-4 rounded-lg text-center py-8">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Memuat data shift...</p>
              </div>
            )}

            <div>
              <Label>PIN Otorisasi</Label>
              <Input
                type="password"
                value={closeShiftPin}
                onChange={(e) => setCloseShiftPin(e.target.value)}
                placeholder="Masukkan PIN supervisor"
                maxLength={4}
                className="text-center text-2xl tracking-widest mt-2"
                autoFocus
              />
            </div>

            <Button
              onClick={handleCloseShift}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Tutup Shift
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseShift(false)
                setCloseShiftPin('')
                setCurrentShiftDetails(null)
              }}
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
