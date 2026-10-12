# Digital Vending Machine for Sanitary Napkins - Setup & Deployment Guide

This project is a complete, production-ready **Digital Vending Machine Platform** built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS**, designed for physical kiosks and web deployment on **Vercel**.

---

## 🌟 Key Features

1. **Annual Hygiene Subscription & Personal Member QR Pass**
   - Each registered member / student / employee receives a unique **Personal QR Code card** (accessible at `/subscription`).
   - At the vending machine or kiosk (`/kiosk`), members scan their Personal QR code.
   - The machine verifies their 1-Year pass validity and remaining quota, dispensing the sanitary napkin immediately **without requiring cash or card payment**.

2. **Electronic & Simulated Coin Acceptor System**
   - Accepts Indian Rupee coins: **₹1, ₹2, ₹5, ₹10**.
   - Features real-time coin insertion progress, balance calculator, and automatic change return dispenser.
   - Ready for hardware integration via Web Serial API or HTTP pulse webhook `/api/payment/coin` for physical multi-coin acceptors (e.g. CH-926 / DG600F).

3. **Google Pay & Razorpay Online Payments**
   - **Google Pay**: Generates dynamic UPI QR codes encoded with exact transaction amounts (`upi://pay`), compatible with Google Pay, PhonePe, and Paytm.
   - **Razorpay**: Full server-side order generation and signature verification with instant sandbox simulation fallback when live credentials are not yet entered.
   - Existing methods preserved: Standard Kiosk QR, Debit Card reader, and Cash Note reader.

4. **Motorized Product Dispenser Simulation**
   - Visual and audio feedback of motor coil rotation (Slots A1, A2, etc.), IR drop sensor verification, and collection tray unlocking.

5. **Administrative Management Panel** (`/admin`)
   - Dashboard stats: Total paid users, 1-Year Pass subscribers, products sold, revenue, visitor counter, and motor dispense logs.
   - Product inventory CRUD management with active stock controls (`/admin/products`).
   - 1-Year Member Subscription management (`/admin/subscriptions`): Issue passes, lookup member QR codes, and monitor quota.

---

## 🚀 One-Click Deployment to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your repository and configure the environment variables:

| Environment Variable | Description | Example Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGci...` |
| `ADMIN_JWT_SECRET` | 32+ character random secret string | `29f263d37386d09eee5e4c13e2ce31fe` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (optional for test mode) | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_secret_key` |
| `VENDING_UPI_ID` | Vending machine UPI ID for Google Pay | `santra.vending@upi` |
| `VENDING_PAYEE_NAME` | Payee display name | `Digital Sanitary Napkin Vending` |

4. Click **Deploy**. Vercel will build and launch your application globally!

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Create a free project on [Supabase](https://supabase.com).
2. Open your Supabase Dashboard and navigate to the **SQL Editor**.
3. Open the file [`supabase_schema.sql`](file:///c:/Users/santh/Downloads/santra/santra/supabase_schema.sql) in this repository.
4. Copy its contents, paste into the Supabase SQL Editor, and click **Run**.
5. All required tables (`products`, `orders`, `subscriptions`, `dispense_logs`, `coin_transactions`, `admins`, `visits`), default sanitary napkin inventory, and demo member passes will be created automatically.

*Note: The application includes a resilient built-in fallback data service. Even if Supabase is temporarily unreachable or undergoing maintenance, all product browsing, orders, personal QR passes, and coin acceptance will remain fully functional.*

---

## 🏧 Running in Physical Vending Kiosk Mode

- Visit `/kiosk` in your browser on the vending machine's touch display.
- Press `F11` to enter full-screen kiosk mode.
- Users can choose products, insert coins, or hold their printed/mobile Personal Member QR in front of the kiosk optical scanner to dispense their free quota pad.

### Hardware Connection (Physical Machine):
- **Coin Acceptor**: Connect the pulse output pin to an Arduino/ESP32 digital pin. Send an HTTP POST to `/api/payment/coin` with `{ orderId, coin: 5 }` upon receiving coin pulses.
- **Dispenser Motor**: Connect the relay board to GPIO pin 12. Listen to `/api/hardware/dispense` to trigger motor rotation for Slot A1.
- **IR Drop Sensor**: Optical beam sensor mounted in the drop chute confirms pad delivery.

---

## 🔑 Default Admin Credentials
- **Email:** `admin@local.test`
- **Password:** `admin123`
- Direct access: `/admin/login`
