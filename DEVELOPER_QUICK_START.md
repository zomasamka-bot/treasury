# Developer Quick Start Guide

**Treasury Action** - treasury.pi

## Overview

This is a Testnet-ready treasury action ticket system with unified build architecture, cross-tab synchronization, and complete state management.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│                 UNIFIED CORE ENGINE                  │
│              /lib/core-engine.ts                     │
│  • createAction()   • processApproval()             │
│  • processCompletion()   • processFailure()         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              STATE MANAGEMENT LAYER                  │
│          /lib/treasury-store.ts (Zustand)           │
│  • Real-time updates   • Persistence                │
│  • Cross-tab sync      • Conflict prevention        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   UI COMPONENTS                      │
│  • CreateActionForm  • TreasuryActionCard           │
│  • ActionDetailDialog  • TreasurySyncListener       │
└─────────────────────────────────────────────────────┘
```

---

## Key Files

### Core Engine
- `/lib/core-engine.ts` - Unified processing logic
- `/lib/treasury-types.ts` - Type definitions & config
- `/lib/treasury-store.ts` - State management

### Components
- `/components/create-action-form.tsx` - Action creation UI
- `/components/treasury-action-card.tsx` - Action display card
- `/components/action-detail-dialog.tsx` - Evidence viewer
- `/components/treasury-sync-listener.tsx` - Cross-tab sync

### Pages
- `/app/page.tsx` - Main application
- `/app/layout.tsx` - Root layout with metadata

---

## State Management

### Store Structure

```typescript
{
  actions: TreasuryAction[],      // All treasury actions
  addAction: (action) => void,
  updateActionStatus: (...) => void,
  addLog: (id, log) => void,
  updateEvidence: (id, evidence) => void,
  getActionById: (id) => TreasuryAction | undefined,
  syncFromStorage: () => void     // Cross-tab sync method
}
```

### Persistence

- **Storage**: localStorage via Zustand persist middleware
- **Key**: `treasury-action-store`
- **Format**: JSON with automatic serialization

### Cross-Tab Synchronization

**How It Works**:
1. State change → Write to localStorage
2. Broadcast sync event (`treasury-sync`)
3. Other tabs listen via `storage` event
4. Auto-rehydrate from localStorage

**Implementation**:
```typescript
// In store
const broadcastSync = () => {
  window.localStorage.setItem('treasury-sync', Date.now().toString());
};

// In TreasurySyncListener component
window.addEventListener('storage', (e) => {
  if (e.key === 'treasury-sync') {
    syncFromStorage();
  }
});
```

---

## Action Flow

### 1. Create Action

```typescript
// User fills form → Click Create button

const newAction = createAction({
  type: selectedType,
  amount: numAmount,
  note: note,
  userId: userData.username
});

addAction(newAction);
```

### 2. Wallet Signature

```typescript
await window.Pi.createPayment({
  amount: 0.01,
  memo: `Treasury Action Signature: ${referenceId} [APPROVAL ONLY]`,
  metadata: { ... }
}, {
  onReadyForServerApproval: (paymentId) => {
    // Immediate state update
    updateActionStatus(id, "Approved", new Date());
    updateEvidence(id, { 
      releaseId: generateReleaseId(),
      walletSignature: paymentId 
    });
  },
  onReadyForServerCompletion: (paymentId, txid) => {
    // Blockchain confirmation
    updateActionStatus(id, "Submitted", new Date());
    updateEvidence(id, { blockchainTxId: txid });
  }
});
```

### 3. Status Updates

All status changes trigger:
1. Internal state update (Zustand)
2. localStorage write (persistence)
3. Broadcast sync event (cross-tab)
4. UI re-render (React)

---

## Data Model

### TreasuryAction Type

```typescript
type TreasuryAction = {
  // Identifiers
  id: string;                      // UUID
  referenceId: string;             // TRX-TREASURY-20260119-XXXX
  
  // Action Details
  type: TreasuryActionType;        // 5 types available
  amount: number;                  // Non-binding operational data
  note: string;
  
  // Status & Timeline
  status: "Created" | "Approved" | "Submitted" | "Failed";
  createdAt: Date;
  approvedAt?: Date;
  submittedAt?: Date;
  failedAt?: Date;
  
  // Evidence Trail
  apiLog: string[];
  runtimeEvidence: {
    freezeId?: string;             // At creation
    releaseId?: string;            // At approval
    walletSignature?: string;      // Pi payment ID
    blockchainTxId?: string;       // Chain TX
  };
  
  // Display-Only Hooks
  manifest: {
    limitCheck: boolean;
    approvalRequired: boolean;
    reportingEnabled: boolean;
  };
};
```

---

## Adding New Action Types

### Step 1: Update Configuration

```typescript
// In /lib/treasury-types.ts

