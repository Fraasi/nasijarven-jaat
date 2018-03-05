const margin = {top: 70, right: 30, bottom: 55, left: 40};
const width = 500 - margin.right - margin.left;
const height = 570 - margin.top - margin.bottom;
const FI = d3.timeFormatLocale({
	'decimal': '.',
	'thousands': ',',
	'grouping': [3],
	'currency': ['$', ''],
	'dateTime': '%a %b %e %X %Y',
	'date': '%m/%d/%Y',
	'time': '%H:%M:%S',
	'periods': ['AM', 'PM'],
	'days': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	'shortDays': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	'months': ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'],
	'shortMonths': ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä', 'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu']
});
const formatTooltip = FI.format('%d %B');
const parseTime = d3.timeParse('%d.%m.%Y');
const dataSet = [];

data.forEach((d, i, arr) => {
	if (i === arr.length - 1) i = i - 1;
	let endMonth = d.lahto.slice(3, 5);
	let startMonth = d.jaatyminen.slice(3, 5);
	let year = startMonth > endMonth ? '1900' : '1901';
	dataSet.push({
		year: Number(d.vuosi),
		startDate: parseTime(d.jaatyminen.slice(0, 3) + d.jaatyminen.slice(3, 6) + year),
		endDate: parseTime(arr[i + 1].lahto + '1901')
	});
});

//count avgs
let count = 0;
let starts = 0;
let ends = 0;
dataSet.forEach((d) => {
	starts += d.startDate.getTime();
	ends += d.endDate.getTime();
	count++;
});
const avgStart = new Date((starts / count));
const avgEnd = new Date((ends / count));

d3.select('#d3-wrapper')
	.append('xhtml:div')
	.attr('class', 'title')
	.style('font-size', '20px')
	.html('Näsijärven jäätyminen ja jäitten lähtö 1975 - 2017 <br/> <span style="font-size:14px">data: <a href="http://www.rauhaniemi.net/historia/jaiden-lahto/" target="_blank">http://www.rauhaniemi.net/historia/jaiden-lahto/</a></span>');

const svg = d3.select('#d3-wrapper')
	.append('svg')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom);

const yScale = d3.scaleLinear()
	.domain([1974, 2018])
	.range([0, height]);

const yAxis = d3.axisLeft(yScale)
	.tickFormat(d3.format('d'));

svg.append('g')
	.attr('class', 'y-axis')    
	.attr('transform',  `translate(${margin.left}, ${margin.top})`)
	.call(yAxis);

const xScale = d3.scaleTime()
	.domain([new Date(1900, 10), new Date(1901, 5)])
	.range([0, width]);

const xAxis = d3.axisBottom(xScale)
	.ticks(d3.timeMonth.every(1))
	.tickFormat(FI.format('%b'));

svg.append('g')
	.attr('class', 'x-axis')
	.attr('transform', `translate(${margin.left}, ${height + margin.top})`)
	.call(xAxis);

const avgAxis = d3.axisBottom(xScale)
	.tickValues([avgStart, avgEnd])
	.tickSizeInner(-height - 30) // avgTicks 
	.tickSizeOuter(-6)
	.tickFormat(FI.format('%d %B'));

svg.append('g')
	.attr('class', 'avg-axis')
	.attr('transform', `translate(${margin.left}, ${height + margin.top + 30})`)
	.call(avgAxis);

d3.select('.avg-axis')
	.append('text')
	.style('fill', 'black')
	.attr('x', width / 2)
	.attr('y', 10)
	.attr('text-anchor', 'start')
	.text('Keskiarvot');


dataSet.forEach(function (d, i, arr) {
	if (i < arr.length - 1) {
		drawLine(d.startDate, d.endDate, d.year);
		drawPoint(d.startDate, d.year);
		drawPoint(d.endDate, d.year);
	}
});

const tooltip = d3.select('#d3-wrapper')
	.append('div')
	.style('position', 'absolute')
	.style('opacity', 0)
	.style('background', '#DEE3E3')
	.style('padding', '10px 15px')
	.style('border-radius', '10px')
	.style('border', '1px solid black');

function drawPoint(d, y) {
	svg.append('circle')
		.style('fill', 'blue')
		.style('stroke', 'black')
		.style('stroke-width', '1px')
		.attr('r', 4)
		.attr('cx', xScale(d) + margin.left)
		.attr('cy', yScale(y) + margin.top);
}

function drawLine(start, end, year) {
	svg.append('line')
		.attr('x1', xScale(start) + margin.left)
		.attr('y1', yScale(year) + margin.top)
		.attr('x2', xScale(end) + margin.left)
		.attr('y2', yScale(year) + margin.top)
		.attr('class', year)
		.style('opacity', 1)
		.attr('stroke', 'steelblue')
		.attr('stroke-width', 8)
		.on('mouseover', function () {
			d3.select(this).style('opacity', .7);
			tooltip.transition().style('opacity', .9);
			tooltip.html(`Näsijärvi jäässä: <br> ${formatTooltip(start)} ${year} - ${formatTooltip(end)} ${start.getMonth() < end.getMonth() ? year : year + 1}`)
				.style('left', d3.event.pageX - 130 + 'px')
				.style('top', d3.event.pageY + 30 + 'px');
		})
		.on('mouseout', function () {
			d3.select(this).style('opacity', 1);
			tooltip.transition().style('opacity', 0);
		});
}
