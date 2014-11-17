/*
 * Isomorphic keyboard player class.
 * 
 * 
 * created by Piers Titus van der Torren, 2010 - http://www.toverlamp.org/static/wickisynth/
 * 
 * Changelog
 *  2010-10-28: added key repeat array for disabling key repeat.
 *              Previous versions of FF4 for linux didn't have key repeat on keyDown, but since now they have it.
 */
Keyboard = function Keyboard(document, notePlayListener, noteStopListener, noteSustainListener) {
	this.repeat = [];

	this.document = document;
	this.notePlayListener = notePlayListener;
	this.noteStopListener = noteStopListener;
	this.noteSustainListener = noteSustainListener;
	
	this.octave = 0;
	this.generator = [700,1200]; // fifth and octave, in cents. Default is 12tet tuning
	this.baseFreq = 293.66; // D3 (or Re)

	// wicki key layout
	this.keyMap = {
		'Z': [-9,4],
		'X': [-7,3],
		'C': [-5,2],
		'V': [-3,1],
		'B': [-1,0],
		'N': [1,-1],
		'M': [3,-2],

		'A': [-10,5],
		'S': [-8,4],
		'D': [-6,3],
		'F': [-4,2],
		'G': [-2,1],
		'H': [0, 0],
		'J': [2,-1],
		'K': [4,-2],
		'L': [6,-3],
		';': [8,-4],

		'Q': [-11,6],
		'W': [-9,5],
		'E': [-7,4],
		'R': [-5,3],
		'T': [-3,2],
		'Y': [-1,1],
		'U': [1,0],
		'I': [3,-1],
		'O': [5,-2],
		'P': [7,-3],

		'1': [-12,7],
		'2': [-10,6],
		'3': [-8,5],
		'4': [-6,4],
		'5': [-4,3],
		'6': [-2,2],
		'7': [0,1],
		'8': [2,0],
		'9': [4,-1],
		'0': [6,-2],

		'q': [-11,7], // F2
		'r': [-9,6],  // F3
		's': [-7,5],  // F4
		't': [-5,4],  // F5
		'u': [-3,3],  // F6
		'v': [-1,2],  // F7
		'w': [1,1],  // F8
		'x': [3,0],  // F9
		'y': [5,-1],  // F10
		'z': [7,-2],  // F11
	};
	this.keyMap[ String.fromCharCode(188) ] = [5,-3]; // ','
	this.keyMap[ String.fromCharCode(190) ] = [7,-4]; // '.'
	this.keyMap[ String.fromCharCode(191) ] = [9,-5]; // '/'
	this.keyMap[ String.fromCharCode(219) ] = [9,-4]; // '['
	
	var that = this;
	this.document.addEventListener('keydown', function(event){
		that.keyDown.apply(that, arguments);
	}, false);
	this.document.addEventListener('keyup', function(event){
		that.keyUp.apply(that, arguments);
	}, false);
};

Keyboard.prototype.setGenerator = function(generator) {
	this.generator = generator;
};

Keyboard.prototype.keyDown = function(event) {	
	
	var keyId = String.fromCharCode(event.keyCode);
	//console.log('keyCode: ' + event.keyCode + ', keyId: ' + keyId);

	// disable key repeat
	if ( this.repeat[keyId] ) {
		return;
	}
	this.repeat[keyId] = true;
	
	loc = this.keyMap[keyId];

	if(loc) {
		event.preventDefault();
		var hz = this.baseFreq * Math.pow(2.0,((loc[1]+this.octave)*this.generator[1] + loc[0]*this.generator[0])/1200.0);
		var noteId = 'k'+loc[0] +'_' + (loc[1]+this.octave);
		this.notePlayListener({
			keyId:noteId,
			hz:hz,
			volume:1.0
		});
	}
	else
	{
	switch(event.keyCode){
		case 61: // +
			 this.octave++;
			 return;
		case 173: // -
			 this.octave--;
			 return;
		case 107: // keypad +
			 this.octave++;
			 return;
		case 109: // keypad -
			 this.octave--;
			 return;
		case 32: // ' '
			event.preventDefault();
			//this.noteSustainListener(true);
			this.noteSustainListener('switch');
			return;
	}
	}
};

Keyboard.prototype.keyUp = function(event) {
	var keyId = String.fromCharCode(event.keyCode);
	this.repeat[keyId] = false; // to disable key repeat
	//if (keyId == ' ') {
	//	this.noteSustainListener(false);
	//	return;
	//}
	
	loc = this.keyMap[keyId];

	if(loc) {
		var noteId = 'k'+loc[0] +'_' + (loc[1]+this.octave);
		this.noteStopListener({keyId:noteId});
	}
};


