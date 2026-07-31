# GearUp 🏋️
**"Rent Sports & Outdoor Gear Instantly"**

A backend REST API for a sports and outdoor equipment rental service. Customers can browse gear, place rental orders, and pay online. Providers manage their inventory and fulfill orders. Admins oversee the entire platform.

**Live API:** https://gearup-server-mocha.vercel.app

**API Docs (Postman):** https://github.com/kibriarobin/gearup-server/blob/main/gearup-server.postman_collection.json

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + Express | REST API framework |
| TypeScript | Type safety |
| PostgreSQL + Prisma | Database + ORM |
| JWT (Access + Refresh Token) | Authentication |
| bcrypt | Password hashing |
| SSLCommerz | Payment gateway |
| Vercel | Deployment |

---

## 👥 Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Customer** | Users who rent sports gear | Browse gear, place rental orders, make payments, track order status, leave reviews |
| **Provider** | Gear vendors/rental shops | Manage gear inventory, view incoming orders, update order status |
| **Admin** | Platform moderators | View/manage all users, manage categories, view all gear and rentals |

> Users select `CUSTOMER` or `PROVIDER` during registration — if no role is provided, it defaults to `CUSTOMER`. `ADMIN` accounts cannot be created via public registration (any `ADMIN` value sent is overridden); the admin account is seeded directly into the database.

---

## 🔐 Authentication Flow

1. User registers with `name`, `email`, `password`, and optionally `role` (`CUSTOMER` / `PROVIDER`).
2. Password is hashed with bcrypt before storing.
3. On login, the server verifies credentials and issues:
   - **Access Token** (1 day expiry)
   - **Refresh Token** (7 days expiry)

   Both are set as httpOnly cookies and also returned in the response body.
4. Role-based middleware (`auth(UserRole.ADMIN)`, `auth(UserRole.PROVIDER)`, etc.) protects restricted routes.
5. Suspended users (`status: SUSPENDED`) are blocked from logging in and from accessing any protected route, even with a previously issued valid token.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register as customer or provider |
| POST | `/api/auth/login` | Public | Login, returns access + refresh token |
| GET | `/api/auth/me` | Authenticated | Get current logged-in user's profile |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | Get all gear categories |
| POST | `/api/categories` | Admin | Create a new category |
| PATCH | `/api/categories/:id` | Admin | Update a category |
| DELETE | `/api/categories/:id` | Admin | Delete a category |

### Gear
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/gear` | Public | Get all gear — supports filtering (`category`, `brand`, `minPrice`, `maxPrice`, `searchItem`), sorting (`sortBy`, `sortOrder`) and pagination (`page`, `limit`) |
| GET | `/api/gear/:id` | Public | Get single gear details (includes reviews) |
| POST | `/api/gear` | Provider | Add new gear to inventory |
| PUT | `/api/gear/:id` | Provider (owner only) | Update own gear listing |
| DELETE | `/api/gear/:id` | Provider (owner only) | Remove gear from inventory |

### Rental Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/rentals` | Customer | Create a new rental order for a gear item |
| GET | `/api/rentals` | Customer | Get logged-in customer's own orders |
| GET | `/api/rentals/orders` | Provider | Get incoming orders for the provider's own gear |
| GET | `/api/rentals/:id` | Customer / Provider / Admin | Get single order details (ownership checked) |
| PATCH | `/api/rentals/:id/status` | Customer / Provider | Update order status (see status flow below) |

### Payments (SSLCommerz)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/create` | Customer | Initiate an SSLCommerz payment session for a `CONFIRMED` order |
| POST | `/api/payments/confirm` | SSLCommerz callback | Validates payment with SSLCommerz and marks payment `COMPLETED` + order `PAID` |
| GET | `/api/payments` | Customer | Get logged-in customer's payment history |
| GET | `/api/payments/:id` | Customer (owner only) | Get single payment details |

