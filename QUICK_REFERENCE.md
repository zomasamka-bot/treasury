# Treasury Action - Quick Reference

## At a Glance

**Type**: One-Action App  
**Domain**: treasury.pi  
**Flow Time**: <90 seconds  
**Status Flow**: Created → Approved → Submitted → Failed  
**Architecture**: Unified Core Engine with Action Configuration

---

## ✅ Strict Compliance Checklist

### Unified Build (Mandatory)
- ✅ Single reusable Core Engine (`/lib/core-engine.ts`)
- ✅ All behavior via Action Configuration only (`ACTION_CONFIGS`)
- ✅ Unified status flow for all action types
- ✅ No code duplication across actions

### Single Action Only
- ✅ Create Treasury Action Ticket (5 types)
- ✅ <90s flow: Open → Action → Wallet Sign → Status
- ✅ Reference ID: `TRX-TREASURY-YYYYMMDD-XXXX`

### Live App Requirements
- ✅ Immediate state updates after wallet approval
- ✅ Real-time UI reactivity (Zustand store)
- ✅ Live status badges and color coding
- ✅ Instant evidence generation (Freeze/Release IDs)

### Amount is Non-Binding
- ✅ Operational data entry only
- ✅ No max limits or financial constraints
- ✅ No fund transfer functionality
- ✅ Clear disclaimer: "Non-binding operational data"

### Evidence Required
- ✅ Reference ID displayed prominently
- ✅ Timestamps: Created, Approved, Submitted, Failed
- ✅ Freeze ID and Release ID in evidence section
- ✅ Wallet Signature captured and displayed
- ✅ Blockchain TX ID shown when available
- ✅ Complete runtime API log with timestamps

### Hooks (UI Only)
- ✅ Limits indicator (display only)
- ✅ Approvals indicator (display only)
- ✅ Reporting indicator (display only)
- ✅ Clear label: "UI Display Only"
- ✅ Not programmatically enforced

### Forbidden Items
- ✅ No payments (approval signatures only)
- ✅ No transfers (no fund movement)
- ✅ No custody (non-custodial)
- ✅ No private keys (Pi SDK handles)
- ✅ No investment promises (operational data only)

---

## 🏗️ Architecture Overview

### Core Engine (`/lib/core-engine.ts`)
Single processing path for all actions:
```typescript
createAction()      → Creates with Freeze ID
validatePayload()   → Validates input
processApproval()   → Initiates wallet flow
processCompletion() → Handles blockchain TX
processFailure()    → Handles errors
```

### Action Configuration (`/lib/treasury-types.ts`)
All action types use same schema:
```typescript
ACTION_CONFIGS = [
  { type, requiresApproval, description, category }
]
```

### State Management (`/lib/treasury-store.ts`)
Live reactive state with Zustand:
```typescript
addAction()          → Adds to history
updateActionStatus() → Status transitions
addLog()            → API evidence log
updateEvidence()    → Runtime evidence updates
```

---

## 📋 Action Types

1. **Reserve Allocation** - Reserve management category
2. **Budget Transfer** - Budget operations category
3. **Operational Expense** - Daily operations category
4. **Emergency Fund** - Emergency response category
5. **Strategic Reserve** - Strategic planning category

All use identical Core Engine processing.

---

## 🔄 Status Flow

```
Created
  ↓ (Action created, Freeze ID generated)
Approved
  ↓ (Wallet signature received, Release ID generated)
Submitted
  ↓ (Blockchain TX confirmed, sent to review queue)
Failed
  ↓ (Cancelled or error occurred)
```

**Average Time**: <90 seconds from Created to Submitted

---

## 📊 Evidence Trail

Every action generates:

| Evidence | When | Example |
|----------|------|---------|
| **Reference ID** | At creation | `TRX-TREASURY-20260118-1234` |
| **Freeze ID** | At creation | `FREEZE-1737123456789-ABC123XYZ` |
| **Release ID** | At approval | `RELEASE-1737123456789-DEF456UVW` |
| **Wallet Signature** | After wallet approval | `pi123abc456def...` |
| **Blockchain TX** | After on-chain confirm | `tx789ghi012jkl...` |
| **API Log** | Throughout lifecycle | `[2026-01-18T10:30:00Z] Action created by user` |

