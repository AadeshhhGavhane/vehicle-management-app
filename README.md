# Vehicle Management App

A comprehensive fleet management dashboard with real-time telemetry monitoring, vehicle health tracking, AI-powered assistance, and multi-channel notifications.

## Tech Stack
- **Framework**: Next.js 16 (App Router) • TypeScript • TailwindCSS
- **UI Components**: Shadcn UI
- **Database**: Neon/Postgres via `@neondatabase/serverless`
- **Real-time**: Server-Sent Events (SSE)
- **AI**: Groq SDK (Llama 3.3 70B)
- **Notifications**: Resend (Email), Twilio (Phone), WHAPI (WhatsApp)
- **Additional**: React Markdown, Axios

## Features

### Core Features
- **User Authentication**: Sign up, login, and profile management
- **Vehicle Management**: Add, view, and manage vehicles (cars, bikes, scooters)
- **Real-time Telemetry**: Live vehicle health updates via Server-Sent Events
- **Health Monitoring**: Comprehensive vehicle health tracking with condition evaluation
- **Telemetry Logs**: Historical telemetry data with filtering, sorting, and pagination
- **Service Centers**: Find nearby service centers, garages, and fuel stations based on vehicle location
- **AI Chat Assistant**: Context-aware AI assistant for vehicle health and maintenance advice
- **Multi-channel Notifications**: Email, phone calls, and WhatsApp notifications

### Notification Features
- **Email Notifications**: Receive email alerts for all telemetry events
- **Phone Call Alerts**: Automated voice calls for warning and critical vehicle issues
- **WhatsApp Messages**: Instant WhatsApp notifications for all telemetry events
- **User Preferences**: Toggle notifications on/off from profile settings

## Setup

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
# or
bun install
```

### 2. Environment Variables
Create `.env.local` with the following variables:

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB

# AI Chat (Groq)
GROQ_API_KEY=your_groq_api_key

# Email Notifications (Resend)
RESEND_API_KEY=your_resend_api_key

# Phone Notifications (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

# WhatsApp Notifications (WHAPI)
WHAPI_TOKEN=your_whapi_token
```

**Note**: Only `DATABASE_URL` is required for basic functionality. Other API keys are needed for their respective features.

### 3. Database Schema
Run the SQL migration scripts in order:

```bash
# Core tables
scripts/001-create-tables.sql

# Telemetry fields
scripts/002-add-telemetry-fields.sql

# Telemetry logs
scripts/003-create-telemetry-logs.sql

# Email notifications
scripts/004-add-email-notifications.sql

# Phone notifications
scripts/005-add-phone-notifications.sql

# WhatsApp notifications
scripts/006-add-whatsapp-notifications.sql
```

### 4. Start Development Server
```bash
npm run dev
# or
pnpm dev
# or
bun dev
```

## Usage

### Getting Started
1. **Sign Up**: Create an account with email, name, and phone number
2. **Add Vehicles**: Add vehicles with VIN, registration number, and model
3. **Get Vehicle Code**: Copy the unique vehicle code after adding a vehicle
4. **Send Telemetry**: Use the mock vehicle sender at `/mock-vehicle` to send telemetry data
5. **Monitor Dashboard**: View real-time vehicle health updates on the dashboard

### Mock Vehicle Sender
- Navigate to `/mock-vehicle`
- Enter admin credentials (check code for details)
- Enter vehicle code
- Adjust telemetry values using sliders
- Select location and preset (best/average/bad)
- Send telemetry to update vehicle health

### Dashboard Features
- **Real-time Updates**: Vehicle health updates automatically via SSE
- **Vehicle Cards**: Click on any vehicle card to view detailed health information
- **Health Modal**: View overall condition, problematic metrics, and raw telemetry data
- **Service Recommendations**: Get suggestions for nearby service centers based on vehicle issues
- **AI Chat Widget**: Floating chat widget (bottom-right) for vehicle-specific assistance

### Notification Setup
1. Go to Profile page (`/dashboard/profile`)
2. Enable desired notification channels:
   - **Email**: Toggle "Notify via Email" for all telemetry events
   - **Phone Calls**: Toggle "Notify via Phone Call" for warning/critical issues
   - **WhatsApp**: Toggle "Notify via WhatsApp" for all telemetry events

**Note**: Phone and WhatsApp notifications are experimental features working on free tier limits.

## Sample Data

### VINs (passes validation)
- `MA3EYD32S00123456`
- `MALBB51RLDM789012`
- `MAT448154H1234567`

### Registration Numbers (passes validation)
- `MH12AB1234`
- `DL03CD5678`
- `KA05EF9012`
- `TN10GH3456`

## API Endpoints

### Telemetry
- `POST /api/telemetry` - Send telemetry data from mock vehicle
- `GET /api/telemetry?code=VEHICLE_CODE` - Get latest telemetry for a vehicle
- `GET /api/telemetry/stream` - SSE endpoint for real-time updates
- `GET /api/telemetry/logs` - Get telemetry history with filtering and pagination

### AI Chat
- `POST /api/ai-chat` - Stream AI chat responses with vehicle context

## Project Structure

```
app/
  (auth)/          # Authentication pages (login, signup)
  (dashboard)/     # Dashboard pages
    dashboard/     # Main dashboard, logs, services, profile
  api/             # API routes
    telemetry/     # Telemetry endpoints
    ai-chat/       # AI chat endpoint
components/
  dashboard/       # Dashboard-specific components
  ui/              # Shadcn UI components
lib/               # Utilities, types, database functions
scripts/           # SQL migration scripts
```

## Notes

- Mock telemetry payloads must include the vehicle `code` field
- Health condition evaluation is centralized on the backend
- Real-time updates use Server-Sent Events (SSE) for efficient streaming
- AI chat uses vehicle-specific context including health data and nearby services
- Notification features require respective API keys and may have usage limits

## License

Private project
