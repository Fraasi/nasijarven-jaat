import './index.css' with { type: 'css' }
import dataset from './dates.json' with { type: 'json' }
import * as d3 from 'd3'

interface IceData {
    "Talvi": string;
    "Jäätyminen": string;
    "Jäänlähtö": string;
    "Jääpeitekauden_kesto": string;
}

// Convert date strings to Date objects and handle year transitions
function parseDate(dateStr: string, winterYear: string): Date {
  const [day, month] = dateStr.split('.');
  let dateYear = parseInt(winterYear);
  
  // If month is 10-12, it's from the start of winter season
  const monthNum = parseInt(month);
  if (monthNum >= 10) {
    dateYear = parseInt(winterYear);
  } else {
    // For months 1-4, it's from the next year
    dateYear = parseInt(winterYear) + 1;
  }
  return new Date(dateYear, monthNum - 1, parseInt(day));
}

// Process the data
const processedData = dataset.map((d: IceData) => {
  const winterYear = d.Talvi.split('-')[0]; // Get the first year from "YYYY-YYYY" format
  return {
    year: parseInt(winterYear),
    freezeDate: parseDate(d.Jäätyminen, winterYear),
    meltDate: parseDate(d.Jäänlähtö, winterYear),
    duration: Number(d.Jääpeitekauden_kesto)
  };
});

// Set up dimensions
const margin = { top: 100, right: 30, bottom: 50, left: 50 };
const width = 500 - margin.left - margin.right;
const heightPerYear = 10; // pixels per year
const height = (processedData.length * heightPerYear) - margin.top - margin.bottom;

const years = Array.from(new Set(processedData.map(d => d.year)));
const earliestYear = d3.min(years)!;
const latestYear = d3.max(years)! + 1;

// Create SVG
const svg = d3.select('#d3-wrapper')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// Add title
svg.append('text')
  .attr('class', 'chart-title')
  .attr('x', width / 2)
  .attr('y', -margin.top + 35)
  .attr('text-anchor', 'middle')
  .style('font-size', '20px')
  .text(`Näsijärven jäätyminen ja jäänlähtö ${earliestYear} - ${latestYear}`);

// Add subtitle (data source)
svg.append('text')
  .attr('class', 'chart-subtitle')
  .attr('x', width / 2)
  .attr('y', -margin.top + 65)
  .attr('text-anchor', 'middle')
  .style('font-size', '14px')
  .html('data: <a href="https://www.jarviwiki.fi/wiki/N%C3%A4sij%C3%A4rvi_(yhd.)/Ymp%C3%A4rist%C3%B6hallinnon_havaintopaikka_(Naistenlahti)" target="_blank">järviwiki</a>');

// Create scales
const yScale = d3.scaleLinear()
  .domain([earliestYear - 1, latestYear]) // -1 adds space to bottom here
  .range([height, 0]);

// Create a custom time scale for October to May
const xScale = d3.scaleTime()
  .domain([new Date(2000, 9, 15), new Date(2001, 5, 15)]) // Oct 15 to Jun 15
  .range([0, width]);

// Finnish month abbreviations
const finnishMonths: { [key: string]: string } = {
  'Jan': 'tammi',
  'Feb': 'helmi',
  'Mar': 'maalis',
  'Apr': 'huhti',
  'May': 'touko',
  'Jun': 'kesä',
  'Jul': 'heinä',
  'Aug': 'elo',
  'Sep': 'syys',
  'Oct': 'loka',
  'Nov': 'marras',
  'Dec': 'joulu'
};

const xAxis = d3.axisBottom(xScale)
  .tickFormat((d) => finnishMonths[d3.timeFormat('%b')(d as Date)] || '')
  .tickSizeInner(-height) // Add gridlines
  .tickPadding(8);       // Reduce padding

const xAxisTop = d3.axisTop(xScale)
  .tickFormat((d) => finnishMonths[d3.timeFormat('%b')(d as Date)] || '')
  .tickSizeInner(-height) // Add gridlines
  .tickPadding(8);       // Reduce padding

