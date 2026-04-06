# API Documentation - POS System

## Overview
All API endpoints in this POS system are synchronized with the database using Prisma ORM. Every feature in the Admin Panel is connected to the database and accessible from both POS and User Dashboard.

---

## 📦 Products API

### Get All Products
```http
GET /api/products
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "image": "string | null",
    "price": number,
    "stock": number,
    "category": "string",
    "categoryId": "string",
    "barcode": "string | null",
    "isActive": boolean,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
]
```

**Used in:**
- ✅ POS Page - `/pos`
- ✅ User Dashboard - `/`
- ✅ Admin Products Page - `/admin/products`

---

### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "string",
  "description": "string | null",
  "image": "string | null",
  "price": number,
  "cost": number | null,
  "stock": number,
  "categoryId": "string",
  "barcode": "string | null",
  "isActive": boolean
}
```

**Used in:**
- ✅ Admin Products Page - `/admin/products`

---

### Get Single Product
```http
GET /api/admin/products/{id}
```

**Used in:**
- ✅ Admin Products Page (Edit)

---

### Update Product
```http
PUT /api/admin/products/{id}
Content-Type: application/json

{
  "name": "string",
  "barcode": "string | null",
  "description": "string | null",
  "image": "string | null",
  "price": number,
  "cost": number | null,
  "stock": number,
  "categoryId": "string",
  "isActive": boolean
}
```

**Used in:**
- ✅ Admin Products Page (Edit)
- ✅ Automatically creates stock log when stock changes

---

### Delete Product
```http
DELETE /api/admin/products/{id}
```

**Used in:**
- ✅ Admin Products Page (Delete)
- ⚠️ Cannot delete if used in orders or transactions

---

## 📂 Categories API

### Get All Categories
```http
GET /api/categories
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "_count": {
      "products": number
    }
  }
]
```

**Used in:**
- ✅ POS Page - `/pos`
- ✅ User Dashboard - `/`
- ✅ Admin Categories Page - `/admin/categories`

---

### Create Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "string"
}
```

**Used in:**
- ✅ Admin Categories Page

---

### Get Single Category
```http
GET /api/admin/categories/{id}
```

**Used in:**
- ✅ Admin Categories Page (Edit)

---

### Update Category
```http
PUT /api/admin/categories/{id}
Content-Type: application/json

{
  "name": "string"
}
```

**Used in:**
- ✅ Admin Categories Page (Edit)

---

### Delete Category
```http
DELETE /api/admin/categories/{id}
```

**Used in:**
- ✅ Admin Categories Page (Delete)
- ⚠️ Cannot delete if contains products

---

## 👥 Members API

### Get All Members
```http
GET /api/admin/members?page=1&limit=50&search=&isActive=
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search by name, phone, or email
- `isActive` - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Used in:**
- ✅ Admin Members Page - `/admin/members`

---

### Create Member
```http
POST /api/admin/members
Content-Type: application/json

{
  "name": "string",
  "phone": "string",
  "email": "string | null",
  "address": "string | null",
  "isActive": boolean
}
```

**Used in:**
- ✅ Admin Members Page

---

### Lookup Member (for POS)
```http
GET /api/members/lookup?phone=08xxxxxxxxxx
```

**Response:**
```json
{
  "found": true,
  "member": {
    "id": "string",
    "name": "string",
    "phone": "string",
    "email": "string | null",
    "address": "string | null",
    "points": number
  }
}
```

**Used in:**
- ✅ POS Page - `/pos`

---

### Get Single Member
```http
GET /api/admin/members/{id}?includeHistory=true
```

**Query Parameters:**
- `includeHistory` - Include point history (true/false)

**Used in:**
- ✅ Admin Members Page (View Details)

---

### Update Member
```http
PUT /api/admin/members/{id}
Content-Type: application/json

{
  "name": "string",
  "phone": "string",
  "email": "string | null",
  "address": "string | null",
  "points": number,
  "isActive": boolean
}
```

**Used in:**
- ✅ Admin Members Page (Edit)

---

### Deactivate Member
```http
DELETE /api/admin/members/{id}
```

**Used in:**
- ✅ Admin Members Page (Delete/Deactivate)

---

## ⚙️ Settings API

### Get Settings
```http
GET /api/settings
```

**Response:**
```json
{
  "id": "string",
  "storeName": "string",
  "storeAddress": "string | null",
  "storePhone": "string | null",
  "qrisImage": "string | null",
  "qrisEnabled": boolean
}
```

**Used in:**
- ✅ POS Page - `/pos`
- ✅ User Dashboard - `/`
- ✅ Admin Settings Page - `/admin/settings`

---

### Update Settings
```http
PUT /api/settings
Content-Type: application/json

