import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@fast-csv/parse'
import * as d3 from 'd3'
// import parseDate from './parse-date.ts'


const exampleData = {
  "1836-1837": {
    "Jäätyminen": {
      "Arvo": "27.11.1836",
      "Arvon tyyppi": "Päivämäärä"
    },
    "Jäänlähtö": {
      "Arvo": "8.5.1837",
      "Arvon tyyppi": "Päivämäärä"
    },
    "Jääpeitekauden kesto": {
      "Arvo": "162",
      "Arvon tyyppi": "päivää"
    }
  }
}

type FinalObject = {
  'Talvi': string
  "Jäätyminen": string
  "Jäänlähtö": string
  "Jääpeitekauden_kesto": string
}

type FinalJson = Array<FinalObject>

type Parsed = keyof typeof exampleData | {}
const parsedCsv: Parsed = {}
const finalJson: FinalJson = []

type Row = {
  Talvi: string
  Havainto: string
  Arvo: string
  'Arvon tyyppi': string
  'Lisätiedot': string
  Valokuva: string
  'Havainnoijan status': string
}
type ReturnRow = Row & {}

const stream = parse<Row, ReturnRow>({ headers: true, delimiter: ';', ignoreEmpty: true })
  .transform((data: Row) => {
    if (parsedCsv[data['Talvi']]) {
      parsedCsv[data['Talvi']][data['Havainto']] = data['Arvo']
    } else {
      parsedCsv[data['Talvi']] = {
        'Talvi': data['Talvi'],
        [data['Havainto']]: data['Arvo']
      }
    }
    // return data
  })
  .on('error', (error: Error) => console.error(error))
  .on('data', row => console.log(row)) // not showing anything 'cos transform not returning
  .on('end', (rowCount: number) => {
    console.log(`Parsed ${rowCount} rows`)
    // filter out if no 'jääpeitekauden kesto' === no start OR end date
    Object.keys(parsedCsv).forEach((key) => {
      if (!parsedCsv[key]['Jääpeitekauden kesto']) {
        console.log(`deleted ${key} - no 'Jääpeitekauden kesto'`)
        delete parsedCsv[key]
      } else {
        // make object an array of objects for d3
        // replace whitespace with underscore in 'Jääpeitekauden kesto' key
        const fixed = parsedCsv[key]
        fixed.Jääpeitekauden_kesto = fixed['Jääpeitekauden kesto']
        delete fixed['Jääpeitekauden kesto']
        finalJson.push(fixed)
      }
    })
    // fs.writeFileSync(path.join(process.cwd(), 'src', 'dates.json'), JSON.stringify(finalJson, null, 2))
    // console.log('parsed & written to src/dates.json')
    console.log('counting stats...')
    const ss = stats(finalJson)
    console.log('stats:', ss)
  })

const csv = fs.readFileSync(path.join(process.cwd(), 'utils', 'dates.csv'), 'utf8')
stream.write(csv)
stream.end();

// count some useful stats
function stats(data: FinalJson) {
  function indexDate(data: FinalObject, type: string):  number {
    const [d, m, y] = data[type].split('.')
    let year: string | number = data.Talvi.split('-')[0]
    if (y === year) year = 2000
    else year = 2001
    return new Date(year, Number(m) - 1, Number(d)).getTime()
  }

  // indices
  const earliestFroze = d3.minIndex(data, d => indexDate(d, 'Jäätyminen'))
  const latestFroze = d3.maxIndex(data, d => indexDate(d, 'Jäätyminen'))
  const earliestMelt = d3.minIndex(data, d => indexDate(d, 'Jäänlähtö'))
  const latestMelt = d3.maxIndex(data, d => indexDate(d, 'Jäänlähtö'))
  const shortestDuration = d3.minIndex(data, d => Number(d.Jääpeitekauden_kesto))
  const longestDuration = d3.maxIndex(data, d => Number(d.Jääpeitekauden_kesto))
  const avgFroze = d3.mean(data, d => indexDate(d, 'Jäätyminen'))
  const avgMelt = d3.mean(data, d => indexDate(d, 'Jäänlähtö'))

  return {
    earliestFroze: data[earliestFroze],
    latestFroze: data[latestFroze],
    earliestMelt: data[earliestMelt],
    latestMelt: data[latestMelt],
    shortestIceDuration: data[shortestDuration],
    longestIceDuration: data[longestDuration],
    averages: {
      froze: avgFroze,
      melt: avgMelt,
      duration: Math.round(data.reduce((a, b) => a + Number(b.Jääpeitekauden_kesto), 0) / data.length),
    }
  }
}


