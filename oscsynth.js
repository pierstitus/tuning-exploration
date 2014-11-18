/*
 * Simple sawtooth synthesizer class.
 *
 * Generates polyphonic audio with a sawtooth wave.
 *
 * created by Piers Titus van der Torren, 2014
 *
 * Changelog
 *  2014-15: first version
 *  2014-18: move frequency calculation from note coordinate to this class to allow dynamic changes
 */
 OscSynth = function OscSynth(context) {
	this.context = context;
	this.sustain = false;
	this.polyphonyHolder = {};

	this.generator = [700,1200]; // fifth and octave, in cents. Default is 12tet tuning
	this.baseFreq = 293.66; // D3 (or Re)
};

OscSynth.prototype.getFrequency = function(loc) {
	return this.baseFreq * Math.pow(2.0,(loc[1]*this.generator[1] + loc[0]*this.generator[0])/1200.0);
};

OscSynth.prototype.setGenerator = function(generator) {
	this.generator = generator;
	for (var i in this.polyphonyHolder) {
		this.polyphonyHolder[i].node.frequency.value = this.getFrequency(this.polyphonyHolder[i].loc);
	};
}

OscSynth.prototype.play = function(noteStopId, loc, volume) {
	if (this.polyphonyHolder[noteStopId] == undefined) {
		var hz = this.getFrequency(loc);
		var oscillator = this.context.createOscillator();
		oscillator.type = 'sawtooth';
		oscillator.frequency.value = hz; // value in hertz
		oscillator.connect(this.context.destination);
		oscillator.start();
		this.polyphonyHolder[noteStopId] = {node:oscillator, loc:loc};
	}
};

OscSynth.prototype.stop = function(noteStopId) {
	if (this.polyphonyHolder[noteStopId] != undefined) {
		this.polyphonyHolder[noteStopId].node.disconnect();
		delete this.polyphonyHolder[noteStopId];
	}
};
