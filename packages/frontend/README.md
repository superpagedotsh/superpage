# x402 Frontend - Shopify Agent Store Management

A modern web application for Shopify store owners to easily integrate their stores with AI agents and manage cryptocurrency-based payments using the HTTP 402 Payment Required protocol.

## Overview

The frontend provides a user-friendly interface for:
- Connecting Shopify stores to the x402 agent commerce platform
- Selecting which products to make available to AI agents
- Viewing and managing orders placed by AI agents
- Monitoring payment intents and cryptocurrency transactions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components (Card, Button, Input, etc.)
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: Browser localStorage

## Pages & Routes

### 1. Home Page (`/`)

**File**: `app/page.tsx`

**Purpose**: Landing page that introduces the x402 platform to potential store owners.

**Features**:
- Hero section with value proposition
- Feature highlights (AI discoverability, real-time processing, future-ready)
- Benefits section explaining why store owners should use x402
- Call-to-action buttons for getting started

**Key Sections**:
- **Headline**: "Make Your Shopify Store Agent Ready"
- **Tagline**: Empower AI agents to discover and place orders
- **Benefits**:
  - Discoverable by AI Agents
  - Seamless Order Integration
  - 2-Minute Setup
- **Feature Grid**:
  - Expand Revenue Streams
  - Zero Integration Hassle
  - Same Shopify Experience

**User Flow**: Users arrive here, learn about the platform, and click "Get Started" to begin registration.

---

### 2. Registration Page (`/register`)

**File**: `app/register/page.tsx`

**Purpose**: First step of onboarding - connect Shopify store to x402 platform.

**Features**:
- Form to collect store credentials
- Store information (name, URL, description, admin token)
- Validation and error handling
- Navigation back to home page

**Form Fields**:
1. **Store Name** (optional)
   - Auto-derived from URL if not provided
   - Example: "My Awesome Store"

2. **Store URL** (required)
   - Must be a valid Shopify store URL
   - Example: "https://mystore.myshopify.com"

3. **Store Description** (optional)
   - Used to describe store to AI agents
   - Example: "Premium handmade furniture"

4. **Admin Access Token** (required)
   - Shopify API token for product sync
   - Generated in Shopify admin panel

**Data Flow**:
1. User enters Shopify credentials
2. Frontend validates input
3. Frontend sends POST request to backend (`/api/stores`)
4. Backend creates store in database
5. Frontend stores credentials in localStorage
6. User is redirected to `/products` page

**Local Storage Keys**:
- `shop_domain`: Store URL
- `access_token`: Shopify admin token
- `store_id`: Generated store ID

**Design**:
- Centered card layout with emerald/green color scheme
- Back button for navigation
- Loading state during submission

---

### 3. Products Selection Page (`/products`)

**File**: `app/products/page.tsx`

**Purpose**: Second step of onboarding - select which products to make available to AI agents.

**Features**:
- Fetch all products from Shopify store
- Display products as searchable grid
- Multi-select functionality for products
- Preview of selected count
- Bulk product sync to backend

**Product Display**:
Each product card shows:
- Product image (thumbnail)
- Product name
- Number of variants
- Price range (minimum price from variants)
- Currency indicator
- Selection checkbox and checkmark

**Selection Workflow**:
1. User can click product card to toggle selection
2. Or use checkbox in top-left corner
3. Selected products show green checkmark in top-right
4. Sticky bottom bar shows count of selected items

**Search Feature**:
- Real-time filtering as user types
- Case-insensitive search
- Searches product names only

**Data Processing**:
1. Flattens product variants into individual items
2. Each variant gets:
   - Unique ID from Shopify
   - Combined name (Product + Variant)
   - Image URL
   - Price
   - Description
   - Currency
   - Inventory count
   - Metadata (SKU, product ID)

3. Syncs to backend when user clicks "Continue"

**Sticky Footer**:
- Shows "X selected" count
- "Continue" button (disabled if no products selected)
- Shows loading state during save

