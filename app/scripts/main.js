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
    xOffset = 10,
    deltaX  = null,
    deltaY  = null;

// scale for x-axis
var xScale = d3.scaleTime().range([margin.right, width - margin.left]);

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
    xScale.domain([new Date('2021-01-01'), new Date('2021-01-31')]).clamp(true);
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
    var x_axis = d3.axisTop()
        .scale(xScale)
        .ticks(d3.utcDay, 1)
        .tickFormat(d3.timeFormat('%d/%m/%Y'))
        .tickSize(12, 0, 0);
    // append group and insert y-axis
    svg.append('g')
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [xOffset, margin.top] + ')')
        .call(x_axis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'start');
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
        .data(xScale.ticks(d3.utcDay, 1))
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

/**
 * drag started
 * @param {*} d 
 */
function dragStarted(d) {
    var current = d3.select(this).raise().attr('stroke', 'black');
    deltaX = current.attr('x') - event.x;
}

/**
 * drag
 * @param {*} d 
 */
function dragged(d) {
    d3.select(this)
        .attr('x', event.x + deltaX);
}

/**
 * drag ended
 * @param {*} d 
 */
function dragEnded(d) {
    d3.select(this).attr('stroke', null);
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
        )
        .call(
            d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded)
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
d3.json('assets/stubs/reservations.json').then(
    function(data) {
        draw(data);
    }
);