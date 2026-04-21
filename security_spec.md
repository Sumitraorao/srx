# Firestore Security Specification

## Data Invariants
1. **Identity Integrity**: `/users/{userId}` documents can only be created with an ID matching the `request.auth.uid`.
2. **Ownership Locking**: Only the authenticated user whose `uid` matches the `{userId}` can read or write to their document.
3. **Immutability**: `email` and `createdAt` must be immutable after creation.
4. **Privilege Guard**: The `role` field can only be set to "user" by the user themselves during creation. Updates to `role` are forbidden for regular users.
5. **Temporal Integrity**: `createdAt` and `updatedAt` must be set via `request.time`.

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create `/users/attacker_uid` with `uid` set to `victim_uid`.
2. **Role Escalation (Create)**: Attempt to create a user with `role: "admin"`.
3. **Role Escalation (Update)**: Attempt to update an existing user's `role` from "user" to "admin".
4. **Email Modification**: Attempt to change the `email` field after creation.
5. **Timestamp Forge**: Attempt to set `createdAt` to a date in the past instead of `request.time`.
6. **Orphaned Write**: Attempt to write a user profile without being authenticated.
7. **Cross-User Read**: User A attempts to `get` User B's profile.
8. **Shadow Field Injection**: Attempt to add `isVerified: true` (not in schema) to the user document.
9. **Junk ID Poisoning**: Attempt to create a user with a document ID that is a 1MB string of junk characters.
10. **Partial Update Gap**: Attempt to update `updatedAt` without also updating a data field. (Wait, validation should catch this).
11. **Malicious Enum**: Attempt to set `role` to "super_god_mode".
12. **PII Leak**: Attempt to `list` the `/users` collection as a regular user.

## Test Runner (firestore.rules.test.ts)
```typescript
// Skeleton for tests (to be implemented if testing environment is available)
// ...
```
