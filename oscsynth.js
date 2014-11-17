OscSynth = function OscSynth(context) {
	this.context = context;
	this.sustain = false;
	this.polyphonyHolder = [];
};

OscSynth.prototype.play = function(noteStopId, frequency, volume) {	
	if (this.polyphonyHolder[noteStopId] == undefined) {
		var oscillator = this.context.createOscillator();
		oscillator.type = 'sawtooth';
		oscillator.frequency.value = frequency; // value in hertz
		oscillator.connect(this.context.destination);
		oscillator.start();
		this.polyphonyHolder[noteStopId] = oscillator;
	}
};

OscSynth.prototype.stop = function(noteStopId) {
	if (this.polyphonyHolder[noteStopId] != undefined) {
		this.polyphonyHolder[noteStopId].disconnect();
		this.polyphonyHolder[noteStopId] = undefined;
	}
};