export const ACTION_CONFIGS: ActionConfiguration[] = [
  // ... existing configs
  {
    type: "New Action Type",
    requiresApproval: true,
    description: "Description for new action",
    category: "Category Name"
  }
];
```

### Step 2: Update Type Union

```typescript
export type TreasuryActionType =
  | "Reserve Allocation"
  | "Budget Transfer"
  | "Operational Expense"
  | "Emergency Fund"
  | "Strategic Reserve"
  | "New Action Type";  // Add here
```

**That's it!** The Core Engine handles everything else automatically.

---

## Testing

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Cross-Tab Sync Testing

1. Open app in two browser tabs
2. Create action in Tab 1
3. Verify it appears in Tab 2 automatically
4. Update status in Tab 2
5. Verify Tab 1 reflects the change

### Pi Browser Testing

1. Deploy to Pi Testnet
2. Open in Pi Browser app
3. Test authentication flow
4. Create action → Wallet opens
5. Approve signature
6. Verify status updates
7. Check evidence trail in detail view

---

## Common Tasks

### Add New Log Entry

```typescript
addLog(actionId, "Your log message here");
```

### Update Evidence

```typescript
updateEvidence(actionId, {
  walletSignature: "payment_id_here",
  blockchainTxId: "tx_hash_here"
});
```

### Query Specific Action

```typescript
const action = getActionById(actionId);
if (action) {
  console.log(action.status);
}
```

### Access All Actions

```typescript
const actions = useTreasuryStore((state) => state.actions);
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Verify all environment variables set
- [ ] Test wallet signature flow
- [ ] Confirm cross-tab sync works
- [ ] Check mobile responsiveness
- [ ] Verify error handling
- [ ] Test state persistence

### Post-Deployment
- [ ] Monitor initial user sessions
- [ ] Check error logs
- [ ] Verify blockchain transactions
- [ ] Confirm state sync across users
- [ ] Test peak load scenarios

---

## Troubleshooting

### State Not Syncing Across Tabs

**Check**:
1. localStorage enabled in browser?
2. TreasurySyncListener mounted?
3. Same origin policy not blocking?

**Solution**:
```typescript
// Manually trigger sync
const syncFromStorage = useTreasuryStore(state => state.syncFromStorage);
syncFromStorage();
```

### Wallet Not Opening

**Check**:
1. Pi SDK loaded? (`typeof window.Pi !== 'undefined'`)
2. Testnet mode correct? (`SANDBOX: false`)
3. Authentication completed?

**Solution**:
```typescript
// Re-initialize Pi SDK
await window.Pi.init({ version: "2.0", sandbox: false });
```

### State Lost on Refresh

**Check**:
1. Persist middleware configured?
2. localStorage quota exceeded?
3. Browser in incognito mode?

**Solution**:
Clear old data or increase storage:
```typescript
localStorage.removeItem('treasury-action-store');
```

---

## Performance Tips

1. **Debounce Rapid Updates**
   ```typescript
   // Use debounce for high-frequency logs
   const debouncedLog = debounce(addLog, 300);
   ```

2. **Paginate History**
   ```typescript
   // For 100+ actions, implement pagination
   const recentActions = actions.slice(0, 20);
   ```

3. **Optimize Re-renders**
   ```typescript
   // Select only needed state
   const actionCount = useTreasuryStore(state => state.actions.length);
   ```

---

## Security Considerations

1. **No Private Keys** - Pi SDK handles all wallet operations
2. **No Fund Transfers** - Approval signatures only (0.01 π)
3. **Data Validation** - All inputs validated before processing
4. **Evidence Trail** - Complete audit log for compliance
5. **State Integrity** - Immutable updates prevent corruption

---

## Support & Resources

### Documentation
- `README.md` - Project overview
- `UNIFIED_BUILD_VERIFICATION_REPORT.md` - Compliance verification
- `SELLABLE_RECOMMENDATIONS.md` - Production enhancement roadmap
- `ARCHITECTURE.md` - Detailed architecture diagrams

### External Resources
- Pi SDK Documentation: https://developers.minepi.com
- Zustand Documentation: https://zustand-demo.pmnd.rs
- Next.js Documentation: https://nextjs.org/docs

---

**Domain**: treasury.pi  
**Version**: 1.0.0  
**Status**: Testnet Ready  
**Last Updated**: 2026-01-19