**Error Handling**:
- Missing Shopify credentials → redirect to register
- Product fetch failures → shows error message
- Product sync failures → user-friendly alert with retry option

**Local State**:
- `storeUrl`: Shopify domain
- `products`: Array of all products
- `selected`: Set of selected product IDs
- `query`: Search filter text
- `loading`: Loading state
- `saving`: Saving state
- `error`: Error messages

---

### 4. Dashboard Page (`/dashboard`)

**File**: `app/dashboard/page.tsx`

**Purpose**: Final step and main management interface - view orders and monitor payment intents.

**Features**:
- Display all confirmed orders from AI agents
- Display pending payment intents
- Real-time status tracking
- Links to Shopify admin orders
- Formatting and color-coded statuses

**Header Section**:
- "Store Dashboard" title with subtitle
- Display Store ID for reference
- Back button to previous page
- Button to view orders on Shopify admin

#### **Orders Section**

Table with columns:
- **Order ID**: Short ID (truncated with "...")
- **Email**: Customer email address
- **Amount**: Total amount with currency (e.g., "USD $199.98")
- **Status**: Color-coded badge
  - `confirmed`: Green ✓
  - `fulfilled`: Blue ✓
  - `cancelled`: Gray ✗
- **Shopify**: Link to Shopify order (if synced)
- **Date**: Creation date formatted as "MMM D, YYYY HH:MM"

**Empty State**:
- Icon placeholder
- "No orders yet" message
- "Orders from AI agents will appear here"

#### **Payment Intents Section**

Table with columns:
- **Intent ID**: Short ID (truncated with "...")
- **Email**: Customer email
- **Amount**: Total amount with currency
- **Status**: Color-coded badge
  - `pending`: Yellow ⏳
  - `paid`: Green ✓
  - `expired`: Red ✗
- **Verification**: Payment verification status (e.g., "verified")
- **Expires**: Expiration time formatted

**Empty State**:
- Clock icon placeholder
- "No payment intents" message
- "Pending payment intents will appear here"

**Status Color System**:
```
confirmed/paid   → Green (bg-emerald-100, text-emerald-800)
fulfilled        → Blue (bg-blue-100, text-blue-800)
pending          → Yellow (bg-yellow-100, text-yellow-800)
expired/cancelled→ Red/Gray (bg-red-100, text-red-800)
```

**Data Loading**:
- Checks localStorage for store info on mount
- Fetches orders and intents in parallel
- Shows loading spinner with message
- Error state with alert box

**Navigation**:
- Back button: Returns to previous page
- "View on Shopify": Opens Shopify admin in new tab
- Order Shopify links: Opens specific order in Shopify

**Local State**:
- `storeId`: Store identifier
- `shopUrl`: Store domain
- `orders`: Array of orders
- `orderIntents`: Array of payment intents
- `loading`: Loading state
- `error`: Error message

**Utilities**:
- `formatDate()`: Converts ISO timestamps to readable format
- `getStatusColor()`: Returns Tailwind classes for status badges

---

## User Onboarding Flow

```
Home Page (/)
    ↓ "Get Started" button
Register Page (/register)
    - Enter Shopify credentials
    - Backend creates store
    ↓ "Continue" button
Products Page (/products)
    - Select products to list
    - Backend syncs products
    ↓ "Continue" button
Dashboard (/dashboard)
    - View orders & payment intents
    - Links to Shopify admin
```

---

## Data Flow & API Integration

### API Endpoints Called:

1. **Store Creation** - `POST /api/stores`
   - Called from: Register page
   - Creates new store in database
   - Returns: Store ID and configuration

2. **Product Fetch** - `POST /api/shopify/products`
   - Called from: Products page (on load)
   - Fetches all products from Shopify
   - Returns: Array of products with variants

3. **Product Sync** - `POST /api/stores/{storeId}/products`
   - Called from: Products page (on continue)
   - Syncs selected product variants
   - Returns: Count of synced products

4. **Orders Fetch** - `GET /x402/stores/{storeId}/orders`
   - Called from: Dashboard page (on load)
   - Gets all confirmed orders
   - Returns: Array of orders