{
  "storeName": "string",
  "storeAddress": "string | null",
  "storePhone": "string | null",
  "qrisImage": "string | null",
  "qrisEnabled": boolean
}
```

**Used in:**
- ✅ Admin Settings Page
- ✅ Auto-creates settings if not exists

---

## 🛒 Orders API

### Get All Orders
```http
GET /api/orders?status=&paymentStatus=
```

**Query Parameters:**
- `status` - Filter by status (PENDING, PROCESSING, READY, COMPLETED, CANCELLED)
- `paymentStatus` - Filter by payment status (PENDING, PAID, FAILED)

**Response:**
```json
[
  {
    "id": "string",
    "orderNumber": "string",
    "customerName": "string",
    "customerPhone": "string",
    "customerAddress": "string",
    "totalAmount": number,
    "status": "string",
    "paymentMethod": "string",
    "paymentStatus": "string",
    "notes": "string | null",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "items": [...]
  }
]
```

**Used in:**
- ✅ User Dashboard - `/` (Riwayat Pesanan)
- ✅ Admin Orders Page - `/admin/orders`

---

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "string",
  "customerPhone": "string",
  "customerAddress": "string",
  "notes": "string | null",
  "totalAmount": number,
  "paymentMethod": "CASH | QRIS | DEBIT | TRANSFER | E_WALLET",
  "items": [
    {
      "productId": "string",
      "quantity": number,
      "price": number,
      "subtotal": number
    }
  ]
}
```

**Used in:**
- ✅ User Dashboard - `/` (Checkout)
- ✅ Automatically updates product stock
- ✅ Creates stock log entries

---

### Get Single Order
```http
GET /api/admin/orders/{id}
```

**Used in:**
- ✅ Admin Orders Page (View Details)

---

### Update Order Status
```http
PUT /api/admin/orders/{id}
Content-Type: application/json

{
  "status": "PENDING | PROCESSING | READY | COMPLETED | CANCELLED",
  "paymentStatus": "PENDING | PAID | FAILED"
}
```

**Used in:**
- ✅ Admin Orders Page (Update Status)

---

### Cancel Order
```http
DELETE /api/admin/orders/{id}
```

**Used in:**
- ✅ Admin Orders Page (Cancel)
- ⚠️ Only PENDING or PROCESSING orders can be cancelled

---

## 💳 Transactions (POS) API

### Create Transaction
```http
POST /api/transactions
Content-Type: application/json

{
  "transactionNumber": "string",
  "cashierId": "string",
  "shiftId": "string",
  "totalAmount": number,
  "discount": number,
  "finalAmount": number,
  "paymentMethod": "CASH | QRIS | DEBIT | TRANSFER | E_WALLET | SPLIT",
  "paymentStatus": "PAID",
  "status": "COMPLETED",
  "notes": "string | null",
  "items": [
    {
      "productId": "string",
      "quantity": number,
      "price": number,
      "discount": number,
      "subtotal": number
    }
  ],
  "memberId": "string | null",
  "memberPointsEarned": number | null,
  "memberPointsRedeemed": number | null
}
```

**Used in:**
- ✅ POS Page - `/pos`
- ✅ Creates transaction records
- ✅ Updates product stock
- ✅ Creates stock logs
- ✅ Records payments
- ✅ Awards member points

---

## 🔄 Shifts API

### Get All Shifts
```http
GET /api/shifts?cashierId=&isOpen=
```

**Query Parameters:**
- `cashierId` - Filter by cashier ID
- `isOpen` - Filter by open status (true/false)

**Response:**
```json
{
  "success": true,
  "shifts": [
    {
      "id": "string",
      "cashierId": "string",
      "openingBalance": number,
      "closingBalance": number | null,
      "totalSales": number | null,
      "totalCash": number | null,
      "totalNonCash": number | null,
      "systemBalance": number | null,
      "physicalBalance": number | null,
      "difference": number | null,
      "isOpen": boolean,
      "openedAt": "datetime",
      "closedAt": "datetime | null",
      "cashier": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "transactions": [...]
    }
  ]
}
```

