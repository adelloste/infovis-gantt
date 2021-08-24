/**
 * create uuid
 * @returns {string}
 */
 function uuidv4() {
    const a = crypto.getRandomValues(new Uint16Array(8));
    let i = 0;
    return '00-0-4-1-000'.replace(/[^-]/g, s => (a[i++] + s * 0x10000 >> s).toString(16).padStart(4, '0'));
}

/**
 * 
 * @param {*} s 
 * @returns 
 */
function encode(s) {
    var out = [];
    for (let i = 0; i < s.length; i++) {
        out[i] = s.charCodeAt(i);
    }
    return new Uint8Array(out);
}

// init
var margin    = { top: 0, right: 30, bottom: 50, left: 40 },
    width     = 1024,
    height    = 400,
    xOffset   = 10,
    deltaX    = null,
    deltaY    = null,
    dragX     = null,
    dragY     = null,
    room      = null,
    dataCases = null;

// random color
var color = d3.scaleSequential()
	.domain([0, 20])
	.interpolator(d3.interpolateRainbow);

// scale for x-axis
var xScale = d3.scaleTime().range([margin.right, width - margin.left]);

// scale for y-axis
var yScale = d3.scaleBand().range([margin.top, height - margin.bottom]);

// create svg
var svg = d3.select('.main-area')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('id', uuidv4())
    .attr('class', 'gantt-svg')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// create tooltip
var tooltip = d3.select('.main-area')
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
function updateYScaleDomain(rooms) {
    yScale.domain(rooms.map(d => d.name));
}

/**
 * https://stackoverflow.com/a/38746923
 * @param {*} scale 
 * @returns 
 */
function scaleBandInvert(scale, y) {
    var eachBand = scale.step();
    var index = Math.round((y / eachBand));
    return scale.domain()[index];
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
    d3.select(this).attr('stroke', '#FFFFFF');
    // reset old position
    if (flag) {
        d3.select(this).attr('y', dragY);
        // reset flag
        flag = false;
    }
    else {
        // get moved room
        var room = scaleBandInvert(yScale, o.y);
        // update datacases
        dataCases = d3.map(dataCases, function (d) {
            return {
                ...d,
                ...(d.id === i.id && { room: room })
            };
        });
    }
}

function drawBars(data) {
    // calculate bar height
    let barHeight = yScale.bandwidth();
    // create rect
    svg.selectAll('rect')
        .data(data, function(d) {
            return d.id;
        })
        .join(
            enter => enter.append('rect')
                .attr('class', 'rect')
                .attr('fill', (d, i) => color(i))
                .attr('width', 0)
                .attr('height', barHeight)
                .attr('stroke', '#FFFFFF')
                .attr('x', function (d) {
                    const cooX = xScale(new Date(d.initDate))
                    return cooX + (1 * xOffset);
                })
                .attr('y', d => (yScale(d.room)))
                .call(
                    enter => enter
                        .transition()
                        .delay((d, i) => i * 60)
                        .attr('width', function (d) {
                            const init = xScale(new Date(d.initDate));
                            const end = xScale(new Date(d.endDate));
                            return end - init;
                        })
                ),
            update => update
                .transition()
                .delay((d, i) => i * 60)
                .attr('x', function (d) {
                    const cooX = xScale(new Date(d.initDate))
                    return cooX + (1 * xOffset);
                })
                .attr('width', function (d) {
                    const init = xScale(new Date(d.initDate));
                    const end = xScale(new Date(d.endDate));
                    return end - init;
                })
                .attr('height', barHeight)
                .attr('y', d => yScale(d.room)),
            exit => exit
                .transition()
                .delay((d, i) => i * 60)
                .attr('width', 0)
                .remove()
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
function draw(room, dataCases) {
    // update domain
    updateXScaleDomain(dataCases);
    updateYScaleDomain(room);
    // draw x-axis
    drawXAxis();
    // draw y-axis
    drawYAxis();
    // draw vertical lines
    drawVerticalLines();
    // draw bars
    drawBars(dataCases);
}

// get data
Promise.all([
    d3.json('assets/stubs/rooms.json'),
    d3.json('assets/stubs/reservations.json'),
])
.then(function(results) {
    room = results[0];
    dataCases = results[1];
    // start
    draw(room, dataCases);
});

// init
$('.input-daterange').datepicker({
    format: 'yyyy-mm-dd',
    startDate: '2021-01-01',
    endDate: '2021-01-31',
    autoclose: true
});

// Selezione form e definizione dei metodi di validazione
$('#reservation-form').validate({
    rules : {
        start: {
            required : true
        },
        end: {
            required : true
        },
        room: {
            required : true
        }
    },
    messages: {
        start: '',
        end: '',
        room: ''
    },
    submitHandler: function(form) {
        // get value
        var room  = $('#room').val();
        var start = $('#start-date').val();
        var end   = $('#end-date').val();
        // update data-cases
        if(dataCases.find((o) => o.room === room && ((start >= o.initDate && start < o.endDate) || (end > o.initDate && end <= o.endDate) || (start < o.initDate && end > o.endDate)))) {
            $('#error-modal').modal();
        }
        else {
            dataCases.push({
                'id': uuidv4(),
                'room': room,
                'initDate': start,
                'endDate': end,
                'name': 'XXXXXXXXX'
            });
            // update bars
            drawBars(dataCases);
        }
    }
});


function onChange(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    if(event.target.files[0]){
        reader.readAsText(event.target.files[0]);
    }
}

function onReaderLoad(event){
    var obj = JSON.parse(event.target.result);
    // filter rooms
    dataCases = obj.filter((o) => room.find((el) => el.name === o.room));
    // update bars
    drawBars(dataCases);
}

document.getElementById('upload-file').addEventListener('change', onChange);

var save = document.getElementById('save-drawing');
save.addEventListener('click', function() {
    var data = encode(JSON.stringify(dataCases, null, '\t'));

    var blob = new Blob([data], {
        type: 'application/octet-stream'
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'reservations.json');

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent(event);
});