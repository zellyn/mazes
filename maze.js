'use strict';

let image_pairs = [
    ['giraffe', ['leaves', 'leaves2']],
    ['deer', ['leaves', 'leaves2', 'grass']],
    ['rabbit', ['carrot']],
    ['penguin', ['trout']],
    ['snail', ['leaves2']],
];

function line(x1, y1, x2, y2, klass='wall', target) {
    // <line x1="10" x2="50" y1="110" y2="150" stroke="orange" stroke-width="5"/>
    let line = document.createElementNS(SVGNS, 'line');
    for (const [k, v] of Object.entries({
	x1: x1,
	y1: y1,
	x2: x2,
	y2: y2,
	'class': klass,
    })) {
	line.setAttribute(k, v);
    }

    target.appendChild(line);
}

function circle(cx, cy, r, klass='outline', target) {
    let circle = document.createElementNS(SVGNS, 'circle');
    for (const [k, v] of Object.entries({
	cx: cx,
	cy: cy,
	r: r,
	'class': klass,
    })) {
	circle.setAttribute(k, v);
    }

    target.appendChild(circle);
}

// <image x="10" y="20" width="80" height="80" href="recursion.svg" />
function image(name, x, y, size, target) {
    let image = document.createElementNS(SVGNS, 'image');
    for (const [k, v] of Object.entries({
	x: x,
	y: y,
	width: size,
	height: size,
	href: `img/${name}.svg`,
    })) {
	image.setAttribute(k, v);
    }

    target.appendChild(image);
}

function choose(ary) {
    return ary[Math.floor(Math.random() * ary.length)];
}