const yAxis = d3.axisLeft(yScale)
  .tickFormat(d => d.toString())  // Show full year
  .tickSizeInner(-width)  // Add gridlines
  .tickPadding(4);       // Reduce padding

// Add axes to chart
svg.append('g')
  .attr('class', 'y-axis')
  .call(yAxis)
  .call(g => g.selectAll('.tick text')
    .style('font-size', '10px')); // Keep small font size but remove dx offset

// Add bottom x-axis
svg.append('g')
  .attr('class', 'x-axis bottom')
  .attr('transform', `translate(0,${height})`)
  .call(xAxis);

// Add top x-axis
svg.append('g')
  .attr('class', 'x-axis top')
  .call(xAxisTop);

// Create tooltip div
const tooltip = d3.select('#d3-wrapper')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0)
  .style('position', 'absolute')
  .style('pointer-events', 'none')
  .style('background', 'rgba(255, 255, 255, 0.9)')
  .style('padding', '8px')
  .style('border', '1px solid #ccc')
  .style('border-radius', '4px')
  .style('font-size', '12px')
  .style('box-shadow', '0 1px 4px rgba(0,0,0,0.1)');

// Format date for tooltip
const formatDate = d3.timeFormat('%d.%m.%Y');

// Add lines for each winter season
processedData.forEach(d => {
  const year = d.year;
  
  // Normalize dates to the same year for proper x-axis placement
  const normalizedFreeze = new Date(
    d.freezeDate.getMonth() < 5 ? 2001 : 2000,  // If month is before May, use 2001
    d.freezeDate.getMonth(),
    d.freezeDate.getDate()
  );
  const normalizedMelt = new Date(2001, d.meltDate.getMonth(), d.meltDate.getDate());

  // Calculate duration in days
  const durationDays = Math.round((d.meltDate.getTime() - d.freezeDate.getTime()) / (1000 * 60 * 60 * 24));

  // Create a group for the line and circles
  const lineGroup = svg.append('g');

  // Add the line
  lineGroup.append('line')
    .attr('x1', xScale(normalizedFreeze))
    .attr('y1', yScale(year))
    .attr('x2', xScale(normalizedMelt))
    .attr('y2', yScale(year))
    .attr('stroke', '#2196F3')
    .attr('stroke-width', 6)
    .style('transition', 'stroke 0.2s ease');  // Add smooth transition

  // Add start circle
  lineGroup.append('circle')
    .attr('cx', xScale(normalizedFreeze))
    .attr('cy', yScale(year))
    .attr('r', 4)
    .attr('fill', '')
    .style('stroke', 'white')
    .style('stroke-width', '1px')

  // Add end circle
  lineGroup.append('circle')
    .attr('cx', xScale(normalizedMelt))
    .attr('cy', yScale(year))
    .attr('r', 4)
    .attr('fill', 'darkblue')
    .style('stroke', 'white')
    .style('stroke-width', '1px')

  // Add tooltip behavior to the group
  lineGroup
    .on('mouseover', (event) => {
      tooltip.transition()
        .duration(200)
        .style('opacity', 1);
      tooltip.html(`Talvi <span class="tooltip-value">${year}-${year+1}</span><br/>` +
                  `Jäätyminen: <span class="tooltip-value">${formatDate(d.freezeDate)}</span><br/>` +
                  `Jäänlähtö: <span class="tooltip-value">${formatDate(d.meltDate)}</span><br/>` +
                  `Jääpeitekauden kesto: <span class="tooltip-value">${durationDays}</span>`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      
      lineGroup.select('line')
        .attr('stroke', 'darkblue');
    })
    .on('mouseout', () => {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
      
      lineGroup.select('line')
        .attr('stroke', '#2196F3');
    });
});

// Add labels
svg.append('text')
  .attr('transform', 'rotate(-90)')
  .attr('y', 0 - margin.left)
  .attr('x', 0 - (height / 2))
  .attr('dy', '1em')
  .style('text-anchor', 'middle')
  .text('Vuosi');

svg.append('text')
  .attr('transform', `translate(${width/2}, ${height + margin.bottom - 10})`)
  .style('text-anchor', 'middle')
  .text('Kuukausi');
