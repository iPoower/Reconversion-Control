# NOESIS — multi-tab writes and failed restoration verification

This branch is stacked on #26 and does not modify its source branch.

Confirmed before correction: two instances of the actual atomic functions loaded the
same V3 baseline; the second overwrote the first without refusal. A second red test
showed that a readback failure after writing a replacement left the replacement in
persistent storage despite reporting failure.

Corrections are confined to existing persistence and its safety notice:
- One native exclusive Web Lock grants a writer lease for a document lifetime. Other
  tabs retain memory and export capability, but cannot commit imports, resets or edits.
  A failed or unsupported lock never falls back to unsafe concurrent writes.
- Before writes, compare the stored canonical bytes with the loaded/confirmed baseline.
  An external change blocks further writes rather than being adopted or overwritten.
- Manual/cloud restore establishes a confirmed source first. If replacement readback
  fails, restore the previous exact bytes only when the exclusive writer still sees its
  own replacement. If this rollback also fails or another value appears, block writes
  and preserve canonical/legacy keys for diagnosis. No key is deleted.
- Invalid canonical progression/Daily Five and unparseable historical storage cannot
  be overwritten by empty defaults. Canonical business sanitizers run strictly.
- Cloud snapshots are refused for unconfirmed or secondary-tab memory.

Regression evidence: exact production functions in the VM; native Web Locks, real
localStorage, two pages, simultaneous edits, rejected import, exported unsaved work,
complete business/Daily Five comparison after closure, corrupted canonical bytes, quota
and readback failure in both required browser jobs. No Google or Supabase connection.
The local browser installation failed; GitHub CI on the exact head is required before
claiming browser success. Independent device and production states remain unverified.

Limits: this is a cooperative lock, not protection from an XSS/hostile same-origin script
or an old version that ignores the protocol. Close old tabs before a reviewed upgrade.
A secondary tab requires export and reload after the writer closes; it never silently
promotes stale memory. Pagehide releases the lease; BFCache returns remain read-only.
A persistent storage failure cannot promise automatic rollback; the visible blocked
state is a recovery incident, not a success. Preserve all keys and independent exports.

Rollback: retain V3 canonical bytes, both legacy mirrors and full export before any
approved code downgrade. Do not assume old code reads V3 or that mirrors are current
when a storage warning occurred. Recover in a separate origin/profile, compare every
business field, then decide. No migration, data reset or personal activation here.

An additional red regression proves unsupported legacy topic IDs were silently dropped
before migration. Legacy business readers now refuse invalid/unknown data, retain original
bytes and block migration. Both browsers cover this historical preservation case.
