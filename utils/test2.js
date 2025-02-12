import * as d3 from 'd3'

import data from '../src/dates.json' with { type: 'json' }
// const data = fs.readFileSync(path.join(process.cwd(), 'src', 'dates.json'), 'utf8')



const froze_minindex = d3.minIndex(data, dd => {
  const [d, m, y] = dd.Jäätyminen.split('.')
  let startYear = dd.Talvi.split('-')[0]
  if (y === startYear) startYear = 2000
  else startYear = 2001
  return new Date(startYear, m, d)
})
console.log('froze_minindex:', data[froze_minindex], froze_minindex)

const froze_maxindex = d3.maxIndex(data, dd => {
  const [d, m, y] = dd.Jäätyminen.split('.')
  let startYear = dd.Talvi.split('-')[0]
  if (y === startYear) startYear = 2000
  else startYear = 2001
  return new Date(startYear, m, d)
})
console.log('froze_maxindex:', data[froze_maxindex], froze_maxindex)

const melt_minindex = d3.minIndex(data, dd => {
  const [d, m, y] = dd.Jäänlähtö.split('.')
  let startYear = dd.Talvi.split('-')[0]
  if (y === startYear) startYear = 2000
  else startYear = 2001
  return new Date(startYear, m, d)
})
console.log('melt_minindex:', data[melt_minindex], melt_minindex)

const melt_maxindex = d3.maxIndex(data, dd => {
  const [d, m, y] = dd.Jäänlähtö.split('.')
  let startYear = dd.Talvi.split('-')[0]
  if (y === startYear) startYear = 2000
  else startYear = 2001
  return new Date(startYear, m, d)
})
console.log('melt_maxindex:', data[melt_maxindex], melt_maxindex)


// const melt_avg = d3.mean(data, dd => {
//   const [d, m] = dd.Jäänlähtö.split('.')
//   return new Date(2000, m, d)
// })
// console.log('melt_avg:', melt_avg)
// console.log(new Date( melt_avg))

// const froze_avg = d3.mean(data, dd => {
//   const [d, m] = dd.Jäätyminen.split('.')
//   return new Date(2000, m, d)
// })
// console.log('froze_avg:', froze_avg)
// console.log(new Date( froze_avg))