**Used in:**
- ✅ POS Page - `/pos`
- ✅ Admin Shift Reports - `/admin/shifts`

---

### Open Shift
```http
POST /api/shifts
Content-Type: application/json

{
  "action": "open",
  "cashierId": "string",
  "openingBalance": number
}
```

**Used in:**
- ✅ POS Page - `/pos`

---

### Close Shift
```http
POST /api/shifts
Content-Type: application/json

{
  "action": "close",
  "shiftId": "string",
  "physicalBalance": number
}
```

**Used in:**
- ✅ POS Page - `/pos`
- ✅ Calculates totals from all transactions
- ✅ Shows total sales, cash, non-cash

---

## 🔐 Authentication API

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "phone": "string | null",
    "role": "string",
    "pin": "string"
  }
}
```

**Used in:**
- ✅ POS Page - `/pos`

---

## 📊 Dashboard API (Admin)

### Get Dashboard Stats
```http
GET /api/admin/dashboard/stats
```

**Used in:**
- ✅ Admin Dashboard - `/admin`

---

### Get Recent Orders
```http
GET /api/admin/dashboard/recent-orders?limit=10
```

**Used in:**
- ✅ Admin Dashboard - `/admin`

---

### Get Sales Chart Data
```http
GET /api/admin/dashboard/sales-chart?period=daily|weekly|monthly
```

**Used in:**
- ✅ Admin Dashboard - `/admin`

---

### Get Top Products
```http
GET /api/admin/dashboard/top-products?limit=10
```

**Used in:**
- ✅ Admin Dashboard - `/admin`

---

## 🎯 Data Synchronization Summary

### Admin Panel → Database
All changes in Admin Panel immediately save to database:
- ✅ Create/Update/Delete Products
- ✅ Create/Update/Delete Categories
- ✅ Create/Update/Delete Members
- ✅ Update Settings
- ✅ Create/Update/Delete Orders
- ✅ Manage Shifts
- ✅ View Transactions

### Database → POS
POS reads real-time data from database:
- ✅ Products and categories
- ✅ Store settings
- ✅ Member lookup
- ✅ Shift management
- ✅ Transaction creation

### Database → User Dashboard
User Dashboard reads real-time data from database:
- ✅ Products and categories
- ✅ Store settings
- ✅ Order history
- ✅ Order creation

### POS → Database
All POS operations save to database:
- ✅ Transactions
- ✅ Shifts (open/close with totals)
- ✅ Stock updates
- ✅ Member points
- ✅ Payments

### User Dashboard → Database
User Dashboard operations save to database:
- ✅ Orders
- ✅ Stock updates (automatic)
- ✅ Stock logs (automatic)

---

## 🔄 Real-time Integration

### Products Flow:
```
Admin Panel → /api/admin/products → Database → /api/products → POS & User Dashboard
```

### Categories Flow:
```
Admin Panel → /api/admin/categories → Database → /api/categories → POS & User Dashboard
```

### Members Flow:
```
Admin Panel → /api/admin/members → Database → /api/members/lookup → POS
```

### Settings Flow:
```
Admin Panel → /api/settings → Database → /api/settings → POS & User Dashboard
```

### Orders Flow:
```
User Dashboard → /api/orders → Database → /api/admin/orders → Admin Panel
```

### Transactions Flow:
```
POS → /api/transactions → Database → /api/admin/transactions → Admin Panel
```

### Shifts Flow:
```
POS → /api/shifts → Database → /api/shifts → Admin Panel (Shift Reports)
```

---

## 📝 Notes

1. **All APIs use Prisma ORM** for database operations
2. **Data is persisted in SQLite database** at `db/custom.db`
3. **No caching middleware** - all data is real-time
4. **Foreign key constraints** ensure data integrity
5. **Stock logs** are automatically created for all stock changes
6. **Date fields** are returned as ISO strings for easy serialization

---

## 🧪 Testing APIs

You can test all APIs using curl or any HTTP client:

```bash
# Get all products
curl http://localhost:3000/api/products

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":10000,"categoryId":"xxx"}'

# Get all categories
curl http://localhost:3000/api/categories

# Get settings
curl http://localhost:3000/api/settings

# Get shifts
curl http://localhost:3000/api/shifts

# Get orders
curl http://localhost:3000/api/orders
```
