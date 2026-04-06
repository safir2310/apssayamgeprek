'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, ShoppingCart, Flame, Gift, X, Minus, Plus, CreditCard, QrCode, Smartphone, Wallet, Landmark, DollarSign } from 'lucide-react'

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

interface PaymentMethod {
  code: string
  name: string
  icon: string | null
}

// Default address for checkout
const DEFAULT_ADDRESS = 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151'

// Form data key for localStorage
const FORM_DATA_KEY = 'checkout_form_data'
const PAYMENT_METHOD_KEY = 'checkout_payment_method'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  // Use refs for form inputs - NO RE-RENDERS when typing
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLTextAreaElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const redeemCodeRef = useRef<HTMLInputElement>(null)

  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH')

  // Redeem code state
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)
  const [validatingRedeemCode, setValidatingRedeemCode] = useState(false)

  // Initial load flag
  const isInitialized = useRef(false)

  // Fetch products and load cart
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const loadProductsAndCart = async () => {
      try {
        // Fetch products
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          setProducts(data)

          // Now load cart from localStorage
          const savedCart = localStorage.getItem('cart')

          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart)

              // Reconstruct cart with product data
              const reconstructedCart = parsedCart.map((item: any) => {
                const product = data.find((p: Product) => p.id === item.productId)
                return {
                  product: product,
                  quantity: item.quantity
                }
              }).filter((item: CartItem) => item.product)

              setCart(reconstructedCart)
            } catch (error) {
              console.error('Error parsing cart:', error)
            }
          }
        }

        // Fetch payment methods
        try {
          const paymentResponse = await fetch('/api/payment-methods')
          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json()
            setPaymentMethods(paymentData)
          }
        } catch (error) {
          console.error('Error fetching payment methods:', error)
        }

        // Load saved form data and set initial values to refs
        const savedFormData = localStorage.getItem(FORM_DATA_KEY)
        if (savedFormData) {
          try {
            const parsedData = JSON.parse(savedFormData)
            // Set initial values after refs are attached
            setTimeout(() => {
              if (nameRef.current) nameRef.current.value = parsedData.name || ''
              if (phoneRef.current) phoneRef.current.value = parsedData.phone || ''
              if (addressRef.current) addressRef.current.value = parsedData.address || DEFAULT_ADDRESS
              if (notesRef.current) notesRef.current.value = parsedData.notes || ''
            }, 0)
          } catch (error) {
            console.error('Error parsing saved form data:', error)
          }
        }

        // Load saved payment method from localStorage
        const savedPaymentMethod = localStorage.getItem(PAYMENT_METHOD_KEY)
        if (savedPaymentMethod) {
          setSelectedPaymentMethod(savedPaymentMethod)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProductsAndCart()
  }, [])

  // Save form data to localStorage
  const saveFormData = () => {
    try {
      const data = {
        name: nameRef.current?.value || '',
        phone: phoneRef.current?.value || '',
        address: addressRef.current?.value || DEFAULT_ADDRESS,
        notes: notesRef.current?.value || ''
      }
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving form data:', error)
    }
  }

  const saveCartToLocalStorage = (newCart: CartItem[]) => {
    const cartData = newCart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }))
    localStorage.setItem('cart', JSON.stringify(cartData))
  }

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId)
    setCart(newCart)
    saveCartToLocalStorage(newCart)
  }

  const updateQuantity = (productId: string, change: number) => {
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(0, Math.min(item.quantity + change, item.product.stock))
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0)

    setCart(newCart)
    saveCartToLocalStorage(newCart)
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  // Handle redeem code validation
  const handleValidateRedeemCode = async () => {
    const code = redeemCodeRef.current?.value || ''

    if (!code.trim()) {
      alert('Silakan masukkan kode redeem/voucher')
      return
    }

    setValidatingRedeemCode(true)
    try {
      // First try to validate as voucher
      const cartTotal = getCartTotal()
      const voucherResponse = await fetch(`/api/vouchers?code=${encodeURIComponent(code.trim())}&cartTotal=${cartTotal}`)

      if (voucherResponse.ok) {
        const voucherResult = await voucherResponse.json()

        if (voucherResult.valid) {
          const promo = voucherResult.promo

          // If it's a free product or BOGO, add product to cart
          if (promo.freeProductId) {
            const product = products.find(p => p.id === promo.freeProductId)
            if (product) {
              // Check if product already in cart
              const existingItem = cart.find(item => item.product.id === promo.freeProductId)
              const newCart = existingItem
                ? cart.map(item =>
                    item.product.id === promo.freeProductId
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
                  )
                : [...cart, { product, quantity: 1 }]

              setCart(newCart)
              saveCartToLocalStorage(newCart)
            }
          }

          setAppliedVoucher({
            code: promo.code,
            name: promo.name,
            type: promo.type,
            value: promo.value,
            discountAmount: promo.discountAmount,
            freeProductId: promo.freeProductId,
            freeProductName: promo.freeProductName
          })

          // Clear input
          if (redeemCodeRef.current) {
            redeemCodeRef.current.value = ''
          }

          alert(
            promo.type === 'FREE_PRODUCT' || promo.type === 'BOGO'
              ? `Voucher berhasil! ${promo.freeProductName} telah ditambahkan ke keranjang!`
              : `Voucher berhasil diterapkan! Diskon: Rp${promo.discountAmount.toLocaleString('id-ID')}`
          )
          return
        }
      }

      // If voucher validation fails, try as redeem code
      const response = await fetch(`/api/redeem-codes?code=${encodeURIComponent(code.trim())}`)

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Kode tidak valid')
        return
      }

      const result = await response.json()

      if (result.valid) {
        let discountAmount = 0

        // Calculate discount based on type
        if (result.type === 'DISCOUNT_FIXED') {
          discountAmount = result.value
        } else if (result.type === 'DISCOUNT_PERCENT') {
          discountAmount = (getCartTotal() * result.value) / 100
        } else if (result.type === 'FREE_PRODUCT') {
          discountAmount = getCartTotal() * 0.5
        }

        setAppliedDiscount({
          code: result.code,
          productName: result.productName,
          type: result.type,
          value: result.value,
          discountAmount
        })

        // Clear input
        if (redeemCodeRef.current) {
          redeemCodeRef.current.value = ''
        }

        alert(`Kode redeem berhasil diterapkan! Diskon: Rp${discountAmount.toLocaleString('id-ID')}`)
      }
    } catch (error) {
      console.error('Error validating code:', error)
      alert('Terjadi kesalahan saat memvalidasi kode')
    } finally {
      setValidatingRedeemCode(false)
    }
  }

  const handleRemoveRedeemCode = () => {
    if (redeemCodeRef.current) {
      redeemCodeRef.current.value = ''
    }
    setAppliedDiscount(null)
    setAppliedVoucher(null)
  }

  const getCartTotalWithDiscount = () => {
    const total = getCartTotal()
    let discount = 0
    if (appliedDiscount && appliedDiscount.discountAmount) {
      discount += appliedDiscount.discountAmount
    }
    if (appliedVoucher && appliedVoucher.discountAmount) {
      discount += appliedVoucher.discountAmount
    }
    return Math.max(0, total - discount)
  }

  const getPaymentIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      DollarSign,
      CreditCard,
      QrCode,
      Smartphone,
      Wallet,
      Landmark
    }
    const Icon = icons[iconName] || DollarSign
    return <Icon className="w-5 h-5" />
  }

  const clearCheckoutData = () => {
    localStorage.removeItem(FORM_DATA_KEY)
    localStorage.removeItem(PAYMENT_METHOD_KEY)
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get values from refs
    const name = nameRef.current?.value || ''
    const phone = phoneRef.current?.value || ''
    const address = addressRef.current?.value || DEFAULT_ADDRESS
    const notes = notesRef.current?.value || ''

    // Validate cart
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!')
      return
    }

    // Validate form fields
    if (!name.trim()) {
      alert('Silakan masukkan nama lengkap!')
      return
    }

    if (!phone.trim()) {
      alert('Silakan masukkan nomor WhatsApp!')
      return
    }

    if (!address.trim()) {
      alert('Silakan masukkan alamat pengiriman!')
      return
    }

    // Validate cart items have product data
    const invalidItems = cart.filter(item => !item.product || !item.product.id)
    if (invalidItems.length > 0) {
      console.error('Invalid cart items:', invalidItems)
      alert('Terdapat item keranjang yang tidak valid. Silakan ulangi pesanan.')
      return
    }

    const finalTotal = getCartTotalWithDiscount()
    const discount = appliedDiscount ? appliedDiscount.discountAmount : 0

    const orderData = {
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      notes: notes.trim(),
      totalAmount: finalTotal,
      discount: discount,
      redeemCode: appliedDiscount ? appliedDiscount.code : null,
      paymentMethod: selectedPaymentMethod,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))
    }

    console.log('Sending order data:', orderData)

    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      let result
      try {
        result = await response.json()
        console.log('Order response:', result)
      } catch (parseError) {
        console.error('Error parsing response:', parseError)
        const responseText = await response.text()
        console.error('Response text:', responseText)
        result = { error: `Invalid response (${response.status}): ${responseText || 'No content'}` }
      }

      if (response.ok) {
        // Mark redeem code as used if applicable
        if (appliedDiscount) {
          try {
            await fetch('/api/redeem-codes/use', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: appliedDiscount.code,
                orderId: result.id
              })
            })
          } catch (error) {
            console.error('Error marking redeem code as used:', error)
          }
        }

        // Clear cart and checkout data from localStorage
        localStorage.removeItem('cart')
        clearCheckoutData()

        // Show success message before redirect
        alert(`Pesanan berhasil dibuat! Order #${result.orderNumber}`)

        // Redirect to home with history tab
        router.push('/?tab=riwayat')
        return
      } else {
        console.error('Order creation error:', result)
        const errorMessage = result?.error || `Gagal membuat pesanan (Status: ${response.status})`
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert(`Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value)
    localStorage.setItem(PAYMENT_METHOD_KEY, value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-orange-700">Memuat keranjang...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <Card className="max-w-md mx-4 border-orange-200">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-orange-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Keranjang Kosong</h2>
            <p className="text-gray-500 mb-6">Silakan tambahkan produk ke keranjang terlebih dahulu</p>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-orange-500 to-orange-400 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 text-white py-4 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Checkout</h1>
            <p className="text-orange-100 text-xs">{getCartCount()} item di keranjang</p>
          </div>
        </div>
      </header>

      <main className="py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Cart Items */}
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Item Keranjang</h2>
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-start gap-4 pb-4 border-b border-orange-100 last:border-0 last:pb-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <Flame className="w-10 h-10 text-orange-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{item.product.name}</h3>
                      <p className="text-sm text-orange-600 font-semibold mb-2">
                        Rp{item.product.price.toLocaleString('id-ID')}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-300"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-orange-300"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:bg-red-50 ml-auto"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">Informasi Pengiriman</h2>
              <form onSubmit={handleCheckout} className="space-y-4" onKeyDown={(e) => {
                // Prevent form submission on Enter key in input fields
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault()
                }
              }}>
                <div>
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    ref={nameRef}
                    required
                    defaultValue={localStorage.getItem(FORM_DATA_KEY) ? JSON.parse(localStorage.getItem(FORM_DATA_KEY) || '{}')?.name || '' : ''}
                    onBlur={saveFormData}
                    placeholder="Masukkan nama lengkap"
                    className="border-orange-200 focus:border-orange-500"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">No. WhatsApp *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    ref={phoneRef}
                    required
                    defaultValue={localStorage.getItem(FORM_DATA_KEY) ? JSON.parse(localStorage.getItem(FORM_DATA_KEY) || '{}')?.phone || '' : ''}
                    onBlur={saveFormData}
                    placeholder="08xxxxxxxxxx"
                    className="border-orange-200 focus:border-orange-500"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Alamat Pengiriman *</Label>
                  <Textarea
                    id="address"
                    ref={addressRef}
                    required
                    defaultValue={localStorage.getItem(FORM_DATA_KEY) ? JSON.parse(localStorage.getItem(FORM_DATA_KEY) || '{}')?.address || DEFAULT_ADDRESS : DEFAULT_ADDRESS}
                    onBlur={saveFormData}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    ref={notesRef}
                    defaultValue={localStorage.getItem(FORM_DATA_KEY) ? JSON.parse(localStorage.getItem(FORM_DATA_KEY) || '{}')?.notes || '' : ''}
                    onBlur={saveFormData}
                    placeholder="Catatan tambahan untuk pesanan"
                    rows={2}
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>

                {/* Redeem Code / Voucher Section */}
                <div>
                  <Label>Kode Voucher / Redeem (Opsional)</Label>
                  <div className="mt-2 space-y-2">
                    {!appliedDiscount && !appliedVoucher ? (
                      <div className="flex gap-2">
                        <Input
                          ref={redeemCodeRef}
                          onChange={(e) => {
                            // Auto uppercase while typing
                            if (e.target) {
                              e.target.value = e.target.value.toUpperCase()
                            }
                          }}
                          placeholder="Masukkan kode voucher atau redeem"
                          className="border-orange-200 focus:border-orange-500 uppercase"
                        />
                        <Button
                          type="button"
                          onClick={handleValidateRedeemCode}
                          disabled={validatingRedeemCode}
                          variant="outline"
                          className="border-orange-300 hover:bg-orange-50 text-orange-600 whitespace-nowrap"
                        >
                          {validatingRedeemCode ? 'Memeriksa...' : 'Terapkan'}
                        </Button>
                      </div>
                    ) : (
                      <>
                        {appliedVoucher && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-blue-800 text-sm">
                                  {appliedVoucher.name}
                                </span>
                                {appliedVoucher.type === 'FREE_PRODUCT' && (
                                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                                    Produk Gratis
                                  </span>
                                )}
                                {appliedVoucher.type === 'BOGO' && (
                                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                    BOGO
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleRemoveRedeemCode}
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-700">
                                {appliedVoucher.type === 'FREE_PRODUCT'
                                  ? 'Produk gratis:'
                                  : 'Diskon diterapkan:'}
                              </span>
                              <span className="font-bold text-blue-700">
                                {appliedVoucher.type === 'FREE_PRODUCT'
                                  ? appliedVoucher.freeProductName
                                  : `-Rp${appliedVoucher.discountAmount.toLocaleString('id-ID')}`}
                              </span>
                            </div>
                          </div>
                        )}
                        {appliedDiscount && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-800 text-sm">
                                  {appliedDiscount.productName}
                                </span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleRemoveRedeemCode}
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700">Diskon diterapkan:</span>
                              <span className="font-bold text-green-700">
                                -Rp{appliedDiscount.discountAmount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Method Section */}
                <div>
                  <Label>Metode Pembayaran *</Label>
                  <div className="mt-3 space-y-3">
                    {paymentMethods.length > 0 ? (
                      <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
                        {paymentMethods
                          .filter(pm => pm.isActive !== false)
                          .sort((a, b) => {
                            const orderA = paymentMethods.findIndex(pm => pm.code === a.code)
                            const orderB = paymentMethods.findIndex(pm => pm.code === b.code)
                            return orderA - orderB
                          })
                          .map((method) => (
                            <div
                              key={method.code}
                              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedPaymentMethod === method.code
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300'
                              }`}
                              onClick={() => handlePaymentMethodChange(method.code)}
                            >
                              <RadioGroupItem value={method.code} className="sr-only" />
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center text-orange-600 mr-3">
                                {method.icon ? getPaymentIcon(method.icon) : <CreditCard className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">{method.name}</p>
                                <p className="text-xs text-gray-500">{method.code}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedPaymentMethod === method.code
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-gray-300'
                              }`}>
                                {selectedPaymentMethod === method.code && (
                                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                )}
                              </div>
                            </div>
                          ))}
                      </RadioGroup>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>Memuat metode pembayaran...</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>Rp{getCartTotal().toLocaleString('id-ID')}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon Redeem ({appliedDiscount.productName})</span>
                      <span>-Rp{appliedDiscount.discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {appliedVoucher && appliedVoucher.type !== 'FREE_PRODUCT' && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Voucher {appliedVoucher.name}</span>
                      <span>
                        {appliedVoucher.type === 'PERCENTAGE'
                          ? `-${appliedVoucher.value}%`
                          : appliedVoucher.type === 'BOGO'
                          ? `-Rp${appliedVoucher.discountAmount.toLocaleString('id-ID')} (BOGO)`
                          : `-Rp${appliedVoucher.discountAmount.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  )}
                  {appliedVoucher && appliedVoucher.type === 'FREE_PRODUCT' && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Produk Gratis: {appliedVoucher.freeProductName}</span>
                      <span>Gratis</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Pembayaran:</span>
                    <span className="text-orange-600">Rp{getCartTotalWithDiscount().toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white h-12 text-lg"
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Pesanan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
