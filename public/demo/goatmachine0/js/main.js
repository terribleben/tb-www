/**
 *  Goat machine: Formant synthesis + goat.
 *  terribleben.com
 */


// util

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// the goat machine

var goatMachine = (function () {

	'use strict';

	var surface,
	touchindicator,
	source,
	nodes = {},
	numFilters = 6,    
	theAudioContext,
	formants = [
	    [ { F:700, BW:130 }, { F:1220, BW:70 }, { F:2500, BW:160 }, { F:3300, BW:250 }, { F:3750, BW:200 }, { F:4900, BW:1000 } ],
	    [ { F:310, BW:45 }, { F:2020, BW:200 }, { F:2960, BW:400 }, { F:3300, BW:250 }, { F:3750, BW:200 }, { F:4900, BW:1000 } ]
	],

	theDrawId,
	lastX = 0,
	lastY = 0,
	goatAlpha = 0,
	goatImage,

	vibratoScalar = 1,
	vibratoMagnitude = 1,
	vibratoVelocity = 0,

	hasTouch = false,
	hasMouse = false,
	isSmallViewport = false,
	isPlaying = false;

	return {

	    init: function () {
		var doc = document;

		// grab that audio context
		if ('AudioContext' in window) {
		    theAudioContext = new AudioContext();
		} else if ('webkitAudioContext' in window) {
		    theAudioContext = new webkitAudioContext();
		} else {
		    alert('No goats in this browser. :(');
		    return;
		}

		// adjust to small viewport if necessary
		if (window.matchMedia) {
		    isSmallViewport = window.matchMedia("(max-width: 512px)").matches ? true : false;

		    window.matchMedia("(max-width: 512px)").addListener(function (mql) {
			    if (mql.matches) {
				isSmallViewport = true;
			    } else {
				isSmallViewport = false;
			    }
			});
		}

		surface = doc.querySelector('.surface');
		touchindicator = doc.querySelector('.touchindicator');

		goatImage = document.getElementById('goat');

		// make some audio nodes
		nodes.filters = [];
		nodes.gains = [];
		for (var ii = 0; ii < numFilters; ii++) {
		    var filter = theAudioContext.createBiquadFilter();
		    filter.type = "bandpass";
		    nodes.filters.push(filter);
		    
		    var gain = theAudioContext.createGain();
		    nodes.gains.push(gain);
		}
		    
		goatMachine.drawInit();
		goatMachine.setup();

		// respond to mouse and touch
		surface.addEventListener('touchstart', goatMachine.play, false);
		surface.addEventListener('touchmove', goatMachine.effect, false);
		surface.addEventListener('touchend', goatMachine.stop, false);

		surface.addEventListener('mousedown', goatMachine.play, false);
		surface.addEventListener('touchcancel', goatMachine.kill, false);
		surface.addEventListener('mousemove', goatMachine.effect, false);
		surface.addEventListener('mouseup', goatMachine.stop, false);

		doc.querySelector('.surface').addEventListener('touchmove', function (e) {
			e.preventDefault(); // in the case of both mouse and touch
		    });

		doc.addEventListener('webkitvisibilitychange', goatMachine.handleVisibilityChange, false);
		doc.addEventListener('mozvisibilitychange', goatMachine.handleVisibilityChange, false);
		doc.addEventListener('msvisibilitychange', goatMachine.handleVisibilityChange, false);
		doc.addEventListener('ovisibilitychange', goatMachine.handleVisibilityChange, false);
		doc.addEventListener('visibilitychange', goatMachine.handleVisibilityChange, false);
	    },

	    handleVisibilityChange: function () {
		var doc = document;
		if (doc.hidden || doc.webkitHidden || doc.mozHidden || doc.msHidden || doc.oHidden) {
		    // do some stuff
		}
	    },

	    getNoteFrequency: function (x, y) {
		var anchorFreq = 110;
		var noteIdx = (x / surface.offsetWidth) * 24;

		var finalFreq = anchorFreq * Math.pow(2, (noteIdx / 12.0));
		var freqWithVibrato = finalFreq * (1 + 0.015 * (vibratoMagnitude * vibratoScalar));
		return freqWithVibrato;
	    },

	    // make rad frequencies for the given filter
	    getFilterFrequency: function (y, filterIdx) {
		var topValue = formants[0][filterIdx].F;
		var bottomValue = formants[1][filterIdx].F;
		var finalFreq = topValue + ((y / surface.offsetHeight) * (bottomValue - topValue));

		var freqWithVibrato = finalFreq * (1 + 0.15 * (vibratoMagnitude * vibratoScalar));
		return freqWithVibrato;
	    },

	    // make rad Q for the given filter
	    getFilterQ: function (y, filterIdx, filterFreq) {
		var topValue = formants[0][filterIdx].BW;
		var bottomValue = formants[1][filterIdx].BW;
		var finalBW = topValue + ((y / surface.offsetHeight) * (bottomValue - topValue));

		return filterFreq / (finalBW / 2);
	    },

	    updateAudioParams: function(x, y) {
		source.frequency.linearRampToValueAtTime(goatMachine.getNoteFrequency(x, y), theAudioContext.currentTime);
		for (var ii = 0; ii < numFilters; ii++) {
		    nodes.filters[ii].frequency.linearRampToValueAtTime(goatMachine.getFilterFrequency(y, ii), theAudioContext.currentTime);
		    nodes.filters[ii].Q.linearRampToValueAtTime(goatMachine.getFilterQ(y, ii, nodes.filters[ii].frequency.value), theAudioContext.currentTime);
		}
	    },

	    // given a pageX and pageY, make our synth respond accordingly.
	    processTouch: function (pageX, pageY) {
		var x, y;

		x = pageX - surface.offsetLeft;
		y = pageY - surface.offsetTop;

		lastX = x; lastY = y;

		goatMachine.updateAudioParams(x, y);

		touchindicator.style.webkitTransform = touchindicator.style.MozTransform = touchindicator.style.msTransform = touchindicator.style.OTransform = touchindicator.style.transform = 'translate3d(' + x + 'px,' + y  + 'px, 0)';
	    },

	    // connect all the shit to all the other shit
	    route: function () {
		var doc = document;

		source = theAudioContext.createOscillator();
		source.type = "sawtooth";

		for (var ii = 0; ii < numFilters; ii++) {
		    source.connect(nodes.filters[ii]);
		}
	    },

	    // get our main audio node tree worked out
	    setup: function() {
		var output = theAudioContext.createGain();
		output.gain.value = 1;
		output.connect(theAudioContext.destination);
		
		for (var ii = 0; ii < numFilters; ii++) {
		    nodes.filters[ii].type = "bandpass";
		    nodes.gains[ii].gain.value = 0.4;
		    nodes.filters[ii].connect(nodes.gains[ii]);
		    nodes.gains[ii].connect(output);
		}
	    },

	    play: function (e) {
		//  only one at a time for now
		if (hasTouch || hasMouse)
		    return;

		var x = 0, y = 0;

		// register stop/kill events
		if (e.type === 'touchstart') {
		    hasTouch = true;
		    if (e.changedTouches && e.changedTouches.length) {
			x = e.changedTouches[0].pageX;
			y = e.changedTouches[0].pageY;
		    } else {
			x = e.pageX;
			y = e.pageY;
		    }
		} else if (e.type === 'mousedown') {
		    hasMouse = true;
		    x = e.pageX;
		    y = e.pageY;
		}

		if (isPlaying) {
		    goatMachine.kill();
		} else {
		    // start playing sound
		    goatMachine.route();
		    goatMachine.processTouch(x, y);
		    source.start(0);
		    isPlaying = true;

		    touchindicator.classList.add('active');
		}
	    },

	    stop: function (e) {
		var x = e.pageX, y = e.pageY;

		// clear our stop/kill listeners
		if (hasTouch && e.type === 'touchend') {
		    hasTouch = false;
		    if (e.changedTouches && e.changedTouches.length) {
			x = e.changedTouches[0].pageX;
			y = e.changedTouches[0].pageY;
		    } else {
			x = e.pageX;
			y = e.pageY;
		    }
		} else if (hasMouse && e.type === 'mouseup') {
		    hasMouse = false;
		    x = e.pageX;
		    y = e.pageY;
		}

		// stop making sound
		if (isPlaying) {
		    goatMachine.processTouch(x, y);
		    source.stop(0);
		    isPlaying = false;
		}

		touchindicator.classList.remove('active');
	    },

	    kill: function () {
		// just end everything
		if (isPlaying) {
		    source.stop(0);
		}

		touchindicator.classList.remove('active');

		hasTouch = false;
		hasMouse = false;
		isPlaying = false;
	    },

	    effect: function (e) {
		if (isPlaying) {
		    var x, y;
		    if (e.changedTouches && e.changedTouches.length) {
			x = e.changedTouches[0].pageX;
			y = e.changedTouches[0].pageY;
		    } else {
			x = e.pageX;
			y = e.pageY;
		    }
		    goatMachine.processTouch(x, y);
		}
	    },

	    // request animation frame => our draw method
	    drawInit: function () {
		theDrawId = requestAnimationFrame(goatMachine.drawInit, document.querySelector('canvas'));
		goatMachine.draw();
	    },

	    // draw some goats
	    draw: function() {
		var canvas = document.querySelector('canvas'),
		    context = canvas.getContext('2d');

		canvas.width = surface.offsetWidth;
		canvas.height = surface.offsetHeight;

		context.clearRect(0, 0, canvas.width, canvas.height);

		// compute vibrato
		vibratoVelocity += (vibratoMagnitude * -0.33);
		vibratoMagnitude += vibratoVelocity;

		// assign params
		if (isPlaying) {
		    goatMachine.updateAudioParams(lastX, lastY);
		}

		// adjust goat alpha
		if (hasTouch || hasMouse)
		    goatAlpha = 1;
		else
		    goatAlpha *= 0.75;

		if (goatAlpha > 0.05) {
		    context.globalAlpha = goatAlpha;
		    
		    // draw a crazy triangle
		    var angle = Math.PI * 2 * Math.random();
		    var radius = Math.max(canvas.width, canvas.height);
		    context.beginPath();
		    context.moveTo(lastX, lastY);
		    context.lineTo(lastX + radius * Math.cos(angle), lastY + radius * Math.sin(angle));
		    context.lineTo(lastX + radius * Math.cos(angle + 0.1), lastY + radius * Math.sin(angle + 0.1));
		    context.closePath();
		    context.fillStyle = "red";
		    context.fill();
		    
		    var goatBaseSize = canvas.width * 0.08;
		    var goatScale = 0.97 + (vibratoMagnitude * vibratoScalar * 0.06);

		    context.translate(
			lastX - (goatImage.width * 0.5 * goatScale),
			lastY - (goatImage.height * 0.5 * goatScale)
		    );
		    context.scale(goatScale, goatScale);
			
		    context.drawImage(goatImage, 0, 0);

		    context.resetTransform();
		}
	    }
	};
    }());

window.addEventListener("DOMContentLoaded", goatMachine.init, true);
