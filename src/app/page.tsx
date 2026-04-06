'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart, Minus, Plus, X, Phone, MapPin, Clock, Award, Flame,
  Home as HomeIcon, QrCode, History, Gift, User, Store, LayoutDashboard,
  Lock, Bell, Shield, FileText, Camera, ChevronRight, Save, Upload, Settings, LogOut, Share2, Copy
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

  // Profile modals state
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showSecuritySettings, setShowSecuritySettings] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showPrivacySettings, setShowPrivacySettings] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)

  // Profile forms state
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notificationSettings, setNotificationSettings] = useState({
    notificationOrders: true,
    notificationPromo: true,
    notificationPoints: true
  })
  const [privacySettings, setPrivacySettings] = useState({
    publicProfile: true,
    shareData: true,
    orderHistory: true
  })
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)

  // Point exchange products state
  const [pointExchangeProducts, setPointExchangeProducts] = useState<any[]>([])
  const [showRedeemCodeDialog, setShowRedeemCodeDialog] = useState(false)
  const [redeemCodeInfo, setRedeemCodeInfo] = useState<any>(null)

  // Redeem code in cart
  const [redeemCode, setRedeemCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [validatingRedeemCode, setValidatingRedeemCode] = useState(false)

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

  const fetchPointExchangeProducts = async () => {
    try {
      const response = await fetch('/api/admin/point-exchange-products')
      if (response.ok) {
        const data = await response.json()
        setPointExchangeProducts(data.filter((p: any) => p.isActive && p.stock > 0))
      }
    } catch (error) {
      console.error('Error fetching point exchange products:', error)
    }
  }

  // Fetch products and categories and load member from localStorage
  useEffect(() => {
    fetchProducts()

    // Load member from localStorage
    const savedMember = localStorage.getItem('member')
    if (savedMember) {
      try {
        const member = JSON.parse(savedMember)
        setCurrentMember(member)
        setMemberPoints(member.points || 0)
        setProfilePhoto(member.photo || null)
        setNotificationSettings({
          notificationOrders: member.notificationOrders ?? true,
          notificationPromo: member.notificationPromo ?? true,
          notificationPoints: member.notificationPoints ?? true
        })
        setPrivacySettings({
          publicProfile: member.publicProfile ?? true,
          shareData: member.shareData ?? true,
          orderHistory: member.orderHistory ?? true
        })
      } catch (error) {
        console.error('Error parsing member data:', error)
        localStorage.removeItem('member')
      }
    }
  }, [])

  // Fetch orders when on riwayat tab
  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchOrders()
    }
  }, [activeTab])

  // Fetch point exchange products when on tukar-point tab
  useEffect(() => {
    if (activeTab === 'tukar-point') {
      fetchPointExchangeProducts()
    }
  }, [activeTab])

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

        alert(`Pesanan berhasil dibuat! Order #${result.orderNumber}`)
        setCart([])
        setCheckoutForm({ name: '', phone: '', address: DEFAULT_ADDRESS, notes: '' })
        setShowCheckout(false)
        setShowCart(false)
        setRedeemCode('')
        setAppliedDiscount(null)
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

  // Bottom navigation items with cart inserted after Menu
  const bottomNavItems = [
    ...navItems.slice(0, 2), // beranda, menu
    { id: 'cart' as const, label: 'Keranjang', icon: ShoppingCart, isCart: true },
    ...navItems.slice(2), // qr-member, riwayat, tukar-point, profile
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
  const handleMemberLogout = useCallback(() => {
    setCurrentMember(null)
    setMemberPoints(0)
    localStorage.removeItem('member')
  }, [])

  // Handle edit profile
  const handleEditProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/members/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentMember.id,
          ...editProfileForm
        })
      })

      if (response.ok) {
        const data = await response.json()
        const updatedMember = { ...currentMember, ...data.member }
        setCurrentMember(updatedMember)
        localStorage.setItem('member', JSON.stringify(updatedMember))
        setShowEditProfile(false)
        alert('Profil berhasil diperbarui!')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember?.id, editProfileForm])

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        alert('Format file tidak valid. Harap upload file gambar (JPG, PNG, GIF, atau WebP).')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert('Ukuran file terlalu besar. Maksimal 5MB.')
        return
      }

      // Read and convert to base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const photoData = e.target?.result as string

          const response = await fetch('/api/members/photo', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memberId: currentMember.id,
              photo: photoData
            })
          })

          if (response.ok) {
            const data = await response.json()
            setProfilePhoto(data.photo)
            const updatedMember = { ...currentMember, photo: data.photo }
            setCurrentMember(updatedMember)
            localStorage.setItem('member', JSON.stringify(updatedMember))
            setShowPhotoUpload(false)
            alert('Foto profil berhasil diperbarui!')
          } else {
            const errorData = await response.json()
            alert(errorData.error || 'Gagal mengupload foto')
          }
        } catch (error) {
          console.error('Error processing photo upload:', error)
          alert('Terjadi kesalahan saat memproses foto. Silakan coba lagi.')
        }
      }

      reader.onerror = () => {
        alert('Gagal membaca file. Silakan coba lagi.')
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember?.id, currentMember])

  // Handle photo removal
  const handlePhotoRemove = useCallback(async () => {
    try {
      const response = await fetch(`/api/members/photo?id=${currentMember.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProfilePhoto(null)
        const updatedMember = { ...currentMember, photo: null }
        setCurrentMember(updatedMember)
        localStorage.setItem('member', JSON.stringify(updatedMember))
        alert('Foto profil berhasil dihapus!')
      } else {
        alert('Gagal menghapus foto')
      }
    } catch (error) {
      console.error('Error removing photo:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember?.id, currentMember])

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Password baru dan konfirmasi tidak cocok')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password baru minimal 6 karakter')
      return
    }

    try {
      const response = await fetch('/api/members/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentMember.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (response.ok) {
        setShowSecuritySettings(false)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        alert('Password berhasil diubah!')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal mengubah password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember?.id, passwordForm])

  // Handle notification settings update
  const handleNotificationUpdate = useCallback(async () => {
    try {
      const response = await fetch('/api/members/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentMember.id,
          ...notificationSettings
        })
      })

      if (response.ok) {
        const updatedMember = { ...currentMember, ...notificationSettings }
        setCurrentMember(updatedMember)
        localStorage.setItem('member', JSON.stringify(updatedMember))
        setShowNotificationSettings(false)
        alert('Pengaturan notifikasi berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui pengaturan notifikasi')
      }
    } catch (error) {
      console.error('Error updating notifications:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember?.id, notificationSettings, currentMember])

  // Handle privacy settings update
  const handlePrivacyUpdate = useCallback(async () => {
    try {
      const response = await fetch('/api/members/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentMember.email,
          ...privacySettings
        })
      })

      if (response.ok) {
        const updatedMember = { ...currentMember, ...privacySettings }
        setCurrentMember(updatedMember)
        localStorage.setItem('member', JSON.stringify(updatedMember))
        setShowPrivacySettings(false)
        alert('Pengaturan privasi berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui pengaturan privasi')
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember?.email, privacySettings, currentMember])

  // Handle exchange points
  const handleExchangePoints = useCallback(async (product: any) => {
    if (!currentMember) {
      alert('Silakan login terlebih dahulu!')
      router.push('/login')
      return
    }

    if (memberPoints < product.points) {
      alert(`Poin tidak cukup. Diperlukan ${product.points} poin.`)
      return
    }

    if (!confirm(`Tukar ${product.points} poin untuk ${product.name}?`)) {
      return
    }

    try {
      const response = await fetch('/api/members/exchange-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentMember.id,
          pointExchangeProductId: product.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Gagal menukar poin!')
        return
      }

      const result = await response.json()
      setRedeemCodeInfo(result)
      setShowRedeemCodeDialog(true)

      // Update member points
      const updatedMember = { ...currentMember, points: memberPoints - product.points }
      setCurrentMember(updatedMember)
      setMemberPoints(memberPoints - product.points)
      localStorage.setItem('member', JSON.stringify(updatedMember))

      // Refresh products to update stock
      fetchPointExchangeProducts()
    } catch (error) {
      console.error('Error exchanging points:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    }
  }, [currentMember, memberPoints])

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
          // For free product, we'll apply the discount as the product value
          // In a real implementation, you'd need to fetch the actual product price
          discountAmount = getCartTotal() * 0.5 // 50% discount as example
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

  // Handle remove redeem code
  const handleRemoveRedeemCode = () => {
    setRedeemCode('')
    setAppliedDiscount(null)
  }

  // Get final cart total with discount
  const getCartTotalWithDiscount = () => {
    const total = getCartTotal()
    if (appliedDiscount && appliedDiscount.discountAmount) {
      return Math.max(0, total - appliedDiscount.discountAmount)
    }
    return total
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Menu Kami</h1>
          <p className="text-orange-100 text-xs">Pilih menu favoritmu</p>
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
  const TukarPointSection = () => {
    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'DISCOUNT_FIXED':
          return 'Diskon Tetap'
        case 'DISCOUNT_PERCENT':
          return 'Diskon Persen'
        case 'FREE_PRODUCT':
          return 'Produk Gratis'
        default:
          return type
      }
    }

    const getValueDisplay = (product: any) => {
      switch (product.type) {
        case 'DISCOUNT_PERCENT':
          return `${product.value}%`
        case 'DISCOUNT_FIXED':
          return `Rp${product.value?.toLocaleString('id-ID')}`
        case 'FREE_PRODUCT':
          return '1 Menu Gratis'
        default:
          return '-'
      }
    }

    return (
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
            {!currentMember ? (
              <Card className="border-orange-200">
                <CardContent className="p-12 text-center">
                  <Gift className="w-24 h-24 mx-auto mb-6 text-orange-300" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Belum Login</h2>
                  <p className="text-gray-600 mb-6">Login sebagai member untuk menukar poin</p>
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  >
                    Login Member
                  </Button>
                </CardContent>
              </Card>
            ) : pointExchangeProducts.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-12 text-center">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Tidak Ada Produk</h2>
                  <p className="text-gray-500">Belum ada produk tukar poin yang tersedia saat ini</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pointExchangeProducts.map((product) => (
                  <Card key={product.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-4"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center mb-4">
                          <Gift className="w-12 h-12 text-orange-400" />
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 mb-2">{product.description}</p>
                      )}
                      <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700">
                        {getTypeLabel(product.type)}
                      </Badge>
                      <p className="text-orange-600 font-bold text-2xl mb-2">
                        {product.points.toLocaleString()} Point
                      </p>
                      <p className="text-sm text-gray-600 mb-1">{getValueDisplay(product)}</p>
                      <p className="text-xs text-gray-500 mb-4">Stok tersedia: {product.stock}</p>
                      <Button
                        onClick={() => handleExchangePoints(product)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                        disabled={memberPoints < product.points || product.stock <= 0}
                      >
                        {memberPoints < product.points
                          ? `Kurang ${product.points - memberPoints} Poin`
                          : product.stock <= 0
                          ? 'Stok Habis'
                          : 'Tukar Sekarang'}
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
  }

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
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Profile Card */}
          {currentMember && (
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  {/* Profile Photo */}
                  <div className="relative mb-4 group">
                    <Avatar className="w-24 h-24 border-4 border-orange-200">
                      {profilePhoto ? (
                        <AvatarImage src={profilePhoto} alt={currentMember.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl">
                        {currentMember.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => setShowPhotoUpload(true)}
                      className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{currentMember.name}</h2>
                  <p className="text-gray-500 mb-3">{currentMember.phone}</p>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Badge className="bg-orange-500 text-white">
                      <Award className="w-3 h-3 mr-1" />
                      {memberPoints} Point
                    </Badge>
                    <Badge className="bg-green-500 text-white">
                      Active Member
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Settings */}
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-orange-600" />
                Pengaturan Akun
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-orange-300 hover:bg-orange-50"
                  onClick={() => {
                    setEditProfileForm({
                      name: currentMember.name,
                      phone: currentMember.phone,
                      address: currentMember.address || ''
                    })
                    setShowEditProfile(true)
                  }}
                >
                  <User className="w-5 h-5 mr-3 text-orange-600" />
                  Edit Profile
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-orange-300 hover:bg-orange-50"
                  onClick={() => {
                    setEditProfileForm({
                      name: currentMember.name,
                      phone: currentMember.phone,
                      address: currentMember.address || ''
                    })
                    setShowAddressModal(true)
                  }}
                >
                  <MapPin className="w-5 h-5 mr-3 text-orange-600" />
                  Alamat Pengiriman
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-orange-600" />
                Keamanan
              </h3>
              <Button
                variant="outline"
                className="w-full justify-start border-orange-300 hover:bg-orange-50"
                onClick={() => setShowSecuritySettings(true)}
              >
                <Lock className="w-5 h-5 mr-3 text-orange-600" />
                Ubah Password
                <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-orange-600" />
                Notifikasi
              </h3>
              <Button
                variant="outline"
                className="w-full justify-start border-orange-300 hover:bg-orange-50"
                onClick={() => setShowNotificationSettings(true)}
              >
                <Settings className="w-5 h-5 mr-3 text-orange-600" />
                Pengaturan Notifikasi
                <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
              </Button>
            </CardContent>
          </Card>

          {/* Privacy & Policy */}
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                Privasi & Kebijakan
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-orange-300 hover:bg-orange-50"
                  onClick={() => setShowPrivacySettings(true)}
                >
                  <Shield className="w-5 h-5 mr-3 text-orange-600" />
                  Pengaturan Privasi
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-orange-300 hover:bg-orange-50"
                  onClick={() => setShowPolicy(true)}
                >
                  <FileText className="w-5 h-5 mr-3 text-orange-600" />
                  Kebijakan Layanan
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Store className="w-5 h-5 mr-2 text-orange-600" />
                Bantuan
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                  <Phone className="w-5 h-5 mr-3 text-orange-600" />
                  Hubungi Kami
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                </Button>
                <Button variant="outline" className="w-full justify-start border-orange-300 hover:bg-orange-50">
                  <Gift className="w-5 h-5 mr-3 text-orange-600" />
                  Riwayat Point
                  <ChevronRight className="w-5 h-5 ml-auto text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          {currentMember && (
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleMemberLogout}
                >
                  <LogOut className="w-5 h-5 mr-2" />
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

            {/* Redeem Code Section */}
            <div className="border-t border-orange-200 pt-4 space-y-3">
              {!appliedDiscount ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan kode redeem"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="border-orange-200 focus:border-orange-500 uppercase font-mono"
                    disabled={validatingRedeemCode}
                  />
                  <Button
                    onClick={handleValidateRedeemCode}
                    disabled={validatingRedeemCode || !redeemCode.trim()}
                    variant="outline"
                    className="border-orange-300 hover:bg-orange-50 text-orange-600"
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

            <div className="border-t border-orange-200 pt-4 space-y-2">
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
              <div className="flex justify-between font-bold text-lg text-orange-800">
                <span>Total</span>
                <span>Rp{getCartTotalWithDiscount().toLocaleString('id-ID')}</span>
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

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-2">
            {appliedDiscount && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon ({appliedDiscount.productName})</span>
                <span>-Rp{appliedDiscount.discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total Pembayaran:</span>
              <span className="text-orange-600">Rp{getCartTotalWithDiscount().toLocaleString('id-ID')}</span>
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

      {/* Profile Dialogs */}
      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md" key="edit-profile-modal">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={editProfileForm.name}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Nomor Telepon</Label>
              <Input
                id="edit-phone"
                value={editProfileForm.phone}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                placeholder="Masukkan nomor telepon"
                autoComplete="off"
              />
            </div>
            <Button
              onClick={handleEditProfile}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-md" key="address-modal">
          <DialogHeader>
            <DialogTitle>Alamat Pengiriman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-address">Alamat Lengkap</Label>
              <Textarea
                id="edit-address"
                value={editProfileForm.address}
                onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                placeholder="Masukkan alamat lengkap"
                rows={4}
              />
            </div>
            <Button
              onClick={handleEditProfile}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Settings Modal */}
      <Dialog open={showSecuritySettings} onOpenChange={setShowSecuritySettings}>
        <DialogContent className="max-w-md" key="security-modal">
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Masukkan password saat ini"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Masukkan password baru (minimal 6 karakter)"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Ubah Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Modal */}
      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent className="max-w-md" key="notification-modal">
          <DialogHeader>
            <DialogTitle>Pengaturan Notifikasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Notifikasi Pesanan</Label>
                <p className="text-sm text-gray-500">Dapatkan notifikasi status pesanan</p>
              </div>
              <Switch
                checked={notificationSettings.notificationOrders}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, notificationOrders: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Notifikasi Promo</Label>
                <p className="text-sm text-gray-500">Dapatkan info promo dan diskon</p>
              </div>
              <Switch
                checked={notificationSettings.notificationPromo}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, notificationPromo: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Notifikasi Poin</Label>
                <p className="text-sm text-gray-500">Dapatkan notifikasi perubahan poin</p>
              </div>
              <Switch
                checked={notificationSettings.notificationPoints}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, notificationPoints: checked })
                }
              />
            </div>
            <Button
              onClick={handleNotificationUpdate}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white mt-4"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Settings Modal */}
      <Dialog open={showPrivacySettings} onOpenChange={setShowPrivacySettings}>
        <DialogContent className="max-w-md max-h-[85vh]" key="privacy-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pengaturan Privasi</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Kelola privasi data Anda. Semua perubahan akan disinkronisasi dengan sistem admin.
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4 pt-2">
              {/* Public Profile Card */}
              <Card className="border-orange-200 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-5 h-5 text-orange-600" />
                        <p className="font-semibold text-base text-gray-800">Profil Publik</p>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Tampilkan profil Anda kepada pengguna lain
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.publicProfile}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, publicProfile: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Share Data Card */}
              <Card className="border-orange-200 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Share2 className="w-5 h-5 text-orange-600" />
                        <p className="font-semibold text-base text-gray-800">Bagikan Data</p>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Izinkan analisis data untuk meningkatkan layanan
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.shareData}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, shareData: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order History Card */}
              <Card className="border-orange-200 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <History className="w-5 h-5 text-orange-600" />
                        <p className="font-semibold text-base text-gray-800">Riwayat Pesanan</p>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Simpan dan tampilkan riwayat pesanan Anda
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.orderHistory}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({ ...privacySettings, orderHistory: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Privasi Terlindungi</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Data Anda dilindungi dengan standar keamanan terbaik. Anda dapat mengubah pengaturan ini kapan saja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <Button
              onClick={handlePrivacyUpdate}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Modal */}
      <Dialog open={showPolicy} onOpenChange={setShowPolicy}>
        <DialogContent className="max-w-lg max-h-[80vh]" key="policy-modal">
          <DialogHeader>
            <DialogTitle>Kebijakan Layanan</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h4 className="font-semibold text-base mb-2">1. Pendaftaran Member</h4>
                <p className="text-gray-600">
                  Pendaftaran member gratis dan terbuka untuk semua pelanggan. Anda dapat mendaftar
                  melalui aplikasi atau di outlet kami.
                </p>
              </section>
              <Separator />
              <section>
                <h4 className="font-semibold text-base mb-2">2. Sistem Poin</h4>
                <p className="text-gray-600">
                  Setiap pembelian Rp10.000 akan mendapatkan 1 poin. Poin dapat ditukar dengan diskon
                  atau menu gratis sesuai ketentuan yang berlaku.
                </p>
              </section>
              <Separator />
              <section>
                <h4 className="font-semibold text-base mb-2">3. Penggunaan Poin</h4>
                <p className="text-gray-600">
                  - 100 Poin = Diskon Rp10.000<br />
                  - 250 Poin = Diskon Rp25.000<br />
                  - 500 Poin = 1 Menu Gratis
                </p>
              </section>
              <Separator />
              <section>
                <h4 className="font-semibold text-base mb-2">4. Privasi Data</h4>
                <p className="text-gray-600">
                  Data pribadi Anda akan kami jaga kerahasiaannya dan hanya digunakan untuk keperluan
                  layanan dan komunikasi terkait.
                </p>
              </section>
              <Separator />
              <section>
                <h4 className="font-semibold text-base mb-2">5. Pembatalan Pesanan</h4>
                <p className="text-gray-600">
                  Pesanan dapat dibatalkan maksimal 10 menit setelah pemesanan. Setelah itu,
                  pembatalan dikenakan biaya administrasi 20% dari total pesanan.
                </p>
              </section>
              <Separator />
              <section>
                <h4 className="font-semibold text-base mb-2">6. Layanan Mandiri</h4>
                <p className="text-gray-600">
                  Anda dapat mengelola akun, memperbarui profil, mengubah password, dan mengatur
                  preferensi notifikasi secara mandiri. Semua perubahan akan tersinkronisasi dengan
                  sistem admin secara real-time.
                </p>
              </section>
              <Separator />
              <section>
                <h4 className="font-semibold text-base mb-2">7. Syarat & Ketentuan Lainnya</h4>
                <p className="text-gray-600">
                  Dengan menggunakan layanan ini, Anda menyetujui semua syarat dan ketentuan yang
                  berlaku. Kami berhak mengubah kebijakan sewaktu-waktu dengan pemberitahuan
                  sebelumnya.
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-md" key="photo-upload-modal">
          <DialogHeader>
            <DialogTitle>Foto Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <Avatar className="w-32 h-32 mb-4">
                {profilePhoto ? (
                  <AvatarImage src={profilePhoto} alt={currentMember?.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl">
                  {currentMember?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                id="photoInput"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoUpload(file)
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => document.getElementById('photoInput')?.click()}
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Foto
                </Button>
                {profilePhoto && (
                  <Button
                    onClick={handlePhotoRemove}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-center text-gray-500">
              Format: JPG, PNG. Maksimal 5MB. Rasio persegi disarankan.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Code Dialog */}
      <Dialog open={showRedeemCodeDialog} onOpenChange={setShowRedeemCodeDialog}>
        <DialogContent className="max-w-md" key="redeem-code-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-600" />
              Kode Redeem Anda
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Salin kode redeem ini:</p>
              <div className="bg-white border-2 border-orange-400 rounded-lg p-3 mb-3">
                <p className="text-2xl font-bold text-orange-600 tracking-wider font-mono">
                  {redeemCodeInfo?.redeemCode}
                </p>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(redeemCodeInfo?.redeemCode)
                  alert('Kode redeem berhasil disalin!')
                }}
                variant="outline"
                className="border-orange-300 hover:bg-orange-50 text-orange-600"
              >
                <Copy className="w-4 h-4 mr-2" />
                Salin Kode
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Produk:</span>
                <span className="font-semibold">{redeemCodeInfo?.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Poin digunakan:</span>
                <span className="font-semibold text-orange-600">{redeemCodeInfo?.pointsUsed} Poin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Berlaku hingga:</span>
                <span className="font-semibold">
                  {redeemCodeInfo?.expiresAt
                    ? new Date(redeemCodeInfo.expiresAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '-'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Gunakan kode ini di keranjang belanja untuk mendapatkan diskon.
              Kode hanya bisa digunakan satu kali dan akan kadaluarsa 30 hari dari penukaran.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-around py-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const isCart = (item as any).isCart

              return (
                <button
                  key={item.id}
                  onClick={isCart ? () => setShowCart(true) : () => handleTabClick(item.id)}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] transition-colors relative ${
                    isActive ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                    {/* Show cart count badge */}
                    {isCart && getCartCount() > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {getCartCount()}
                      </Badge>
                    )}
                    {/* Show points badge on Tukar Point */}
                    {item.id === 'tukar-point' && memberPoints > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                        {memberPoints}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>



      {/* Dialogs */}
      <CartDialog />
      <CheckoutDialog />
    </div>
  )
}
