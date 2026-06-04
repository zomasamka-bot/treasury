# Release Policy Structure - Phase 1 Preparation

## Overview
This document describes the **Release Policy Structure** prepared for Phase 2 implementation of beneficiary release functionality. **NO RELEASE LOGIC IS ACTIVE YET** - this is structure-only preparation.

## Reserve Types & Release Policies

Each reserve type (Treasury Action type) has a corresponding release policy template prepared for future implementation:

### 1. Reserve Allocation → **Standard Flow**
- **Release Mode:** Standard
- **Description:** Standard release policy structure - ready for Phase 2 implementation
- **Future Behavior (Phase 2):** Normal approval and release process

### 2. Budget Transfer → **Review-Oriented Flow**
- **Release Mode:** Review-oriented
- **Description:** Review-oriented release policy structure - ready for Phase 2 implementation
- **Future Behavior (Phase 2):** Requires additional institutional review before release

### 3. Operational Expense → **Faster Flow**
- **Release Mode:** Faster
- **Description:** Faster release policy structure - ready for Phase 2 implementation
- **Future Behavior (Phase 2):** Expedited release process with minimal overhead

### 4. Emergency Fund → **Extra Confirmation**
- **Release Mode:** Extra-confirmation
- **Description:** Extra confirmation release policy structure - ready for Phase 2 implementation
- **Future Behavior (Phase 2):** Requires additional confirmations due to emergency nature

### 5. Strategic Reserve → **Controlled Flow**
- **Release Mode:** Controlled
- **Description:** More controlled release policy structure - ready for Phase 2 implementation
- **Future Behavior (Phase 2):** More restrictive with enhanced controls and governance

## Architecture

### Current Implementation (Phase 1)

**No changes to existing flow:**
- Payment system: ✓ Unchanged
- Payment flow: ✓ Unchanged
- Treasury logic: ✓ Unchanged
- Records: ✓ Unchanged
- History: ✓ Unchanged
- Wallet behavior: ✓ Unchanged
- Overall app behavior: ✓ Unchanged

### New Structure (Phase 1 Only)

```typescript
// Type definition in treasury-types.ts
export type ReleasePolicyTemplate = {
  type: TreasuryActionType;
  releaseMode: "standard" | "review-oriented" | "faster" | "extra-confirmation" | "controlled";
  description: string;
};

export const RELEASE_POLICY_TEMPLATES: ReleasePolicyTemplate[] = [
  // 5 reserve types with corresponding policies
];
```

### Access Function

```typescript
// In core-engine.ts
export function getReleasePolicy(type: TreasuryActionType): ReleasePolicyTemplate | undefined {
  return RELEASE_POLICY_TEMPLATES.find(policy => policy.type === type);
}
```

This function retrieves the release policy template for a given reserve type but does NOT activate any release logic.

## UI Display

The Action Detail Dialog now displays the Future Release Policy for each action:
- Shows the reserve type's release mode
- Displays the policy description
- Purely informational - no functionality yet

## Phase 2 Implementation Notes

When implementing Phase 2 (Beneficiary Release):
1. Use `getReleasePolicy()` to fetch the policy for an action
2. Implement release-mode-specific workflows based on the policy
3. Add no timers, no multi-approval logic
4. Keep all current flows intact
5. Create new release-only functions (do not modify existing creation/approval logic)

## Important Constraints

✓ No timers
✓ No multi-approval logic
✓ No active release behavior yet
✓ Existing unified payment system untouched
✓ Current payment flow untouched
✓ Treasury logic untouched
✓ Records untouched
✓ History untouched
✓ Wallet behavior untouched
✓ Overall app behavior untouched

## Files Modified

- `/lib/treasury-types.ts` - Added `ReleasePolicyTemplate` type and `RELEASE_POLICY_TEMPLATES` constant
- `/lib/core-engine.ts` - Added `getReleasePolicy()` function
- `/components/action-detail-dialog.tsx` - Added Future Release Policy display card

## Testing

The app maintains all existing functionality:
- Create treasury actions (all 5 types)
- Approve and sign with Pi Wallet
- View action history
- Check manifests and evidence
- No new user-facing features until Phase 2

## Next Steps for Phase 2

When you're ready to implement beneficiary release:
1. Create new `release-engine.ts` with release-specific functions
2. Add `ReleaseTo Beneficiary` tab/section in main page
3. Implement release workflows for each policy mode
4. Add release status tracking (separate from creation status)
5. Test with each reserve type's specific flow
