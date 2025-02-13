import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@fast-csv/parse'
import * as d3 from 'd3'


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

type Stats = {
  earliestFroze: FinalObject,
  latestFroze: FinalObject,
  earliestMelt: FinalObject,
  latestMelt: FinalObject,
  shortestIceDuration: FinalObject,
  longestIceDuration: FinalObject,
  averages: {
    froze: string,
    melt: string,
    duration: number,
  }
}

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
    fs.writeFileSync(path.join(process.cwd(), 'src', 'dates.json'), JSON.stringify(finalJson, null, 2))
    console.log('parsed & written to src/dates.json')
    console.log('counting stats...')
    const finalStats = stats(finalJson)
    fs.writeFileSync(path.join(process.cwd(), 'src', 'stats.json'), JSON.stringify(finalStats, null, 2))
    console.log('stats written to src/stats.json')
  })

console.log('parsing cvs to json...')
const csv = fs.readFileSync(path.join(process.cwd(), 'utils', 'dates.csv'), 'utf8')
stream.write(csv)
stream.end();

// count some useful stats
function stats(data: FinalJson): Stats {
  // uncomment if you want to check your data
  // console.log('earliestFroze: 25.10,1891')
  // console.log('latestFroze: 26.2.2020')
  // console.log('earliestMelt: 9.4.2020')
  // console.log('latestMelt: 17.6.1867')
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
  const avgFroze = d3.mean(data, d => indexDate(d, 'Jäätyminen')) as number
  const avgMelt = d3.mean(data, d => indexDate(d, 'Jäänlähtö')) as number

  return {
    earliestFroze: data[earliestFroze],
    latestFroze: data[latestFroze],
    earliestMelt: data[earliestMelt],
    latestMelt: data[latestMelt],
    shortestIceDuration: data[shortestDuration],
    longestIceDuration: data[longestDuration],
    averages: {
      froze: `${new Date(avgFroze).getDate()}.${new Date(avgFroze).getMonth() + 1}`,
      melt: `${new Date(avgMelt).getDate()}.${new Date(avgMelt).getMonth() + 1}`,
      duration: Math.round(data.reduce((a, b) => a + Number(b.Jääpeitekauden_kesto), 0) / data.length),
    }
  }
}

