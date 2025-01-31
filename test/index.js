
// type DateType = {
//   year: number
//   startDate: Date
//   endDate: Date
//   duration: string
// }
//
// Sample data
const data = [
  { year: 2005, startDate: new Date('2005-01-01'), endDate: new Date('2005-12-31'), duration: '1 year' },
  { year: 2008, startDate: new Date('2008-01-01'), endDate: new Date('2008-12-31'), duration: '1 year' },
  // Add more data objects here
];

// Set up the SVG container and dimensions
const svgWidth = 800;
const svgHeight = 600;
const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// Append SVG to the body
const svg = d3.select('body')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight)
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

// Parse the dates and years
const parseDate = d3.timeParse('%Y-%m-%d');
const xScale = d3.scaleTime().domain([new Date('2000-01-01'), new Date('2012-12-31')]).range([0, width]);
const yScale = d3.scaleLinear().domain([2000, 2012]).range([height, 0]);

// Create the x and y axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

// Append the axes to the SVG
svg.append('g')
  .attr('transform', `translate(0, ${height})`)
  .call(xAxis);

svg.append('g')
  .call(yAxis);

// Bind data and create visual elements (e.g., circles, bars, etc.)
// For each data object, you can create elements like bars, circles, etc., based on the x and y values.

// Remember to style and customize your chart based on your requirements.
// Bind data and create a line chart
const line = d3.line()
  .x(d => xScale(new Date(d.startDate.getFullYear(), d.startDate.getMonth(), 1))) // x position based on start month
  .y(d => yScale(d.year)); // y position based on year

// Append the line to the SVG
svg.append('path')
  .datum(data)
  .attr('fill', 'none')
  .attr('stroke', 'steelblue')
  .attr('stroke-width', 2)
  .attr('d', line);
