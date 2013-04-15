(function() {
	$('#gravitron').html('<canvas id="canvas" width="' + $('#gravitron').parent().width() + 
		'" height="' + $('#gravitron').parent().height() + '"></canvas>');

	var ctx = $('#canvas')[0].getContext("2d");
	var canvas = $('#canvas');

	var TWOPI = Math.PI * 2;

	var WIDTH = canvas.width();
	var HEIGHT = canvas.height();

	var COLORS = ['rgba(255, 255, 0, .7)', 'rgba(31, 48, 240, 0.7)', 'rgba(233, 15, 15, 0.74)'];

	var clear = function() {
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
	}

	var newBall = function(genX, genY, size, color) {
		
		var set_direction = function(pos, vel, max) {
			if((pos < 0 && vel < 0) || (pos > max && vel > 0)) {
				return -1;
			}
			else return 1;
		}

		var draw_circle = function(x, y, size, color) {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(x, y, size, 0, TWOPI, true);
			ctx.closePath();
			ctx.fill();
		} 

		return {
			x: genX,
			y: genY,
			dx: 0,
			dy: 0,
			size: size,
			color: color,
			draw: function() {
				this.dx *= set_direction(this.x, this.dx, WIDTH);
				this.dy *= set_direction(this.y, this.dy, HEIGHT);
				this.x += this.dx;
				this.y += this.dy;
				draw_circle(this.x, this.y, this.size, this.color);
			}
		};

	}


	var ballGenerator = (function () {

		var ball = undefined;

		return {
			//create a newBall
			init: function (x, y, color) {
				if(! ball) ball = newBall(x, y, 5, color);
			},
			//make the ball created by init larger and draw it.
			grow: function () {
				if(ball) {
					ball.size++;
					ball.draw();
				}
			},
			//return a copy of the ball, and delete the local version of it.
			get: function () {
				if(ball) {
					var temp = ball;
					ball = undefined;
					return temp;
				}
				else return undefined;
			}
		};

	}());


	// holds an array of planets (balls), generates gravity field, handles rendering
	var universe = (function () {

		var GRAVCONST = 10;  // gravitational constant.
		var MAXGRAV = 5;

		var planets = [];	//all planets (balls) active in the gravity system.
		
		//return object literal {dx, dy} from 1's perspective
		var calcGrav = function (x, y, m1, m2) {
			var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) + 0.1;
			var grav = GRAVCONST * m1 * m2 / Math.pow(distance, 2);
			if(grav > MAXGRAV) {
				grav = MAXGRAV;
			}
			//normalize direction vector into a unit vector.
			var x = grav * x / distance;
			var y = grav * y / distance;
			return { dx: x, dy: y };
		}

		return {

			addPlanet: function (ball) {
				planets.push(ball);
			},

			// apply gravity to each combination of planets
			gravity: function () {
				var i, j;
				var numPlanets = planets.length;
				var gravity;
				for(i = 0;  i < numPlanets;  i += 1) {
					for(j = 0;  j < i;  j += 1) {
						gravity = calcGrav(planets[i].x - planets[j].x,
						                   planets[i].y - planets[j].y,
						                   planets[i].size,
						                   planets[j].size);
						planets[i].dx += -1 * gravity.dx/planets[i].size;
						planets[i].dy += -1 * gravity.dy/planets[i].size;
						planets[j].dx += gravity.dx/planets[j].size;
						planets[j].dy += gravity.dy/planets[j].size;
					}
				}
			},

			//delete all planets
			reset: function () {
				planets = [];
			},

			//draw all planets
			render: function () {
				var i;
				var numPlanets = planets.length;
				for (i=0;  i< numPlanets;  i++) {
					planets[i].draw();
				}
			}
		};

	}());

	//turns the game processing on and off.
	var manager = (function () {
		var intervalId;

		var refresh = function () {
			clear();
			ballGenerator.grow();
			universe.gravity();
			universe.render();
		}

		return {
			active: false,
			start: function () {
				intervalId = setInterval(refresh, 16);
				this.active = true;
			},
			stop: function () {
				universe.reset();
				clear();
				clearInterval(intervalId);
				this.active = false;
			}
		};

	}());

	
	
	//get mouse position, cross browser compatability
	function getPosition(e) {
		//this section is from http://www.quirksmode.org/js/events_properties.html
		var targ;
		if (!e) e = window.event;
		if (e.target) targ = e.target;
		else if (e.srcElement) targ = e.srcElement;
		if (targ.nodeType == 3) targ = targ.parentNode;

		var x = e.pageX - $(targ).offset().left;
		var y = e.pageY - $(targ).offset().top;

		return {"x": x, "y": y};
	};

	//Controller Bindings.

	// start the generation of a new ball where the user clicked.
	canvas.mousedown(function (e) {
		// start game processing if not allready on.
		if(! manager.active) {
			manager.start();
		}
		var pos = getPosition(e);
		ballGenerator.init(pos.x, pos.y, COLORS[Math.floor(Math.random() * COLORS.length)]);
	});

	//stop the generation of the ball created on mousedown.
	//add this new ball to the universe.
	canvas.mouseup(function () {
		var ball = ballGenerator.get();
		if(ball) {
			universe.addPlanet(ball);
		}
	});

	//clear screen and stop game processing
	$('#reset').click(function () {
		if(manager.active){
			universe.reset();
			manager.stop();
		}
	});
}());
