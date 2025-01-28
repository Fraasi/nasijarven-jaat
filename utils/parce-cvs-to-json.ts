import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@fast-csv/parse'


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
type FinalJson = Array<{
 'Talvi': string
 "Jäätyminen": string
 "Jaanlähtö": string
 "Jääpeitekauden kesto": string
}>

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
      parsedCsv[data['Talvi']][data['Havainto']] =  data['Arvo']
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
    // filter out if no 'jääpeitekauden kesto' === no both dates
    Object.keys(parsedCsv).forEach((key) => {
      if (!parsedCsv[key]['Jääpeitekauden kesto']) {
        console.log(`deleted ${key} - no 'Jääpeitekauden kesto'`)
        delete parsedCsv[key]
      } else {
      // make object an array of objects for d3
        finalJson.push(parsedCsv[key])
      }
    })
    fs.writeFileSync(path.join(process.cwd(), 'src', 'dates.json'), JSON.stringify(finalJson, null, 2))
    console.log('parsed & written to src/dates.json')
  })

const csv = fs.readFileSync(path.join(process.cwd(), 'utils', 'dates.csv'), 'utf8')
stream.write(csv)
stream.end();

