-- Normalize legacy payment intents created before expiry snapshots and the
-- consolidated booking/payment state machine were introduced.

BEGIN;

UPDATE public.payments p
SET expires_at = COALESCE(p.expires_at, b.hold_expires_at, p.created_at),
    status = 'expired',
    updated_at = NOW()
FROM public.bookings b
WHERE b.id = p.booking_id
  AND p.status = 'pending'
  AND (
    b.status <> 'pending'
    OR b.hold_expires_at <= NOW()
    OR (p.expires_at IS NOT NULL AND p.expires_at <= NOW())
  );

UPDATE public.payments p
SET expires_at = b.hold_expires_at,
    updated_at = NOW()
FROM public.bookings b
WHERE b.id = p.booking_id
  AND p.status = 'pending'
  AND p.expires_at IS NULL
  AND b.status = 'pending'
  AND b.hold_expires_at > NOW();

COMMIT;

SELECT status, COUNT(*) AS payment_count
FROM public.payments
GROUP BY status
ORDER BY status;
