## Decisions

- Use the existing ordered habit and reciprocal connection locks. Capture the
  recipient's own habit title before detaching; write the receipt in the same
  transaction. A failed receipt write must roll back disconnection.
- Each explicit acceptance generates a new token for both directions. Existing
  rows receive their own ID as their initial token. A manual request must match
  its reviewed token; a retry on an already disconnected generation succeeds
  without another event. The recipient connection ID plus generation is unique.
- Manual disconnect produces one receipt for the other participant. Lifecycle
  cleanup produces a neutral receipt for each affected active direction. The
  neutral wording does not disclose inactivity, privacy choices or private habit
  details. Already disconnected historical rows receive no invented reason.
- Receipts contain no heart/supporter data. The only habit snapshot is the
  recipient's own title; partner identification comes from the existing account.
  Deleting either account cascades the receipt and personal explanation.
- Bound optional text to 500 characters; trim it and store null for a
  non-disclosing choice even if a caller supplies text. Angular interpolation
  renders the preview and receipt as text, without HTML interpretation.
- List at most 50 pending receipts oldest first. Explicit, idempotent recipient
  dismissal stores readAt; subsequent refreshes reveal the next pending batch.
  Ordinary visits and the existing activity read marker do not dismiss receipts.
- Refresh the inbox independently with Chain reads, foreground return and online
  recovery. Keep errors retryable and guard stale/session-changing responses.
  Do not persist personal explanations in browser storage.

## Migration and recovery

Use the existing isolated release wrapper and a restorable populated-copy
rehearsal before deployment. Stop old writers: old clients lack required reason
bodies and old backends cannot create/reset the new generation contract. Apply
the additive migration, regenerate Prisma Client, deploy matching backend/frontend
and refresh installed PWAs. No migration or generation/build/test was executed
in this implementation session. Keep earlier release migrations unchanged.

Do not drop a populated receipt table as a rollback. Stop writes and rehearse
recovery or a compatible corrective release with the retained snapshot first.
