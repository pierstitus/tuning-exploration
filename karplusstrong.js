/*
 * Karplus Strong synthesizer class.
 * 
 * Generates polyphonic audio with a simple plucked string simulation, which gives a guitar like sound.
 *
 * Usage example: see simple.html
 * 
 * created by Piers Titus van der Torren, 2010 - http://www.toverlamp.org/static/wickisynth/
 * 
 * Changelog
 *  2010-09: first version
 *  2010-10: added sustain.
 */
KSPlayer = function KSPlayer(bufferSize, sampleRate) {
	this.bufferSize = bufferSize;
	this.sampleRate = sampleRate;
	this.releaseVolume = 0.0001;
	this.damp = 0.9;
	this.damp2= 1.0;
	this.noiseDamp = 0.5;

	this.sustain = false;

	this.signal = new Float32Array(bufferSize);

	// create buffers for resonators (for 16 voices)
	this.buffers = [];
	for (var i=0;i<16;i++) {
		this.buffers[i] = new Float32Array(2048);
	}

	this.polyphonyHolder = [];
	
	// Note playing states
	this.PLAYING = 0;
	this.RELEASING = 1;
};

KSPlayer.prototype.setSustain = function(sustain) {
	switch(sustain) {
		case true:
		case 'on':
			this.sustain = true;
			break;
		case false:
		case 'off':
			this.sustain = false;
			break;
		case 'switch':
			this.sustain = !this.sustain;
			break;
	}
}

KSPlayer.prototype.generate = function() {
	var periodIndex = 0;
	var previous = 0.0;
	var sub = 0.0;
	var damp = this.damp;
	for (var i = 0; i < this.bufferSize; i++) {
		this.signal[i] = 0.0; // Initial signal
		
		if(this.polyphonyHolder.length>0) {

			for(var j = 0; j < this.polyphonyHolder.length; j++){
				
				var note = this.polyphonyHolder[j];

				if(note.phase == this.RELEASING && !this.sustain){
					note.releaseVolume -= this.releaseVolume;
					if(note.releaseVolume < 0.0){
						note.releaseVolume = 0.0;
					}
				}

				note.periodIndex += note.inc;
				 
				if( note.periodIndex >= note.periodN ) // wrap around delay-line
				{
					note.periodIndex -= note.periodN;
					note.feedNoise = false;
				}

				periodIndex = Math.floor(note.periodIndex);
				sub = note.periodIndex - periodIndex;
				
				if (sub < note.inc) // generate a new sample if needed
				{
					damp = this.damp;
					if( note.feedNoise )
					{
						//var damp;
						if (note.periodIndex > note.periodN / 2) {
							//damp = note.periodIndex/note.periodN;
							note.period[ periodIndex ] = 1/this.noiseDamp * (Math.random() - Math.random()); // feed noise between -1 and +1
							damp *= this.noiseDamp;
						} else {
							//damp = 1-(note.periodIndex/note.periodN);
							// Experiment to make sound more periodic (without this there was a small high frequency component left)
							note.period[ periodIndex ] = note.period[ note.periodN - periodIndex ];
						}
						//note.period[ periodIndex ] = 1/this.noiseDamp * (Math.random() - Math.random()); // feed noise between -1 and +1
					}

					note.previous = note.current;
					note.current = (note.current + ( note.period[ periodIndex ] - note.current ) * damp) * this.damp2; // 1 pole lowpass (removing energy from the system)
				
					note.period[ periodIndex ] = note.current; // write feedback
				}

				// linear interpolation (since Karplus Strong originally only supports integer sampleRate/frequency factors)
				this.signal[i] += (sub * note.current + (1-sub) * note.previous) * note.volume * note.releaseVolume;
				//this.signal[i] += note.current * note.volume * note.releaseVolume;

			}
		} 
	}
	
	
	// Remove finished notes
	for(var j = 0; j < this.polyphonyHolder.length; j++){
		var note = this.polyphonyHolder[j];

		if (note.releaseVolume == 0.0) {
			this.buffers.push(note.period);
			this.polyphonyHolder.splice(j,1);	
		} 
	}	
	
	return this.signal;
};

KSPlayer.prototype.play = function(noteStopId, frequency, volume) {	
	// fact is the generating rate over playing rate.
	// To remove high overtones from low notes generate
	// a higher note and play it lower
	// (and it uses less buffer then)
	var fact = 1;
	if (frequency < 200)
	{
		fact = frequency/205 + 0.05;
	}

	var periodN = fact*this.sampleRate/frequency;

	// if the note is already playing reactivate it
	for(var j=0; j<this.polyphonyHolder.length; j++){
		if(this.polyphonyHolder[j].noteStopId == noteStopId){
			this.polyphonyHolder[j].phase = this.PLAYING;
			this.polyphonyHolder[j].feedNoise = true;
			this.polyphonyHolder[j].PeriodIndex = 0;
			this.polyphonyHolder[j].periodN = Math.floor(periodN),
			this.polyphonyHolder[j].inc = fact*Math.floor(periodN)/periodN,
			this.polyphonyHolder[j].releaseVolume = 1.0;
			this.polyphonyHolder[j].volume = volume;
			return;
		}
		
	}

	// now play the note if it fits in the buffer and
	// there is a buffer available.
	if (periodN < 2048 && this.buffers.length > 0) {
		var buffer = this.buffers.pop();
		this.polyphonyHolder.push({
			noteStopId: noteStopId,
			periodIndex: 0.0,
			periodN: Math.floor(periodN),
			period: buffer, //new Float32Array(periodN),
			feedNoise: true,
			previous: 0.0,
			current: 0.0,
			inc: fact*Math.floor(periodN)/periodN,
			volume: volume,
			phase: this.PLAYING,
			releaseVolume: 1.0
		});
	}
};

KSPlayer.prototype.stop = function(noteStopId) {
	for(var j=0; j<this.polyphonyHolder.length; j++){
	
		if(this.polyphonyHolder[j].noteStopId == noteStopId){
			this.polyphonyHolder[j].phase = this.RELEASING;
			break;
		}
		
	}
};