### Reviews
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reviews` | Customer | Leave a review for gear that has been rented and returned |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/users` | Admin | View all users |
| PATCH | `/api/admin/users/:id` | Admin | Suspend / activate a user |
| GET | `/api/admin/gear` | Admin | View all gear listings (with total count) |
| GET | `/api/admin/rentals` | Admin | View all rental orders (with total count) |

---

## 🗃️ Database Schema (Prisma)

**User** — `id`, `name`, `email`, `password` (hashed), `phone`, `role` (`CUSTOMER` / `PROVIDER` / `ADMIN`), `status` (`ACTIVE` / `SUSPENDED`)

**Profile** — `id`, `bio`, `profilePhoto`, `userId` (1:1 with User)

**Category** — `id`, `name`

**GearItem** — `id`, `name`, `description`, `pricePerDay`, `brand`, `model`, `totalStock`, `availableCount`, `categoryId`, `providerId`

**RentalOrder** — `id`, `customerId`, `gearId`, `startTime`, `endTime`, `quantity`, `totalPrice`, `status` (`PLACED` / `CONFIRMED` / `PAID` / `PICKED_UP` / `RETURNED` / `CANCELLED`)

**Payment** — `id`, `transactionId`, `amount`, `method` (`SSLCOMMERZ`), `status` (`PENDING` / `COMPLETED` / `FAILED`), `paidAt`, `rentalOrderId`

**Review** — `id`, `gearId`, `customerId`, `comment`

---

## 🔄 Rental Order Status Flow

```
                              ┌──────────────┐
                              │    PLACED    │
                              └──────────────┘
                               /            \
                              /              \
                       (provider)       (customer)
                        confirms         cancels
                            /                \
                           ▼                  ▼
                    ┌──────────────┐   ┌──────────────┐
                    │  CONFIRMED   │   │  CANCELLED   │
                    └──────────────┘   └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    PAID      │
                    │ (SSLCommerz) │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PICKED_UP   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  RETURNED    │
                    └──────────────┘
```

- A customer can only pay for an order once it has been `CONFIRMED` by the provider.
- `CANCELLED` is only allowed from `PLACED`, and only by the customer.
- Cancelling or returning an order restores the gear's `availableCount`.
- `PAID` is set automatically by the payment confirmation flow — it cannot be set manually through the order status update endpoint.

---

## ✅ Key Implementation Highlights

- **Server-side price calculation** — `totalPrice` is always calculated on the backend (`pricePerDay × quantity × rental days`), never trusted from client input.
- **Stock management** — `availableCount` is decremented on order creation (using an atomic, race-condition-safe update) and restored on cancellation/return.
- **Ownership-based access control** — endpoints like `GET /api/rentals/:id` and gear update/delete verify the requester is the resource's owner (customer, provider, or admin) before allowing access.
- **Status transition guard** — order status updates follow a strict allowed-transition map, preventing invalid jumps (e.g. `PLACED` → `RETURNED` directly).
- **Consistent error responses** — all errors return `{ success: false, message, errorDetails }` via a centralized error handler, covering Prisma errors and application errors alike.
- **Input validation** — key write endpoints (register, login, category, gear, rental order, payment, review) validate required fields before reaching the database layer.
- **Secure auth** — passwords hashed with bcrypt, JWT access/refresh tokens stored in httpOnly cookies, suspended accounts are blocked at both login and on every subsequent authenticated request.

---

## 🚀 Getting Started

```bash
# install dependencies
npm install

# generate Prisma client
npx prisma generate

# run migrations
npx prisma migrate dev

# start development server
npm run dev
```

### Environment Variables (`.env`)

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

BCRYPT_SALT_ROUNDS=10

SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
```

---

## 🧪 Testing

All endpoints were tested via Postman. The published collection covers:
- **Customer flow** — register → login → browse/filter gear → place order → pay via SSLCommerz → track status → leave a review
- **Provider flow** — register → login → add gear → view incoming orders → confirm/pick-up/return orders
- **Admin flow** — login → view all users → suspend/activate a user → view all gear and rentals

See the API Documentation link above for the full Postman collection.