5. **Order Intents Fetch** - `GET /x402/stores/{storeId}/order-intents`
   - Called from: Dashboard page (on load)
   - Gets all pending payment intents
   - Returns: Array of order intents

---

## Local Storage Schema

The frontend uses browser localStorage to persist user session data:

```javascript
{
  "shop_domain": "https://mystore.myshopify.com",      // Shopify URL
  "access_token": "shppa_...",                           // Shopify API token
  "store_id": "store_xxx",                               // x402 store ID
  "selected_product_ids": "[\"prod_123\", \"prod_456\"]" // Selected products
}
```

**Lifetime**: Persists until user clears browser data

---

## UI Components & Styling

### Components Used:
- **Card**: Form and data containers with header/content/footer
- **Button**: Actions with variants (primary, outline, ghost)
- **Input**: Text fields for forms
- **Textarea**: Multi-line text for descriptions
- **Label**: Form field labels
- **Checkbox**: Product selection toggles
- **Icons**: Lucide React icons for visual indicators

### Color Palette:
- **Primary**: Emerald/Green (`emerald-600`)
- **Success**: Green (`emerald-100`, `emerald-600`)
- **Error**: Red (`red-100`, `red-800`)
- **Warning**: Yellow (`yellow-100`, `yellow-800`)
- **Info**: Blue (`blue-100`, `blue-800`)
- **Neutral**: Slate (`slate-600`, `slate-900`)

### Dark Mode:
- Full dark mode support with `dark:` prefixes
- Automatic light/dark switching based on OS preferences

---

## Running the Frontend

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

3. Build for production:
```bash
npm run build
npm start
```

### Environment Variables

```bash
# Backend API URL (used in API calls)
# Default: http://localhost:3001
```

---

## Key Features

### 🔐 Security
- No sensitive data stored except user tokens (needed for API calls)
- CORS-enabled API requests
- Form validation before submission
- Error boundary handling

### 🎨 User Experience
- Clean, modern interface with emerald green theme
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Real-time search filtering
- Visual feedback for selections and actions
- Loading states and spinners
- User-friendly error messages

### 📊 Data Display
- Formatted dates and times
- Currency formatting with proper symbols
- Status color coding for quick scanning
- Pagination-ready table structures
- Truncated IDs with copy-on-hover capability

### 🔄 Integration
- Seamless backend API integration
- Real-time data fetching
- Direct links to Shopify admin
- One-click store viewing

---

## File Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Home page (/)
│   ├── layout.tsx                  # Root layout
│   ├── register/
│   │   └── page.tsx                # Register page (/register)
│   ├── products/
│   │   └── page.tsx                # Products selection (/products)
│   └── dashboard/
│       └── page.tsx                # Dashboard (/dashboard)
├── components/
│   └── ui/                         # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── textarea.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       └── ...
├── lib/
│   └── utils.ts                    # Utility functions (cn, etc.)
├── public/                         # Static assets
├── tailwind.config.ts              # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
├── next.config.ts                  # Next.js config
└── README.md                       # This file
```

---

## Troubleshooting

### Frontend won't load
- Check if development server is running (`npm run dev`)
- Ensure backend is running on port 3001
- Clear browser cache and localStorage

### Store registration fails
- Verify Shopify URL format (should be `https://xxxx.myshopify.com`)
- Confirm admin access token is valid
- Check network tab for specific error messages

### Products not loading
- Ensure store was created successfully
- Check if products exist in Shopify store
- Verify Shopify API permissions

### Dashboard shows no orders
- Confirm orders were actually created via API
- Check backend logs for errors
- Try refreshing the page or clearing cache

---

## Next Steps

1. Review the [Backend README](../backend/README.md) for API documentation
2. Check `/dashboard` page to view orders and payment intents
3. Visit the Shopify admin to see orders synced directly to your store
4. Explore the payment flow to understand how AI agents make purchases

---

## Support

For issues or questions:
1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify database connectivity
4. Ensure all environment variables are set correctly
