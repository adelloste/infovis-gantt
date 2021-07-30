/**
 * create uuid
 * @returns {string}
 */
 function uuidv4() {
    const a = crypto.getRandomValues(new Uint16Array(8));
    let i = 0;
    return '00-0-4-1-000'.replace(/[^-]/g, s => (a[i++] + s * 0x10000 >> s).toString(16).padStart(4, '0'));
}

// init
var margin  = { top: 40, right: 30, bottom: 10, left: 40 },
    width   = 900,
    height  = 400,
    xOffset = 10;

// scale for x-axis
var xScale = d3.scaleUtc().range([margin.right, width - margin.left]);

// scale for y-axis
var yScale = d3.scaleBand().range([margin.top, height - margin.bottom]);

// create svg
var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', uuidv4())
    .attr('class', 'gantt-svg')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

/**
 * update xScale domain
 * @param {*} data 
 */
function updateXScaleDomain(data) {
    xScale.domain([d3.min(data, d => new Date(d.initDate)), d3.max(data, d => new Date(d.endDate))]);
}

/**
 * update yScale domain
 * @param {*} data 
 */
function updateYScaleDomain(data) {
    yScale.domain(data.map(d => d.name));
}

function drawXAxis() {
    // add scales to axis
    var x_axis = d3.axisTop().scale(xScale);
    // append group and insert y-axis
    svg.append('g')
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [xOffset, margin.top] + ')')
        .call(x_axis);
}

/**
 * draw y-axis
 */
function drawYAxis() {
    // add scales to axis
    var y_axis = d3.axisLeft().scale(yScale);
    // append group and insert y-axis
    svg.append('g')
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [margin.left, 0] + ')')
        .call(y_axis);
}

/**
 * draw vertical lines
 */
function drawVerticalLines() {
    svg.append('g')
        .selectAll('line')
        .data(xScale.ticks())
        .join('line')
        .attr('stroke', '#E4E4E4')
        .attr('x1', function (d) {
            return xScale(new Date(d)) + xOffset;
        })
        .attr('x2', function (d) {
            return xScale(new Date(d)) + xOffset;
        })
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom);
}

function drawBars(data) {
    // calculate bar height
    var barHeight = yScale.bandwidth() / 2;
    // create rect
    svg.append('g')
        .selectAll('rect')
        .data(data)
        .join(
            enter => enter.append('rect')
                .attr('fill', d => d.color)
                .attr('width', 0)
                .attr('height', barHeight)
                .attr('x', function (d) {
                    const cooX = xScale(new Date(d.initDate))
                    return cooX + (1 * xOffset);
                  })
                .attr('y', d => (yScale(d.name) + barHeight / 2))
                .call(
                    enter => enter
                        .transition()
                        .delay((d, i) => i * 60)
                        .attr('width', function (d) {
                            const init = xScale(new Date(d.initDate));
                            const end = xScale(new Date(d.endDate));
                            return end - init;
                        })
                )
        );
}

/**
 * draw 
 * @param {*} data 
 */
function draw(data) {
    // update domain
    updateXScaleDomain(data);
    updateYScaleDomain(data);
    // draw x-axis
    drawXAxis();
    // draw y-axis
    drawYAxis();
    // draw vertical lines
    drawVerticalLines();
    // draw bars
    drawBars(data);
}

// get data
d3.json('assets/stubs/data.json').then(
    function(data) {
        draw(data);
    }
);