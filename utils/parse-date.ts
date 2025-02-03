
// Convert date strings to Date objects and handle year transitions
export default function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('.');
  let dateYear = parseInt(year);

  // If month is 10-12, it's from the start of winter season
  const monthNum = parseInt(month);
  if (monthNum <= 5) {
    // For months 1-4, it's from the next year
    dateYear =  dateYear + 1;
  }
  return new Date(dateYear, monthNum - 1, parseInt(day));
}