//==========================================
// earlier own solution before d3, counting same results though 😁🤗
// function earlyStats(data: FinalJson) {
  // console.log('earliestFroze: 25.10,1891')
  // console.log('latestFroze: 26.2.2020')
  // console.log('earliestMelt: 9.4.2020')
  // console.log('latestMelt: 17.6.1867')

//   const frozeArr: Date[] = []
//   const meltArr: Date[] = []
//   const durationArr: number[] = []
//   for (const d of data) {
//     // const frozeDate = parseDate(d.Jäätyminen)
//     const [fday, fmonth, fyear] = d.Jäätyminen.split('.')
//     const [mDay, mMonth, mYear] = d.Jäänlähtö.split('.')
//     frozeArr.push(new Date(`${fyear}-${fmonth}-${fday}`))
//     meltArr.push(new Date(`${mYear}-${mMonth}-${mDay}`))
//     durationArr.push(Number(d.Jääpeitekauden_kesto))
//   }


//   function sortByMonthAndDate(dates) {
//     // Compare months using the custom order
//     const months = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7]
//     const sortedDates = [...dates].sort((a, b) => {
//       const monthA = a.getMonth() + 1; // getMonth() returns 0-11, so add 1
//       const monthB = b.getMonth() + 1;
//       const dateA = a.getDate();
//       const dateB = b.getDate();

//       const monthIndexA = months.indexOf(monthA);
//       const monthIndexB = months.indexOf(monthB);

//       if (monthIndexA !== monthIndexB) {
//         return monthIndexA - monthIndexB;
//       }
//       // If months are the same, compare by date
//       return dateA - dateB;
//     });
//     return [sortedDates.at(0), sortedDates.at(-1)]
//   }

//   function calculateAverageOfDates(dates: Date[]): Date {
//     // @ts-ignore
//     const totalMilliseconds: number = dates.reduce((sum, date) => sum + date.getTime(), 0);
//     const averageMilliseconds = totalMilliseconds / dates.length;
//     return new Date(averageMilliseconds);
//   }

//   const averages = {
//     froze: calculateAverageOfDates(frozeArr),
//     melt: calculateAverageOfDates(meltArr),
//     duration: Math.round(durationArr.reduce((a, b) => a + b, 0) / durationArr.length),
//   }

//     // get indices for finalJson
//     const froze = sortByMonthAndDate(frozeArr)
//     const frozIdx1 = frozeArr.indexOf(froze[0])
//     const frozIdx2 = frozeArr.indexOf(froze[1])
//     const melt = sortByMonthAndDate(meltArr)
//     const meltIdx1 = meltArr.indexOf(melt[0])
//     const meltIdx2 = meltArr.indexOf(melt[1])

//     const longestDuration: number = Math.max(...durationArr)
//     const shortestDuration: number = Math.min(...durationArr)
//     const longestDurationIndex: number = durationArr.indexOf(longestDuration)
//     const shortestDurationIndex: number = durationArr.indexOf(shortestDuration)

//     return {
//       shortestIceDuration: data[shortestDurationIndex],
//       longestIceDuration: data[longestDurationIndex],
//       earliestFroze: finalJson[frozIdx1],
//       latestFroze: finalJson[frozIdx2],
//       earliestMelt: finalJson[meltIdx1],
//       latestMelt: finalJson[meltIdx2],
//       averages
//     }
// }

