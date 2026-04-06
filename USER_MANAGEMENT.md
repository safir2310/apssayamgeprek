# 👥 User Management Guide

## 📋 Login Credentials

### Admin Account
| Field | Value |
|-------|-------|
| Email | `deaflud@admin.com` |
| Password | `admin123` |
| Name | Deaflud Admin |
| Role | Admin |
| Phone | 081234567890 |

### Cashier Accounts

#### Cashier: Deaflud
| Field | Value |
|-------|-------|
| Email | `deaflud@kasir.com` |
| Password | `kasir123` |
| Name | Deaflud Kasir |
| Role | Kasir |
| Phone | 081234567892 |

#### Cashier: Demo (Optional)
| Field | Value |
|-------|-------|
| Email | `kasir@apssayamgeprek.com` |
| Password | `kasir123` |
| Name | Kasir Demo |
| Role | Kasir |
| Phone | 081234567891 |

## 🚀 Creating New Users

### Create Admin User
```bash
bun run create:admin
```

This will create an admin user with the following default credentials:
- Email: `deaflud@admin.com`
- Password: `admin123`
- Name: Deaflud Admin

**Note**: You can modify `scripts/create-admin.js` to create admin users with different credentials.

### Create Cashier User
```bash
bun run create:cashier
```

This will create a cashier user with the following default credentials:
- Email: `kasir@apssayamgeprek.com`
- Password: `kasir123`
- Name: Kasir Demo

### Create Cashier User "Deaflud"
```bash
bun run create:cashier-deaflud
```

This will create a cashier user named "Deaflud" with the following credentials:
- Email: `deaflud@kasir.com`
- Password: `kasir123`
- Name: Deaflud Kasir
- Phone: 081234567892

**Note**: You can modify `scripts/create-cashier-deaflud.js` to create cashier users with different credentials.

## 🔐 User Roles

### Admin
- Full access to all features
- Can manage users
- Can manage products and categories
- Can view all reports
- Can manage settings

### Kasir (Cashier)
- Access to POS system
- Can process transactions
- Can manage shifts
- Can view sales reports

### Owner
- Full access to all features (similar to Admin)
- Can view financial reports
- Can manage business settings

### User
- Limited access (for customer portal)
- Can view order history
- Can manage profile

## 📝 Creating Custom Users

To create users with custom credentials, you can modify the scripts in the `scripts/` directory:

### Example: Create Custom Admin
Edit `scripts/create-admin.ts` and update the parameters:

```typescript
createAdminUser({
  email: 'your-email@example.com',
  password: 'your-password',
  name: 'Your Name',
  phone: '081234567890'
})
```

Then run:
```bash
bun run create:admin
```

### Example: Create Custom Cashier
Edit `scripts/create-cashier.ts` and update the parameters:

```typescript
createCashierUser({
  email: 'cashier-email@example.com',
  password: 'cashier-password',
  name: 'Cashier Name',
  phone: '081234567891'
})
```

Then run:
```bash
bun run create:cashier
```

## ⚠️ Important Security Notes

### Password Storage
**CURRENT SYSTEM LIMITATION**: The current system stores passwords in plain text.

**This is NOT secure for production use!** 

### Recommended Improvements

1. **Install bcrypt**:
```bash
bun add bcrypt
bun add -d @types/bcrypt
```

2. **Update Login API** (`src/app/api/auth/login/route.ts`):
```typescript
import bcrypt from 'bcrypt'

// Replace line 44:
if (user.password !== password) {
  // With:
  if (!await bcrypt.compare(password, user.password)) {
```

3. **Update User Creation Scripts**:
```typescript
import bcrypt from 'bcrypt'

// Hash password before storing:
const hashedPassword = await bcrypt.hash(password, 10)

await prisma.user.create({
  data: {
    email,
    password: hashedPassword, // Store hashed password
    name,
    phone,
    roleId
  }
})
```

4. **Update Registration APIs**:
- Update any user registration endpoints to hash passwords
- Use `bcrypt.hash(password, 10)` for new passwords
- Use `bcrypt.compare(inputPassword, storedHash)` for verification

## 🔧 Database Queries

### View All Users
```sql
SELECT
  u.id,
  u.email,
  u.name,
  u.phone,
  r.name as role,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC;
```

### View Users by Role
```sql
SELECT * FROM users WHERE role_id = (
  SELECT id FROM roles WHERE name = 'Admin'
);
```

### Delete User
```sql
DELETE FROM users WHERE email = 'user@example.com';
```

### Update User Password
```sql
UPDATE users
SET password = 'new-password-here'
WHERE email = 'user@example.com';
```

**Note**: After implementing bcrypt, use hashed passwords instead of plain text.

## 🔄 Reset User Password

### Using SQL (Neon Console)
1. Go to Neon Console
2. Open SQL Editor
3. Run:
```sql
UPDATE users
SET password = 'new-password'
WHERE email = 'deaflud@admin.com';
```

### Using Prisma Studio
```bash
npx prisma studio
```
1. Navigate to User table
2. Find the user
3. Update the password field
4. Save

## 📊 Monitoring Users

### Check User Activity
```sql
SELECT
  u.email,
  u.name,
  COUNT(t.id) as total_transactions,
  SUM(t.final_amount) as total_sales
FROM users u
LEFT JOIN transactions t ON u.id = t.cashier_id
GROUP BY u.id
ORDER BY total_sales DESC;
```

### Check Active Shifts
```sql
SELECT
  u.name as cashier_name,
  cs.id as shift_id,
  cs.opening_balance,
  cs.opened_at
FROM cashier_shifts cs
JOIN users u ON cs.cashier_id = u.id
WHERE cs.is_open = true;
```

## 🛡️ Best Practices

1. **Change Default Passwords**: Always change default passwords after first login
2. **Use Strong Passwords**: Minimum 8 characters with mix of letters, numbers, and symbols
3. **Regular Password Updates**: Require users to change passwords periodically
4. **Implement 2FA**: Add two-factor authentication for admin accounts
5. **Audit Logs**: Track user login and activity
6. **Role-Based Access**: Ensure users only have access to features they need
7. **Regular Security Reviews**: Review user access and permissions regularly

## 📚 Related Documentation

- [Deployment Guide](./DEPLOY_VERCEL.md)
- [Neon Setup Guide](./NEON_VERCEL_SETUP.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)

---

**Note**: This is a basic user management system. For production use, implement proper password hashing, 2FA, and enhanced security measures.
