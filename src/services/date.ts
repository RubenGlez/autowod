// The gym books on Madrid's calendar, but runners live in UTC. Between
// midnight in Madrid and midnight UTC (1-2h, depending on DST) the UTC date is
// still "yesterday", so anything that asks "what day is it?" must ask Madrid.
const GYM_TIME_ZONE = 'Europe/Madrid';

// Today's date in Madrid, as a Date at 00:00 UTC of that calendar day. That's
// the shape WODBuster's reservas.aspx?t=<seconds> and our ISO state keys use.
export function gymToday(now: Date = new Date()): Date {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: GYM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .split('-')
    .map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
