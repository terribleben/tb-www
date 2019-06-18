
// util

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// the noise machine

var noiseMachine = (function () {

	'use strict';

	var surface,
	touchindicator,
	source,
	nodes = {},
	theAudioContext,

	theDrawId,
	numNotes,

	noteValues = [],
	wheelAngle = 0,
	wheelVelocity = 0,
	lastActiveNoteIndex = 0,
	isPlaying = false,

	hasTouch = false,
	hasMouse = false,
	isSmallViewport = false;

	return {

	    init: function () {
		var doc = document;

		// grab that audio context
		if ('AudioContext' in window) {
		    theAudioContext = new AudioContext();
		} else if ('webkitAudioContext' in window) {
		    theAudioContext = new webkitAudioContext();
		} else {
		    alert('No web audio in this browser. :(');
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

		// our wheel contains 16 slots
		numNotes = 16;
		for (var ii = 0; ii < numNotes; ii++) {
		    noteValues[ii] = 0;
		}

		// bar colors

		surface = doc.querySelector('.surface');
		touchindicator = doc.querySelector('.touchindicator');

		// make some audio nodes
		nodes.filter = theAudioContext.createBiquadFilter();
		nodes.volume = theAudioContext.createGainNode(); // safari

		noiseMachine.drawInit();

		// respond to mouse and touch
		surface.addEventListener('touchstart', noiseMachine.touchBegin, false);
		surface.addEventListener('touchmove', noiseMachine.touch, false);
		surface.addEventListener('touchend', noiseMachine.touchEnd, false);
		surface.addEventListener('touchcancel', noiseMachine.touchEnd, false);
		surface.addEventListener('mousedown', noiseMachine.touchBegin, false);
		surface.addEventListener('mousemove', noiseMachine.touch, false);
		surface.addEventListener('mouseup', noiseMachine.touchEnd, false);

		doc.querySelector('.surface').addEventListener('touchmove', function (e) {
			e.preventDefault(); // in the case of both mouse and touch
		    });

		doc.addEventListener('webkitvisibilitychange', noiseMachine.handleVisibilityChange, false);
		doc.addEventListener('mozvisibilitychange', noiseMachine.handleVisibilityChange, false);
		doc.addEventListener('msvisibilitychange', noiseMachine.handleVisibilityChange, false);
		doc.addEventListener('ovisibilitychange', noiseMachine.handleVisibilityChange, false);
		doc.addEventListener('visibilitychange', noiseMachine.handleVisibilityChange, false);
	    },

	    handleVisibilityChange: function () {
		var doc = document;
		if (doc.hidden || doc.webkitHidden || doc.mozHidden || doc.msHidden || doc.oHidden) {
		    // do some stuff
		}
	    },

	    // make rad frequencies for the synth
	    getBluesScale: function (chromatic) {
		var scaleDegrees = [ 0, 3, 5, 6, 7, 10 ];
		var baseOctave = Math.floor(chromatic / scaleDegrees.length);
		var offset = chromatic - (baseOctave * scaleDegrees.length);
		return (baseOctave * 12) + scaleDegrees[offset];
	    },

	    getNoteFrequency: function (noteValue) {
		var anchorFreq = 55; // base freq is a low A
		var noteIdx = noiseMachine.getBluesScale(noteValue);

		return anchorFreq * Math.pow(2, (noteIdx / 12.0));
	    },

	    // make rad frequencies for the filter
	    getFilterFrequency: function (y) {
		var distanceToDouble = surface.offsetHeight / 8;
		var finalFreq = 60 * Math.pow(2, y / distanceToDouble);

		return finalFreq;
	    },

	    // given a pageX and pageY, make our synth respond accordingly.
	    processTouch: function (pageX, pageY) {
		var x, y;

		x = pageX - surface.offsetLeft;
		y = pageY - surface.offsetTop;

		touchindicator.style.webkitTransform = touchindicator.style.MozTransform = touchindicator.style.msTransform = touchindicator.style.OTransform = touchindicator.style.transform = 'translate3d(' + x + 'px,' + y  + 'px, 0)';

		var centerX = surface.offsetWidth * 0.5, centerY = surface.offsetHeight * 0.5;
		var angle = Math.atan2(y - centerY, x - centerX) - wheelAngle;
		var distance = Math.sqrt((y - centerY) * (y - centerY) + (x - centerX) * (x - centerX));
		var maxDim = Math.min(surface.offsetWidth, surface.offsetHeight) * 0.5, innerRadius = maxDim * 0.4, outerRadius = (maxDim * 0.9);

		angle -= (Math.PI * 2.0) / (numNotes * 2.0); // offset by 1/2 a note
		while (angle < 0)
		    angle += Math.PI * 2.0;
		var noteValue = 0;
		if (distance >= innerRadius)
		    noteValue = Math.min(9, Math.floor(((distance - innerRadius) / (outerRadius - innerRadius)) * 10));
		var noteSector = (numNotes - 1) - (Math.floor((angle / (Math.PI * 2.0)) * numNotes));
		noteValues[noteSector] = noteValue;
	    },

	    // as the wheel rotates, change the node params to play the right notes.
	    wheelChanged: function() {
		var activeNoteIndex = Math.floor((wheelAngle / (Math.PI * 2.0)) * numNotes);
		if (activeNoteIndex != lastActiveNoteIndex) {
		    var noteValue = noteValues[activeNoteIndex];
		    if (noteValue > 0) {
			// play a note
			nodes.volume.gain.linearRampToValueAtTime(0.4, theAudioContext.currentTime);
			source.frequency.linearRampToValueAtTime(noiseMachine.getNoteFrequency(noteValue - 1), theAudioContext.currentTime);
		    } else {
			// no note here. stop making noise
			nodes.volume.gain.linearRampToValueAtTime(0, theAudioContext.currentTime);
		    }
		    lastActiveNoteIndex = activeNoteIndex;
		}
	    },

	    // connect all the shit to all the other shit
	    route: function () {
		var doc = document;

		source = theAudioContext.createOscillator();

		source.type = 1; // square
		nodes.filter.type = 0; // lowpass
		nodes.filter.Q.value = 0.1;
		nodes.filter.frequency.value = 14000;
		nodes.volume.gain.value = 0;

		source.connect(nodes.filter);
		nodes.filter.connect(nodes.volume);

		nodes.volume.connect(theAudioContext.destination);
	    },

	    touchBegin: function(e) {
		var shouldStart = false;
		if (e.type === 'touchstart' && !hasTouch) {
		    hasTouch = true;
		    shouldStart = true;
		}
		if (e.type === 'mousedown' && !hasMouse) {
		    hasMouse = true;
		    shouldStart = true;
		}

		if (shouldStart) {
		    var x = 0, y = 0;
		    if (e.type === 'touchstart') {
			if (e.changedTouches && e.changedTouches.length) {
			    x = e.changedTouches[0].pageX;
			    y = e.changedTouches[0].pageY;
			} else {
			    x = e.pageX;
			    y = e.pageY;
			}
		    } else if (e.type === 'mousedown') {
			x = e.pageX;
			y = e.pageY;
		    }
		    var surfaceX = x - surface.offsetLeft, surfaceY = y - surface.offsetTop;
		    if (surfaceX < 120 && surfaceY < 70) {
			isPlaying = !isPlaying;
			if (isPlaying) {
			    noiseMachine.play();
			    noiseMachine.wheelChanged();
			} else {
			    noiseMachine.stop();
			}
		    }
		} else {
		    touchindicator.classList.add('active');
		    noiseMachine.touch(e);
		}
	    },

	    touch: function(e) {
		var x = 0, y = 0;

		if (e.type === 'touchstart' || e.type === 'touchmove') {
		    if (e.changedTouches && e.changedTouches.length) {
			x = e.changedTouches[0].pageX;
			y = e.changedTouches[0].pageY;
		    } else {
			x = e.pageX;
			y = e.pageY;
		    }
		} else if (e.type === 'mousedown' || e.type === 'mousemove') {
		    x = e.pageX;
		    y = e.pageY;
		}

		if (hasTouch || hasMouse) {
		    noiseMachine.processTouch(x, y);
		}
	    },

	    touchEnd: function(e) {
		if (hasTouch && e.type === 'touchend' || e.type === 'touchcancel') {
		    hasTouch = false;
		} else if (hasMouse && e.type === 'mouseup') {
		    hasMouse = false;
		}
		touchindicator.classList.remove('active');
	    },

	    play: function (e) {
		if (theAudioContext.activeSourceCount > 0) {
		    noiseMachine.kill();
		} else {
		    // start playing sound
		    noiseMachine.route();
		    // source.start(0); safari
		    source.noteOn(0);
		}
	    },

	    stop: function (e) {
		// stop making sound
		if (theAudioContext.activeSourceCount > 0) {
		    // source.stop(0); safari
		    nodes.volume.gain.linearRampToValueAtTime(0, theAudioContext.currentTime);
		    source.noteOff(0);
		}
	    },

	    kill: function () {
		// just end everything
		if (theAudioContext.activeSourceCount > 0) {
		    // source.stop(0); safari
		    source.noteOff(0);
		}

		hasTouch = false;
		hasMouse = false;
	    },

	    // request animation frame => our draw method
	    drawInit: function () {
		theDrawId = requestAnimationFrame(noiseMachine.drawInit, document.querySelector('canvas'));
		noiseMachine.draw();
	    },

	    // draw some stuff
	    draw: function() {
		var canvas = document.querySelector('canvas'),
		    context = canvas.getContext('2d');

		canvas.width = surface.offsetWidth;
		canvas.height = surface.offsetHeight;

		context.clearRect(0, 0, canvas.width, canvas.height);

		// draw on / off switch
		if (isPlaying) {
		    context.fillStyle = rgbToHex(150, 150, 150);
		    context.fillRect(10, 10, 50, 50);
		    context.fillStyle = rgbToHex(150, 255, 150);
		    context.fillRect(70, 10, 50, 50);
		} else {
		    context.fillStyle = rgbToHex(255, 150, 150);
		    context.fillRect(10, 10, 50, 50);
		    context.fillStyle = rgbToHex(150, 150, 150);
		    context.fillRect(70, 10, 50, 50);
		}

		// draw wheel
		var angleInc = Math.PI * (2.0 / numNotes);
		var maxDim = Math.min(surface.offsetWidth, surface.offsetHeight) * 0.5, innerRadius = maxDim * 0.4, radiusInc = (maxDim * 0.5) / 10.0;
		var centerX = surface.offsetWidth * 0.5, centerY = surface.offsetHeight * 0.5;

		context.translate(centerX, centerY);
		context.rotate(wheelAngle);
		for (var ii = 0; ii < numNotes; ii++) {
		    var radius = innerRadius + noteValues[ii] * radiusInc;
		    context.fillStyle = rgbToHex(Math.floor((noteValues[ii] / 9) * 235) + 20, 0, 0);
		    context.fillRect(-20, -20, radius, 40);
		    context.rotate(-angleInc);
		}

		// draw wheel center
		context.fillStyle = '#000000';
		context.beginPath();
		context.arc(0, 0, innerRadius, 0, Math.PI * 2.0);
		context.fill();

		// spin wheel
		var wheelVelocityGoal = (isPlaying) ? 0.1 : 0;
		wheelVelocity += (wheelVelocityGoal - wheelVelocity) * 0.2;

		if (wheelVelocity > 0) {
		    wheelAngle += wheelVelocity;
		    if (wheelAngle > Math.PI * 2.0)
			wheelAngle -= Math.PI * 2.0;
		    noiseMachine.wheelChanged();
		}
	    }
	};
    }());

window.addEventListener("DOMContentLoaded", noiseMachine.init, true);