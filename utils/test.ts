
const months = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7]

function sortByMonthDay(dates) {
    return [...dates].sort((a, b) => {
        const monthDiff = months.indexOf(b.getMonth()) - months.indexOf(a.getMonth())

        // If months are different, later month comes first
        if (monthDiff !== 0) {
            return monthDiff;
        }

        // If months are same, compare days
        return b.getDate() - a.getDate();
    });
}

// Example dates
const dates = [
    new Date('2023-01-23'),  // January 23
    new Date('2022-11-11'),  // November 11
    new Date('2023-12-25'),  // December 25
    new Date('2022-01-15')   // January 15
];

console.log('Original dates:');
dates.forEach(date => console.log(date.toLocaleDateString()));

const sortedDates = sortByMonthDay(dates);
console.log('\nSorted dates (later months/days come first):');
sortedDates.forEach(date => console.log(date.toLocaleDateString()));

/*****/

const sortByDateNoYear = function (a, b) {
    var results

     results = a.getMonth() > b.getMonth() ? 1 : a.getMonth() < b.getMonth() ? -1 : 0;

     if (results === 0) results = a.getDate() > b.getDate() ? 1 : a.getDate() < b.getDate() ? -1 : 0;

     return results;
}

console.log(dates.sort(sortByDateNoYear));


/*****/
function sortByMonthAndDate(dates) {
  return dates.sort((a, b) => {
    const monthA = a.getMonth()
    const monthB = b.getMonth()
    const dateA = a.getDate();
    const dateB = b.getDate();

    // Compare months using the custom order
    const monthIndexA = months.indexOf(monthA);
    const monthIndexB = months.indexOf(monthB);

    if (monthIndexA !== monthIndexB) {
      return monthIndexA - monthIndexB;
    }

    // If months are the same, compare by date
    return dateA - dateB;
  });
}
console.log(sortByMonthAndDate(dates));
