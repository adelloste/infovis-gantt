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
var margin = { top: 0, right: 30, bottom: 50, left: 40 },
    width = 1024,
    height = 400,
    xOffset = 10,
    deltaX = null,
    deltaY = null,
    dragX = null,
    dragY = null;

// random color
var color = d3.scaleOrdinal(d3.schemeCategory10);

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

// create tooltip
var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'svg-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden');

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
    yScale.domain(data.map(d => d.room));
}

function drawXAxis() {
    // add scales to axis
    let x_axis = d3.axisBottom()
        .scale(xScale)
        .ticks(d3.utcDay, 1)
        .tickFormat(d3.timeFormat('%b %d'))
        .tickSize(12, 0, 0);
    // append group and insert y-axis
    svg.append('g')
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [xOffset, height - margin.bottom] + ')')
        .call(x_axis)
        .selectAll('text')
        .attr('transform', 'rotate(45)')
        .style('text-anchor', 'start');
}

/**
 * draw y-axis
 */
function drawYAxis() {
    // add scales to axis
    let y_axis = d3.axisLeft().scale(yScale);
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
function dragStarted(event) {
    let current = d3.select(this).raise().attr('stroke', 'black');
    deltaX = current.attr('x') - event.x;
    dragX = d3.select(this).attr('x');
    deltaY = current.attr('y') - event.y;
    dragY = d3.select(this).attr('y');
}

/**
 * drag
 * @param {*} d 
 */
function dragged(event, d) {
    let init = xScale(new Date(d.initDate));
    let end = xScale(new Date(d.endDate));
    let wRect = end - init + margin.right;
    // calculate bar height
    let barHeight = yScale.bandwidth();
    //
    var x = event.x,
        y = event.y,
        gridY = round(Math.max(0, Math.min(height - barHeight - margin.bottom, y)), barHeight);
    //
    d3.select(this).attr('y', gridY);
    // hidden tooltip
    tooltip.style('visibility', 'hidden');
}

/**
 * enforcing ended
 * @param {*} p 
 * @param {*} n 
 * @returns 
 */
function round(p, n) {
    return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
}

/**
 * drag ended
 * @param {*} d 
 */
function dragEnded(o, i) {
    // get attributes from moved reservation
    let flag = false,
        xMoved = parseFloat(d3.select(this).attr('x')),
        yMoved = parseInt(d3.select(this).attr('y')),
        wMoved = parseFloat(d3.select(this).attr('width')),
        xFinalMoved = xMoved + wMoved;
    // check overlapping
    svg.selectAll('.rect').each(function(d, event) {
        // get attributes from other reservations
        let x = parseFloat(d3.select(this).attr('x')),
            y = parseInt(d3.select(this).attr('y')),
            w = parseFloat(d3.select(this).attr('width')),
            xFinal = x + w;
        // check reservation for same room with different id
        if (!flag && d.id !== i.id && yMoved === y) {
            // verify overlapping
            if((xMoved >= x && xMoved < xFinal) || (xFinalMoved > x && xFinalMoved <= xFinal) || (xMoved < x && xFinalMoved > xFinal)) {
                flag = true;
            }
        }
    });
    d3.select(this).attr('stroke', null);
    // reset old position
    if (flag) {
        d3.select(this).attr('y', dragY);
        // reset flag
        flag = false;
    }
}

function drawBars(data) {
    // calculate bar height
    let barHeight = yScale.bandwidth();
    // create rect
    svg.append('g')
        .selectAll('rect')
        .data(data)
        .join(
            enter => enter.append('rect')
                .attr('class', 'rect')
                .attr('fill', (d, i) => color(i))
                .attr('width', 0)
                .attr('height', barHeight)
                .attr('x', function (d) {
                    const cooX = xScale(new Date(d.initDate))
                    return cooX + (1 * xOffset);
                })
                .attr('y', d => (yScale(d.room)))
                // .on('mouseover', function () {
                //     return tooltip.style('visibility', 'visible');
                // })
                // .on('mousemove', function (event, d) {
                //     return tooltip
                //         .html('Reservation for ' + d.name)
                //         .style('top', (event.pageY - 10) + 'px')
                //         .style('left', (event.pageX + 10) + 'px');
                // })
                // .on('mouseout', function () {
                //     return tooltip.style('visibility', 'hidden');
                // })
                .call(
                    enter => enter
                        .transition()
                        .delay((d, i) => i * 60)
                        .attr('width', function (d) {
                            const init = xScale(new Date(d.initDate));
                            const end = xScale(new Date(d.endDate));
                            return end - init;
                        }),
                    update => update
                        .transition()
                        .delay((d, i) => i * 60)
                        .attr('width', function (d) {
                            const init = xScale(new Date(d.initDate));
                            const end = xScale(new Date(d.endDate));
                            return end - init;
                        })
                        .attr('height', barHeight)
                        .attr('y', d => (xScale(d.room) + barHeight / 2)),
                    exit => exit
                        .transition()
                        .delay((d, i) => i * 60)
                        .attr('width', 0)
                        .remove()
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
    function (data) {
        draw(data);
    }
);