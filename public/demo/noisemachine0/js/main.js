
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
	lastX = 0,
	lastY = 0,
	barAlpha = 0,
	barColors = [],
	barColorIdx = 0,

	lastNoteIdx = 0,
	initialNoteY = 0,

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

		// our touchable space is 25 notes wide
		numNotes = 25;

		// bar colors
		barColors = [
			     [ 92, 253, 75 ],
			     [ 253, 75, 163 ],
			     [ 253, 230, 75 ],
			     [253, 121, 75 ],
			     [ 75, 172, 253 ],
			     [ 230, 253, 75 ]
			     ];

		surface = doc.querySelector('.surface');
		touchindicator = doc.querySelector('.touchindicator');

		// make some audio nodes
		nodes.filter = theAudioContext.createBiquadFilter();
		nodes.volume = theAudioContext.createGain();
		nodes.delay = theAudioContext.createDelay();
		nodes.feedbackGain = theAudioContext.createGain();

		noiseMachine.drawInit();

		// respond to mouse and touch
		surface.addEventListener('touchstart', noiseMachine.play, false);
		surface.addEventListener('touchmove', noiseMachine.effect, false);
		surface.addEventListener('touchend', noiseMachine.stop, false);

		surface.addEventListener('mousedown', noiseMachine.play, false);
		surface.addEventListener('touchcancel', noiseMachine.kill, false);
		surface.addEventListener('mousemove', noiseMachine.effect, false);
		surface.addEventListener('mouseup', noiseMachine.stop, false);

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
		barColorIdx = offset;
		return (baseOctave * 12) + scaleDegrees[offset];
	    },

	    getNoteFrequency: function (x, y) {
		var anchorFreq = 55; // base freq is a low A
		var noteWidth = surface.offsetWidth / numNotes;
		var noteIdx = noiseMachine.getBluesScale(Math.floor(x / noteWidth));

		if (noteIdx != lastNoteIdx) {
		    initialNoteY = y;
		}
		lastNoteIdx = noteIdx;

		var finalFreq = anchorFreq * Math.pow(2, (noteIdx / 12.0));
		var freqWithVibrato = finalFreq * (1 + 0.005 * (vibratoMagnitude * vibratoScalar));
		return freqWithVibrato;
	    },

	    // make rad frequencies for the filter
	    getFilterFrequency: function (y) {
		var distanceToDouble = surface.offsetHeight / 8;
		var finalFreq = 60 * Math.pow(2, y / distanceToDouble);

		var freqWithVibrato = finalFreq * (1 + 0.03 * (vibratoMagnitude * vibratoScalar));
		return freqWithVibrato;
	    },

	    // given a pageX and pageY, make our synth respond accordingly.
	    processTouch: function (pageX, pageY) {
		var x, y;

		x = pageX - surface.offsetLeft;
		y = pageY - surface.offsetTop;

		lastX = x; lastY = y;
		vibratoScalar = Math.abs(y - initialNoteY) / 100;

		source.frequency.linearRampToValueAtTime(noiseMachine.getNoteFrequency(x, y), theAudioContext.currentTime);
		nodes.filter.frequency.linearRampToValueAtTime(noiseMachine.getFilterFrequency(y), theAudioContext.currentTime);

		touchindicator.style.webkitTransform = touchindicator.style.MozTransform = touchindicator.style.msTransform = touchindicator.style.OTransform = touchindicator.style.transform = 'translate3d(' + x + 'px,' + y  + 'px, 0)';
	    },

	    // connect all the shit to all the other shit
	    route: function () {
		var doc = document;

		source = theAudioContext.createOscillator();

		source.type = "square";
		nodes.filter.type = "lowpass";
		nodes.filter.Q.value = 0.1;
		nodes.feedbackGain.gain.value = 0.3; // 0-1
		nodes.delay.delayTime.value = 0.5; // 0-1
		nodes.volume.gain.value = 0.4;

		source.connect(nodes.filter);
		nodes.filter.connect(nodes.volume);
		// nodes.filter.connect(nodes.delay); TODO do something with this
		// nodes.delay.connect(nodes.feedbackGain);
		// nodes.feedbackGain.connect(nodes.volume);
		// nodes.feedbackGain.connect(nodes.delay);

		nodes.volume.connect(theAudioContext.destination);
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

		if (isPlaying) { // TODO??
		    noiseMachine.kill();
		} else {
		    // start playing sound
		    noiseMachine.route();
		    lastNoteIdx = -1;
		    noiseMachine.processTouch(x, y);
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
		    noiseMachine.processTouch(x, y);
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
		    noiseMachine.processTouch(x, y);
		}
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

		// compute vibrato
		vibratoVelocity += (vibratoMagnitude * -0.33);
		vibratoMagnitude += vibratoVelocity;

		// assign params
		if (isPlaying) {
		    source.frequency.linearRampToValueAtTime(noiseMachine.getNoteFrequency(lastX, lastY), theAudioContext.currentTime);
		    nodes.filter.frequency.linearRampToValueAtTime(noiseMachine.getFilterFrequency(lastY), theAudioContext.currentTime);
		}

		// adjust bar alpha
		if (hasTouch || hasMouse)
		    barAlpha = 1;
		else
		    barAlpha *= 0.94;

		if (barAlpha > 0.05) {
		    var colorScale = 0.4 + (0.6 * (lastY / surface.offsetHeight));
		    var colorValues = [
				       Math.floor(barColors[barColorIdx][0] * colorScale * barAlpha),
				       Math.floor(barColors[barColorIdx][1] * colorScale * barAlpha),
				       Math.floor(barColors[barColorIdx][2] * colorScale * barAlpha)
				       ];
		    context.fillStyle = rgbToHex(colorValues[0], colorValues[1], colorValues[2]);

		    var barWidth = canvas.width / numNotes;
		    var barIndex = Math.floor(lastX / barWidth);
		    var barFatness = vibratoMagnitude * vibratoScalar * 1;

		    context.fillRect((barIndex * barWidth) - barFatness, 0, barWidth + (barFatness * 2), surface.offsetHeight);
		}
	    }
	};
    }());

window.addEventListener("DOMContentLoaded", noiseMachine.init, true);