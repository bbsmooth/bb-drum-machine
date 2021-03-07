class AudioContext {

    #audio_context = new (window.AudioContext || window.webkitAudioContext)();
    #gain_node = this.#audio_context.createGain();

    constructor() {
        this.#gain_node.gain.value = 1;
        this.#gain_node.connect(this.#audio_context.destination);
        //window.bbDrumMachine.messages.add('new AudioContext created');
    }

    get context() {
        return this.#audio_context;
    }

    get gainNode() {
        return this.#gain_node;
    }

    get gain() {
        return this.#gain_node.gain.value;
    }

    get currentTime() {
        return this.#audio_context.currentTime;
    }

    set gain(num) {
        this.#gain_node.gain.value = num;
    }

    decodeAudioData(audioData) {
        return new Promise((resolve, reject) => {
            // We have to call decodeAudioData with 3 args 
            // in order for this to work on iPhones
            this.#audio_context.decodeAudioData(audioData,
                decodedData => {
                    resolve(decodedData);
                },
                err => {
                    reject(`Error: ${err}`);
                }
            );
        });
    }

    close() {
        this.#audio_context.close();
    }
}

export default AudioContext;
