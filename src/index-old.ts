//@ts-ignore
import './index.css' with { type: 'css' }
import dates from './dates.json' with { type: 'json' }
import * as d3 from 'd3'

const margin = { top: 70, right: 30, bottom: 55, left: 40 }
const width = 500 - margin.right - margin.left
const height = 1800 - margin.top - margin.bottom
const FI = d3.timeFormatLocale({
  'dateTime': '%a %b %e %X %Y',
  'date': '%m/%d/%Y',
  'time': '%H:%M:%S',
  'periods': ['AM', 'PM'],
  'days': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'shortDays': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'months': ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'],
  'shortMonths': ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä', 'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu']
})
const formatTooltip = FI.format('%d %B')
const parseTime = d3.timeParse('%d.%m.%Y')
type Dataset = Array<{
  year: number
  startDate: Date | null
  endDate: Date | null
  duration: string
}>
const dataSet: Dataset = []

// const exampleDates = {
// "Jäätyminen": {
//   "Arvo": "5.1.2023",
//   "Arvon tyyppi": "Päivämäärä"
// },
// "Jäänlähtö": {
//   "Arvo": "28.4.2023",
//   "Arvon tyyppi": "Päivämäärä"
// },
// "Jääpeitekauden kesto": {
//   "Arvo": "113",
//   "Arvon tyyppi": "päivää"
// }
// }

let earliestYear: number = 2000
let latestYear: number = 2000

Object.entries(dates).forEach(([years, data]) => {
  const year = Number(years.split('-')[0])
  if (year < earliestYear) earliestYear = year
  if (year > latestYear) latestYear = year
  // keep year 1900 or 1901 for d3.scaletime, other everything except 1900 is off the charts
  let [frozeDay, frozeMonth, frozeYear] = data['Jäätyminen'].Arvo.split('.')
  let [meltDay, meltMonth, meltYear] = data['Jäänlähtö'].Arvo.split('.')



  const frozeFullYear = frozeMonth > meltMonth ? '1900' : '1901';
  // console.log("🚀 ~ Object.entries ~ jäätyminen:", jäätyminen)

  // const jäänlähto = data['Jäänlähtö'].Arvo
  // const JaatyminenFullYear = jaatyminenMonth > lahtoMonth ? '1900' : '1901';

  dataSet.push({
    year,
    startDate: parseTime(`${frozeDay}.${frozeMonth}.${frozeFullYear}`),
    endDate: parseTime(`${meltDay}.${meltMonth}.1901`),
    duration: data['Jääpeitekauden kesto'].Arvo
  })
})


//count avgs
let avgCount = 0
let avgStarts = 0
let avgEnds = 0
dataSet.forEach((d) => {
  //@ts-ignore
  avgStarts += d.startDate.getTime()
  //@ts-ignore
  avgEnds += d.endDate.getTime()
  avgCount++
})
const avgStart = new Date((avgStarts / avgCount))
const avgEnd = new Date((avgEnds / avgCount))

d3.select('#d3-wrapper')
  .append('xhtml:div')
  .attr('class', 'title')
  .style('font-size', '20px')
  .html(`Näsijärven jäätyminen ja jäitten lähtö ${earliestYear} - ${latestYear} <br/> <span style="font-size:14px">data: <a href="https://www.jarviwiki.fi/wiki/N%C3%A4sij%C3%A4rvi_(yhd.)/Ymp%C3%A4rist%C3%B6hallinnon_havaintopaikka_(Naistenlahti)" target="_blank">järviwiki</a></span>`)

const svg = d3.select('#d3-wrapper')
  .append('svg')
  .attr('width', width + margin.right + margin.left)
  .attr('height', height + margin.top + margin.bottom)

const yScale = d3.scaleLinear()
  .domain([earliestYear, latestYear])
  .range([0, height])

const yAxis = d3.axisLeft(yScale)
  .tickFormat(d3.format('d'))

svg.append('g')
  .attr('class', 'y-axis')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)
  .call(yAxis)

const xScale = d3.scaleTime()
  .domain([new Date(1900, 10), new Date(1901, 5)])
  .range([0, width])

const xAxis = d3.axisBottom(xScale)
  .ticks(d3.timeMonth.every(1))
  .tickFormat(FI.format('%b'))

svg.append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(${margin.left}, ${height + margin.top})`)
  .call(xAxis)

const avgAxis = d3.axisBottom(xScale)
  .tickValues([avgStart, avgEnd])
  .tickSizeInner(-height - 30) // avgTicks
  .tickSizeOuter(-6)
  .tickFormat(FI.format('%d %B'))

svg.append('g')
  .attr('class', 'avg-axis')
  .attr('transform', `translate(${margin.left}, ${height + margin.top + 30})`)
  .call(avgAxis)

d3.select('.avg-axis')
  .append('text')
  .style('fill', 'black')
  .attr('x', width / 2)
  .attr('y', 10)
  .attr('text-anchor', 'start')
  .text('Keskiarvot')


dataSet.forEach(function (d, i, arr) {
  if (i < arr.length - 1) {
  drawLine(d)
  drawPoint(d.startDate, d.year)
  drawPoint(d.endDate, d.year)
  }
})

const tooltip = d3.select('#d3-wrapper')
  .append('div')
  .style('position', 'absolute')
  .style('opacity', 0)
  .style('background', '#DEE3E3')
  .style('padding', '10px 15px')
  .style('border-radius', '10px')
  .style('border', '1px solid black')

function drawPoint(date: Date, year: number) {
  // console.log('date:', date)
  svg.append('circle')
    .style('fill', 'blue')
    .style('stroke', 'black')
    .style('stroke-width', '1px')
    .attr('r', 4)
    .attr('cx', xScale(date) + margin.left)
    .attr('cy', yScale(year) + margin.top)
}

function drawLine(data: { startDate: Date; endDate: Date; year: number; duration: string }) {
  // console.log('data:', data)
  // const startYear = start.getFullYear() === 1900 ? year : year + 1
  // const endYear = end.getFullYear() === 1900 ? year : year + 1
  const { startDate, endDate, year, duration } = data
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  svg.append('line')
    .attr('x1', xScale(startDate) + margin.left)
    .attr('y1', yScale(year) + margin.top)
    .attr('x2', xScale(endDate) + margin.left)
    .attr('y2', yScale(year) + margin.top)
    .attr('class', year)
    .style('opacity', 1)
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 8)
    .on('mouseover', function (e) {
      console.log("🚀 ~ d:", e)
      d3.select(this).style('opacity', .7)
      tooltip.transition().style('opacity', .9)
      tooltip.html(`Näsijärvi jäässä ${duration} päivää <br> ${formatTooltip(startDate)} ${startYear} - ${formatTooltip(endDate)} ${endYear}`)
      // @ts-ignore
      .style('left', e.x - 130 + 'px')
      // @ts-ignore
      .style('top', d3.event.layerY + 'px');
    })
    .on('mouseout', function () {
      d3.select(this).style('opacity', 1)
      tooltip.transition().style('opacity', 0)
    })
}
