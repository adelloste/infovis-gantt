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
var margin = { top: 40, right: 30, bottom: 10, left: 40 },
    width  = 900,
    height = 400;

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
 */
function updateXScaleDomain() {
    xScale.domain([new Date('2021-01-01'), new Date('2021-12-31')]);
}

/**
 * update yScale domain
 * @param {*} data 
 */
function updateYScaleDomain(data) {
    yScale.domain(data.map(d => d.name));
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
 * draw 
 * @param {*} data 
 */
function draw(data) {
    // update domain
    updateXScaleDomain();
    updateYScaleDomain(data);
    // draw y-axis
    drawYAxis();
}

// get data
d3.json('assets/stubs/data.json').then(
    function(data) {
        draw(data);
    }
);