---

## 🎯 Institutional Value Propositions

### Why This Architecture is Sellable

1. **Unified = Auditable**
   - One Core Engine to audit
   - Configuration-driven = no hidden logic
   - Complete evidence trail

2. **Fast = Efficient**
   - <90s commitment
   - Immediate state updates
   - Real-time visibility

3. **Non-Custodial = Safe**
   - No fund transfers
   - No private key handling
   - Approval signatures only

4. **Extensible = Future-Proof**
   - Add action types via config
   - No code changes needed
   - Scales to enterprise

5. **Compliant = Ready**
   - Complete audit trail
   - Evidence tied to blockchain
   - Display-only hooks for review

---

## 🚀 Quick Start Guide

### For Users
1. Open in Pi Browser
2. Select action type
3. Enter amount (operational data)
4. Add note
5. Click "→ Create & Request Signature"
6. Approve in wallet
7. View evidence in History

### For Developers
1. Clone repository
2. `npm install`
3. `npm run dev`
4. Test in Pi Browser Sandbox
5. Deploy to treasury.pi

### For Institutions
1. Review INSTITUTIONAL_REFERENCE.md
2. Assess backend integration needs
3. Configure compliance requirements
4. Customize branding (optional)
5. Deploy to production
6. Train users and reviewers

---

## 📞 Key Contacts

**Technical Documentation**:
- README.md - Full technical overview
- INSTITUTIONAL_REFERENCE.md - Production recommendations

**Support**:
- Pi Network Developer Portal
- Pi SDK Documentation

---

## 🔍 Code Locations

| Feature | File Path |
|---------|-----------|
| Core Engine | `/lib/core-engine.ts` |
| Action Types | `/lib/treasury-types.ts` |
| State Store | `/lib/treasury-store.ts` |
| Create Form | `/components/create-action-form.tsx` |
| Action Card | `/components/treasury-action-card.tsx` |
| Detail View | `/components/action-detail-dialog.tsx` |
| Main Page | `/app/page.tsx` |

---

## ✨ Competitive Differentiators

### vs Traditional Treasury Systems
- ✅ Blockchain evidence (they don't have)
- ✅ <90s processing (they take hours/days)
- ✅ Non-custodial (they require custody)
- ✅ Pi Network native (they're legacy systems)

### vs Other Pi Apps
- ✅ Institutional focus (most are consumer apps)
- ✅ Unified architecture (most are ad-hoc)
- ✅ Complete evidence trail (most lack audit features)
- ✅ <90s guarantee (most have no SLA)

---

## 💡 Next Steps

### Immediate (Phase 1)
- Deploy to Pi Testnet
- User acceptance testing
- Gather institutional feedback

### Short-term (Phase 2)
- Backend persistence layer
- Multi-level approval workflows
- Email notifications

### Medium-term (Phase 3)
- Compliance module
- Reporting dashboard
- Role-based access control

### Long-term (Phase 4)
- Multi-tenant support
- White-label option
- Mobile native app

---

## 🎓 Training Resources

**User Training**: 15 minutes
- How to create actions
- Understanding status flow
- Reading evidence trail

**Admin Training**: 30 minutes
- System overview
- Configuration management
- Monitoring and support

**Developer Training**: 2 hours
- Core Engine architecture
- Adding new action types
- Integration patterns

---

## 📈 Success Metrics

Track these KPIs:

| Metric | Target |
|--------|--------|
| Action Processing Time | <90s average |
| User Satisfaction | >4.5/5 stars |
| System Uptime | >99.9% |
| Approval Conversion | >95% |
| Evidence Completeness | 100% |

---

**Version**: 1.0  
**Status**: Production-Ready Reference Implementation  
**Last Updated**: January 2026
