const DEFAULT_TTL_MINUTES = 15;
const MAX_TTL_MINUTES = 120;

export function getReservationExpiresAt(now: Date = new Date()): Date {
  const value =
    process.env.EVENTBYTES_RESERVATION_TTL_MINUTES ??
    String(DEFAULT_TTL_MINUTES);

  if (!/^\d+$/.test(value)) {
    throw new Error('Invalid EVENTBYTES_RESERVATION_TTL_MINUTES');
  }

  const minutes = Number(value);

  if (
    !Number.isSafeInteger(minutes) ||
    minutes < 1 ||
    minutes > MAX_TTL_MINUTES
  ) {
    throw new Error('Reservation expiry must be between 1 and 120 minutes');
  }

  return new Date(now.getTime() + minutes * 60_000);
}
