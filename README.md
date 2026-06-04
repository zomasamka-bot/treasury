# Treasury Action

A mobile-first treasury action ticket system for institutional review, tracking, and approvals on the Pi Network.

## Overview

**Treasury Action** is a **non-custodial operational interface** on the Pi Testnet that enables users to create and manage treasury action tickets. The app provides a structured workflow for institutional review with wallet signature approvals.

### Unified Core Engine Architecture

This application is built on a **single, reusable Core Engine** (`/lib/core-engine.ts`) that processes all treasury actions through unified configuration:

- **Configuration-Driven**: All behavior defined via Action Configuration only
- **Single Processing Path**: One engine handles all action types identically
- **Unified Status Flow**: Created → Approved → Submitted → Failed (all actions)
- **Live State Updates**: Real-time reactivity with immediate UI feedback
- **Complete Evidence Trail**: Freeze ID, Release ID, Wallet Signature, Blockchain TX tracking

## Key Features

### One-Action App (<90 Second Flow)
- **Single Primary Action**: Create Treasury Action Ticket
- **Flow**: Open → Action → Wallet Approve/Sign → Status
- **Action Types**: Reserve Allocation, Budget Transfer, Operational Expense, Emergency Fund, Strategic Reserve
- **Reference ID Format**: TRX-TREASURY-YYYYMMDD-XXXX (auto-generated)
- **Processing Time**: <90 seconds from creation to submitted status

### Status Flow
Actions progress through a unified status system:
1. **Created** - Initial ticket creation
2. **Approved** - Wallet signature received
3. **Submitted** - On-chain confirmation and institutional review
4. **Failed** - Cancellation or error state

### Core Engine Features (Unified Architecture)
- **Single Processing Engine**: One reusable engine for all action types
- **Configuration-Only Behavior**: No hard-coded business logic
- **Unified Schema**: All actions follow identical data structure
- **Live State Management**: Real-time updates with Zustand store
- **Auto Evidence**: Freeze ID, Release ID, Wallet Signature, Blockchain TX ID
- **Runtime Logging**: Complete API log trail with timestamps
- **Operational Amounts**: Non-binding data entries (no financial constraints)

### Manifest Hooks (UI Display Only)
Three display-only indicators for institutional reference (not programmatically enforced):
1. **Limits** - UI indicator for limit awareness
2. **Approvals** - UI indicator for approval requirements
3. **Reporting** - UI indicator for reporting enablement

### Wallet Integration
- **Flow**: Open → Create Action → Wallet Approve/Sign → Status Update
- **Non-Custodial**: Approval signatures only, no fund transfers
- **Pi SDK Integration**: Full Pi Network authentication and payment API support

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand (live reactive state)
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist Sans + Geist Mono
- **Pi Network**: Pi SDK v2.0
- **Core Engine**: `/lib/core-engine.ts` (unified processing)
- **Type Safety**: TypeScript with strict mode

## Architecture

### File Structure
```
/lib/
  ├── core-engine.ts          # Unified Core Engine (single processing path)
  ├── treasury-types.ts       # Action types and configuration
  ├── treasury-store.ts       # Live state management (Zustand)
  └── ...

/components/
  ├── create-action-form.tsx  # Action creation UI (uses Core Engine)
  ├── treasury-action-card.tsx
  ├── action-detail-dialog.tsx
  └── ...

/app/
  └── page.tsx                # Main app with tabbed interface
```

### Core Engine Pattern
All actions are processed through the unified Core Engine:
1. **createAction()** - Creates action with auto-generated IDs
2. **validatePayload()** - Validates input data
3. **processApproval()** - Handles wallet signature approval
4. **processCompletion()** - Handles on-chain confirmation
5. **processFailure()** - Handles errors and cancellations

### Processing Context
The Core Engine uses a context pattern for side effects:
```typescript
const context = {
  onLog: (message: string) => void,
  onStatusChange: (status, timestamp) => void,
  onEvidenceUpdate: (evidence) => void
}
```

## Design System

### Color Palette
- **Primary**: Purple-blue accent (institutional trust)
- **Secondary**: Teal green (approval/success)
- **Accent**: Green (completed actions)
- **Neutrals**: Clean grays, whites for professional appearance

### Typography
- **Headings**: Geist Sans (modern, professional)
- **Body**: Geist Sans (optimal readability)
- **Code/IDs**: Geist Mono (reference IDs and logs)

### Layout
- **Mobile-First**: Optimized for Pi Browser on mobile devices
- **Responsive**: Adapts to tablet and desktop viewports
- **Sticky Header**: Always-visible navigation and user info
- **Tab Navigation**: Clean separation of Create and History views

## Security & Compliance

### Non-Custodial Design (Mandatory)
- ✅ No private key storage or management
- ✅ No custody of user funds
- ✅ No investment promises or financial advice
- ✅ No payment processing or fund transfers
- ✅ Approval signatures only (no monetary transactions)

### Operational Data Only (Non-Binding)
- **Amount Field**: Non-binding operational data entry (no financial implications)
- **No Max Limits**: No enforcement of maximum amounts (tracking purposes only)
- **No Transfer Functionality**: Wallet approval for signature authorization only, not payment
- **Display-Only Hooks**: Limits/Approvals/Reporting shown in UI for reference only, not enforced

### Complete Evidence Trail
- **Reference ID**: TRX-TREASURY-YYYYMMDD-XXXX (unique per action)
- **Freeze ID**: Generated at creation (runtime evidence)
- **Release ID**: Generated at approval (runtime evidence)
- **Wallet Signature**: Captured from Pi SDK payment approval
- **Blockchain TX**: On-chain transaction ID for signature
- **API Logs**: Complete timestamped event trail
- **Manifest Hooks**: 3 display-only indicators (Limits/Approvals/Reporting)

## Development

### Prerequisites
- Node.js 18+
- Pi Network Developer Account
- Pi Browser for testing

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Environment Variables
Configure in your Pi Network dashboard:
- Pi SDK automatically configured
- No additional environment variables required

## Usage

### Creating an Action (<90s Flow)
1. Open the app in Pi Browser
2. Select action type from dropdown (5 types available)
3. Enter operational amount (non-binding data entry)
4. Add optional note for context
5. Click "→ Create & Request Signature"
6. Approve wallet signature (approval only, no transfer)
7. **Immediate state update** - action moves to Approved status
8. View complete evidence trail in History tab

### Viewing Action History
1. Navigate to History tab
2. View all created actions with status badges
3. Click any action card to view details
4. See complete timeline, manifest, and API logs

## Institutional Recommendations

For detailed recommendations on making this app production-ready and sellable as an institutional reference, see:

**[INSTITUTIONAL_REFERENCE.md](./INSTITUTIONAL_REFERENCE.md)**

This comprehensive guide covers:
- Backend integration (persistence, multi-level approval)
- Authentication & authorization (role-based access)
- Compliance module integration
- Reporting dashboard implementation
- Email notification system
- Security hardening (rate limiting, encryption, audit logs)
- Scaling strategies (database, caching, queues)
- Multi-tenant support for enterprise deployment
- Testing strategy (unit, integration, load, security)
- Metrics & monitoring setup
- Deployment checklist
- Competitive advantages for institutional sales

## License

This project is built with App Studio on Pi Network.

---

**Status**: Ready for institutional pilot programs. Built on unified core engine architecture with complete evidence trail and <90 second processing guarantee.