/**
 * Shuffles array in place. ES6 version
 * https://stackoverflow.com/a/6274381/23582
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
}

class Maze {
    constructor(height, width) {
	this.height = height;
	this.width = width;
	this.verticals = Array(height).fill().map(() => Array(width+1).fill(true));
	this.horizontals = Array(height+1).fill().map(() => Array(width).fill(true));
    }

    build_by_joining_sets() {
	let cell_sets = new Map();
	let set_cells = new Map();
	let i = 0;
	for (let x=0; x<this.width; x++) {
	    for (let y=0; y<this.height; y++) {
		cell_sets.set([x,y].toString(), i);
		set_cells.set(i, [[x,y]]);
		i++;
	    }
	}

	let walls = this.all_walls()
	shuffle(walls);

	while (set_cells.size > 1) {
	    let [cell, neighbor] = walls.pop();
	    let set1 = cell_sets.get(cell.toString()), set2 = cell_sets.get(neighbor.toString());
	    if (set1 == set2) {
		continue;
	    }
	    this.clear_wall_between(cell, neighbor);
	    let set1_cells = set_cells.get(set1), set2_cells = set_cells.get(set2);
	    set_cells.delete(set2);
	    set_cells.set(set1, set1_cells.concat(set2_cells));
	    for (let xy of set2_cells) {
		cell_sets.set(xy.toString(), set1);
	    }
	}
    }

    set_random_start_end() {
	this.start = Math.floor(Math.random() * this.height);
	this.end = Math.floor(Math.random() * this.height);
	this.verticals[this.start][0] = false;
	this.verticals[this.end][this.verticals[0].length-1] = false;
    }

    // Get a random X,Y cell coordinate.
    random_xy() {
	return [Math.floor(Math.random() * this.width), Math.floor(Math.random() * this.height)];
    }

    all_walls() {
	let walls = [];
	for (let x=0; x < this.width-1; x++) {
	    for (let y=0; y < this.height; y++) {
		walls.push([[x,y],[x+1,y]]);
	    }
	}
	for (let x=0; x < this.width; x++) {
	    for (let y=0; y < this.height-1; y++) {
		walls.push([[x,y],[x,y+1]])
	    }
	}

	return walls;
    }

    // Clear the wall between the two cells.
    clear_wall_between(cell1, cell2) {
	this.check_xy(cell1);
	this.check_xy(cell2);
	let [x1, y1] = cell1;
	let [x2, y2] = cell2;
	let dist = Math.abs(x1-x2) + Math.abs(y1-y2);
	if (dist != 1) {
	    throw `[${cell1}] and [${cell2}] are not manhattan-adjacent`
	}

	if (x1>x2) { [x1,x2] = [x2,x1] };
	if (y1>y2) { [y1,y2] = [y2,y1] };
	if (x1<x2) {
	    this.verticals[y1][x2] = false;
	} else {
	    this.horizontals[y2][x1] = false;
	}
    }

    // Check that an X,Y coordinate is valid.
    check_xy(xy) {
	if (!this.valid_xy(xy)) throw `[${xy}] is out of range [0-${this.width-1},0-${this.height-1}]`;
    }

    // Return true if X,Y coordinate is in-range.
    valid_xy(xy) {
	let [x, y] = xy;
	return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Given an X,Y coordinate, return a (possibly out-of-range)
    // adjacent X,Y coordinate in a random cardinal direction.
    random_neighbor(xy) {
	let d = [[0,1], [0,-1], [1,0], [-1,0]][Math.floor(Math.random() * 4)];
	return [xy[0]+d[0], xy[1]+d[1]];
    }

    astext() {
	function joined(bools, t, f, fill) {
	    return bools.map((x) => x?t:f).join(fill);
	}

	let hs = this.horizontals.map(bools => '+' + joined(bools, '-', ' ', '+') + '+');
	let vs = this.verticals.map(bools => joined(bools, '|', ' ', ' '));
	let interleaved = [];
	vs.forEach((v,i) => interleaved.push(hs[i], v));
	interleaved.push(hs[hs.length-1]);
	return interleaved.join("\n");
    }

    render_as_lines(elem, tl, br, klass='wall') {
	let [left, top] = tl;
	let [right, bottom] = br;
	let xsize = (right-left) * 1.0/this.width;
	let ysize = (bottom-top) * 1.0/this.height;

	for (let y = 0; y <= this.height; y++) {
	    let draw = false;
	    let xstart = 0;
	    let ypos = top + y * ysize;
	    for (let x = 0; x < this.width; x++) {
		let xpos = left + x * xsize;
		if (this.horizontals[y][x]) {
		    if (!draw) {
			xstart = xpos;
			draw = true;
		    }
		} else {
		    if (draw) {
			line(xstart, ypos, xpos, ypos, klass, elem);
			draw = false;
		    }
		}
	    }
	    if (draw) {
		line(xstart, ypos, br[0], ypos, klass, elem);
	    }
	}

	for (let x = 0; x <= this.width; x++) {
	    let draw = false;
	    let ystart = 0;
	    let xpos = left + x * xsize;
	    for (let y = 0; y < this.height; y++) {
		let ypos = top + y * ysize;
		if (this.verticals[y][x]) {
		    if (!draw) {
			ystart = ypos;
			draw = true;
		    }
		} else {
		    if (draw) {
			line(xpos, ystart, xpos, ypos, klass, elem);
			draw = false;
		    }
		}
	    }
	    if (draw) {
		line(xpos, ystart, xpos, br[1], klass, elem);
	    }
	}

	return [
	    [left, top + (this.start+0.5) * ysize],
	    [right, top + (this.end+0.5) * ysize]
	];
    }
}

let height = 420;
let width = 420;
let MAZE_SIZE = [5,5];
let hborder = 90;
let vborder = 30;
const SVGNS = 'http://www.w3.org/2000/svg';

let mazes_div = document.getElementById('mazes');

for (let i=0; i < 6; i++) {
    let svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', width + hborder * 2);
    svg.setAttribute('height', height + vborder * 2);

    mazes_div.appendChild(svg);

    let m = new Maze(MAZE_SIZE[0], MAZE_SIZE[1]);
    m.build_by_joining_sets();
    m.set_random_start_end();
    // console.log(m.astext());
    let [startpos, endpos] = m.render_as_lines(svg, [hborder, vborder], [width+hborder, height+vborder]);

    let [left_image, right_images] = choose(image_pairs);
    let right_image = choose(right_images);

    image(left_image, startpos[0]-hborder, startpos[1]-hborder/2, hborder, svg);
    image(right_image, endpos[0], endpos[1]-hborder/2, hborder, svg);
}
// To embed an image:
// <image x="10" y="20" width="80" height="80" xlink:href="recursion.svg" />
