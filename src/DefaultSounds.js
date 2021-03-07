class DefaultSounds {
    bank1 = [
        {file: 'tom1.wav', name: 'Tom-Tom Drum 1'},
        {file: 'tom2.wav', name: 'Tom-Tom Drum 2'},
        {file: 'clap1.wav', name: 'Clap'},
        {file: 'snare1.wav', name: 'Snare Drum 1'},
        {file: 'snare2.wav', name: 'Snare Drum 2'},
        {file: 'dscoh1.mp3', name: 'Open/Close HiHat'},
        {file: 'kick1.wav', name: 'Kick Drum 1'},
        {file: 'kick2.wav', name: 'Kick Drum 2'},
        {file: 'clhat1.wav', name: 'Closed HiHat'}
    ];
    
    bank2 = [
        {file: 'tom3.wav', name: 'Tom-Tom Drum 3'},
        {file: 'snare3.wav', name: 'Snare Drum 3'},
        {file: 'depthCharge.wav', name: 'Depth Charge'},
        {file: 'woodBlock.wav', name: 'Wood Block'},
        {file: 'revCrash.wav', name: 'Reverse Crash'},
        {file: 'electroBeat1.wav', name: 'Electronic Pulse'},
        {file: 'kick3.wav', name: 'Kick Drum 3'},
        {file: 'rp4kick1.mp3', name: 'Kick Drum 4'},
        {file: 'cowbell1.wav', name: 'Electronic Cowbell'}
    ];

    constructor() {
        this.soundNamesArray = this._getSoundNamesArray();
    }

    get soundNames() {
        return this.soundNamesArray;
    }

    _getSoundNamesArray() {
        const array = [];
        this.bank1.forEach(sound => array.push(sound.name));
        this.bank2.forEach(sound => array.push(sound.name));
        array[18] = 'Click';
        return array;
    }
};

export default new DefaultSounds();