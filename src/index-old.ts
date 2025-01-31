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
type DateType = {
  year: number
  startDate: Date
  endDate: Date
  duration: string
}
type Dataset = Array<DateType>
const dataSet: Dataset = []

type Data = {
  "Talvi": string, // "1836-1837",
  "Jäätyminen": string, // "27.11.1836",
  "Jäänlähtö": string, // "8.5.1837",
  "Jääpeitekauden kesto": string // "162"
}

let earliestYear = d3.min(dates, (d) => Number(d.Talvi.split('-')[0])) as number
let latestYear = d3.max(dates, (d) => Number(d.Talvi.split('-')[1])) as number

dates.forEach((data: Data) => {
  const year = Number(data.Talvi.split('-')[0])
  if (year < earliestYear) earliestYear = year
  if (year > latestYear) latestYear = year
  // keep year 1900 or 1901 for d3.scaletime, other everything except 1900 is off the charts
  let [frozeDay, frozeMonth, frozeYear] = data['Jäätyminen'].split('.')
  let [meltDay, meltMonth, meltYear] = data['Jäänlähtö'].split('.')

  const frozeFullYear = frozeYear === meltYear ? '1901' : '1900'
  // console.log("🚀 ~ Object.entries ~ jäätyminen:", jäätyminen)

  // const jäänlähto = data['Jäänlähtö'].Arvo
  // const JaatyminenFullYear = jaatyminenMonth > lahtoMonth ? '1900' : '1901';

  dataSet.push({
    year,
    startDate: parseTime(`${frozeDay}.${frozeMonth}.${frozeFullYear}`) as Date,
    endDate: parseTime(`${meltDay}.${meltMonth}.1901`) as Date,
    duration: data['Jääpeitekauden kesto']
  })
})

console.log('dataSet:', dataSet)

//count avgs
let avgCount = 0
let avgStarts = 0
let avgEnds = 0
dataSet.forEach((d) => {
  avgStarts += d.startDate.getTime()
  avgEnds += d.endDate.getTime()
  avgCount++
})
const avgStart = new Date((avgStarts / avgCount))
const avgEnd = new Date((avgEnds / avgCount))

d3.select('#d3-wrapper')
  .append('xhtml:div')
  .attr('class', 'title')
  .style('font-size', '20px')
  //TODO; add buttons for years???
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
xScale.clamp(true)

const xAxis = d3.axisBottom(xScale)
  .ticks([0, 1])
  .ticks(d3.timeMonth.every(1))
  // .tickFormat(FI.format('%b'))

svg.append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(${margin.left}, ${height + margin.top})`)
  .call(xAxis)

const avgAxis = d3.axisBottom(xScale)
  .tickValues([avgStart, avgEnd])
  .tickSizeInner(-height - 30) // avgTicks
  .tickSizeOuter(-6)
// .tickFormat(FI.format('%d %B'))

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


dataSet.forEach(function (d: DateType, i, arr) {
//   // if (i < arr.length - 1) {
    drawLine(d)
    drawPoint(d, d.startDate)
    drawPoint(d, d.endDate)
//   // }
})
// try this
 // svg.selectAll('circle')
 //    .data(dataSet)
 //    .enter()
 //    .append('circle')
 //      .attr('cx', d => xScale(d.startDate))
 //      .attr('cy', d => yScale(d.year))
 //      .attr('r', 5)
 //      .attr('fill', 'purple')

 // svg.selectAll('circle')
 //    .data(dataSet)
 //    .enter()
 //    .append('circle')
 //      .attr('cx', d => xScale(d.endDate))
 //      .attr('cy', d => yScale(d.year))
 //      .attr('r', 5)
 //      .attr('fill', 'green')
    // .append('line')
    //   .attr('cx', d => xScale(d.startDate))
    //   .attr('cy', 20)
    //   .attr('r', 10)
    //   .attr('fill', 'purple')

const tooltip = d3.select('#d3-wrapper')
  .append('div')
  .style('position', 'absolute')
  .style('opacity', 0)
  .style('background', '#DEE3E3')
  .style('padding', '10px 15px')
  .style('border-radius', '10px')
  .style('border', '1px solid black')

function drawPoint(date: DateType, year: Date) {
  // console.log('date:', date)
  svg.append('circle')
    .style('fill', 'blue')
    .style('stroke', 'black')
    .style('stroke-width', '1px')
    .attr('r', 4)
    .attr('cx', xScale(date.startDate) + margin.left)
    .attr('cy', yScale(year) + margin.top)
};

function drawLine(data: DateType) {
  // console.log('data:', data)
  // const startYear = start.getFullYear() === 1900 ? year : year + 1
  // const endYear = end.getFullYear() === 1900 ? year : year + 1

  const { startDate, endDate, year, duration } = data
  console.log("🚀 ~ drawLine ~ data:", data)
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const line = d3.line()
    .x((d) => xScale(d.startdate))
    .y((d) => yScale(d.year));

  svg.append("path")
    .attr("d", line(data))
    .attr("stroke", "currentColor");

  // svg.append('line')
  //   .attr('x1', xScale(startDate) + margin.left)
  //   .attr('x2', xScale(endDate) + margin.left)
  //   .attr('y1', yScale(year) + margin.top)
  //   .attr('y2', yScale(year) + margin.top)
  //   .attr('class', year)
  //   .style('opacity', 1)
  //   .attr('stroke', 'steelblue')
  //   .attr('stroke-width', 8)
  //   .on('mouseover', function (e) {
  //     console.log("🚀 ~ d:", e)
  //     d3.select(this).style('opacity', .7)
  //     tooltip.transition().style('opacity', .9)
  //     tooltip.html(`Näsijärvi jäässä ${duration} päivää <br> ${formatTooltip(startDate)} ${startYear} - ${formatTooltip(endDate)} ${endYear}`)
  //       // @ts-ignore
  //       .style('left', e.x - 130 + 'px')
  //       // @ts-ignore
  //       .style('top', e.y + 'px')
  //   })
  //   .on('mouseout', function () {
  //     d3.select(this).style('opacity', 1)
  //     tooltip.transition().style('opacity', 0)
  //   })
}
