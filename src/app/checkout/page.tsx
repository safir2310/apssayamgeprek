'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShoppingCart, Flame, Gift, X, Minus, Plus } from 'lucide-react'

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

// Default address for checkout
const DEFAULT_ADDRESS = 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, 24151'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: DEFAULT_ADDRESS,
    notes: ''
  })

  // Redeem code state
  const [redeemCode, setRedeemCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [validatingRedeemCode, setValidatingRedeemCode] = useState(false)

  // Fetch products
  useEffect(() => {
    fetchProducts()
  }, [])

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Reconstruct cart with product data
        const reconstructedCart = parsedCart.map((item: any) => ({
          product: products.find((p: Product) => p.id === item.productId) || item.product,
          quantity: item.quantity
        })).filter((item: CartItem) => item.product)
        setCart(reconstructedCart)
      } catch (error) {
        console.error('Error parsing cart:', error)
      }
    }
    setLoading(false)
  }, [products])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
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
    if (!redeemCode.trim()) {
      alert('Silakan masukkan kode redeem')
      return
    }

    setValidatingRedeemCode(true)
    try {
      const response = await fetch(`/api/redeem-codes?code=${encodeURIComponent(redeemCode.trim())}`)

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Kode redeem tidak valid')
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

        alert(`Kode redeem berhasil diterapkan! Diskon: Rp${discountAmount.toLocaleString('id-ID')}`)
      }
    } catch (error) {
      console.error('Error validating redeem code:', error)
      alert('Terjadi kesalahan saat memvalidasi kode redeem')
    } finally {
      setValidatingRedeemCode(false)
    }
  }

  const handleRemoveRedeemCode = () => {
    setRedeemCode('')
    setAppliedDiscount(null)
  }

  const getCartTotalWithDiscount = () => {
    const total = getCartTotal()
    if (appliedDiscount && appliedDiscount.discountAmount) {
      return Math.max(0, total - appliedDiscount.discountAmount)
    }
    return total
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!')
      return
    }

    const finalTotal = getCartTotalWithDiscount()
    const discount = appliedDiscount ? appliedDiscount.discountAmount : 0

    const orderData = {
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerAddress: checkoutForm.address,
      notes: checkoutForm.notes,
      totalAmount: finalTotal,
      discount: discount,
      redeemCode: appliedDiscount ? appliedDiscount.code : null,
      paymentMethod: 'CASH',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))
    }

    setSubmitting(true)
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

        // Clear cart from localStorage
        localStorage.removeItem('cart')

        // Redirect to home with history tab
        router.push('/?tab=riwayat')
      } else {
        const errorData = await response.json()
        console.error('Order creation error:', errorData)
        alert(errorData.error || 'Gagal membuat pesanan. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
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

                {/* Redeem Code Section */}
                <div>
                  <Label>Kode Redeem (Opsional)</Label>
                  <div className="mt-2 space-y-2">
                    {!appliedDiscount ? (
                      <div className="flex gap-2">
                        <Input
                          value={redeemCode}
                          onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                          placeholder="Masukkan kode redeem"
                          className="border-orange-200 focus:border-orange-500 uppercase"
                        />
                        <Button
                          type="button"
                          onClick={handleValidateRedeemCode}
                          disabled={validatingRedeemCode || !redeemCode.trim()}
                          variant="outline"
                          className="border-orange-300 hover:bg-orange-50 text-orange-600 whitespace-nowrap"
                        >
                          {validatingRedeemCode ? 'Memeriksa...' : 'Terapkan'}
                        </Button>
                      </div>
                    ) : (
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
                      <span>Diskon ({appliedDiscount.productName})</span>
                      <span>-Rp{appliedDiscount.discountAmount.toLocaleString('id-ID')}</span>
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
