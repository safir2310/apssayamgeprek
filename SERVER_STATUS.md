# Server Status

## Dev Server
- **Status**: ✅ Running
- **PID**: 22545
- **URL**: http://localhost:3000
- **Network**: http://21.0.19.181:3000

## Logging
- **Log File**: /home/z/my-project/dev.log
- **Status**: ✅ Active
- **Last Activity**: GET requests logged successfully

## Available Pages
- **Home**: http://localhost:3000/
- **Checkout**: http://localhost:3000/checkout
- **API Orders**: http://localhost:3000/api/orders
- **API Products**: http://localhost:3000/api/products
- **API Dev Logs**: http://localhost:3000/api/dev-logs

## Recent Activity
```
GET / 200 - Home page accessed
GET /api/products 200 - Products API called
```

## Checkout Flow
1. User adds products to cart
2. Cart saved to localStorage
3. User goes to checkout page
4. Products fetched and cart reconstructed
5. User fills form and submits order
6. Order created via POST /api/orders
7. Redirect to order history

## Logging Features
- All API calls are logged to dev.log
- Timestamp included for each log entry
- Detailed error logging for debugging
- Custom logger utility for consistent logging format
