import { set, get, del } from 'idb-keyval';
import Utils from './Utils';

class Sound {

    audioBuffer = null;
    bbDrumMachine = window.bbDrumMachine;
    gain_node = null;
    gain_value = 1;

    constructor() {
        this.gain_node = this.bbDrumMachine.audioContext.context.createGain();
        this.gain_node.gain.value = 1;
    }

    set gainNode(node) {
        this.gain_node = node;
        this.gain_node.gain.value = this.gain_value; 
    }

    set gain(gain) {
        this.gain_value = gain;
        this.gain_node.gain.value = this.gain_value;
    }

    get gain() {
        return this.gain_value;
    }

    refreshGainNode() {
        this.gain_node = this.bbDrumMachine.audioContext.context.createGain();
        this.gain_node.gain.value = this.gain_value;
    }

    // Used to load .wav files from saved zip file
    loadWav(arrayBuffer) {
        return new Promise(async (resolve, reject) => {
            try {
                this.audioBuffer = await this.bbDrumMachine.audioContext.decodeAudioData(arrayBuffer);
                resolve(`sound loaded`);
            }
            catch (err) {
                reject(`loadWav: Error decoding sound [${err}]`);
            }
        });
    }

    loadFromServer(soundFile) {
        return new Promise((resolve, reject) => {
            const sndFile = require(`./sounds/${soundFile}`);
            const request = new XMLHttpRequest();

            request.open('GET', sndFile, true);
            request.responseType = 'arraybuffer';

            request.onerror = () => {
                reject(`Error loading ${soundFile} from server [${request.statusText}]`);
            }

            request.onload = async () => {
                const audioData = request.response;

                if (request.status >= 400) {
                    reject(`Received error status ${request.status} loading ${soundFile} from server [${request.statusText}]`);
                    return;
                }

                // an error trying to store the Blob in local storage is
                // not catastrophic
                const dbkey = Utils.getDbKey(soundFile);
                try {
                    await set(dbkey, new Blob([audioData]));
                }
                catch (err) {
                    //window.bbDrumMachine.messages.add(`Error storing blob for ${dbkey} in IndexedDB [${err.message}]`);
                }
                
                try {
                    this.audioBuffer = await this.bbDrumMachine.audioContext.decodeAudioData(audioData);
                    resolve(`Successfully loaded ${soundFile} from server`);
                }
                catch (err) {
                    reject(`Could not decode audio data for ${soundFile} from server [${err}]`);
                }
            }

            request.send();
        });
    }    

    // Used to load the default sound file
    loadDefaultSoundFile(soundFile) {
        return new Promise(async (resolve, reject) => {
            const dbkey = Utils.getDbKey(soundFile);
            let useLocalStorage = false;
            let localFile;

            // check to see if we have this sound stored
            // on user's computer (in IndexedDB)
            try {
                localFile = await get(dbkey);
                if (localFile !== undefined) {
                    useLocalStorage = true;
                }
            }
            catch(err) {
                useLocalStorage = false;
                //window.bbDrumMachine.messages.add(`Error getting ${dbkey} from IndexedDB [${err}]`);
            }

            if (!useLocalStorage) {
                try {
                    const loadResult = await this.loadFromServer(soundFile);
                    resolve(loadResult);
                }
                catch (err) {
                    reject(err);
                }
            }
            else {
                try {
                    const loadResult = await this.loadFromIndexedDb(soundFile, localFile);
                    resolve(loadResult);
                }
                catch (err) {
                    del(dbkey);
                    try {
                        const serverResult = await this.loadFromServer(soundFile);
                        resolve(`Could not load ${dbkey} from IndexedDB: ${err}, loaded from server instead: ${serverResult}`);
                    }
                    catch (serverErr) {
                        reject(`Could not load ${dbkey} from IndexedDB: ${err} , and could not load ${soundFile} from server: ${serverErr}`);
                    }
                }
            }
        });
    }

    loadFromIndexedDb(soundFile, localFile) {
        const dbkey = Utils.getDbKey(soundFile);
        return new Promise(async (resolve, reject) => {
            let buffer;
            try {
                buffer = await localFile.arrayBuffer();
            }
            catch (err) {
                reject(`Could not load arrayBuffer for ${dbkey} from IndexedDB [${err}]`); 
                return;
            }

            try {
                this.audioBuffer = await this.bbDrumMachine.audioContext.decodeAudioData(buffer);
                resolve(`Successfully loaded ${dbkey} from IndexedDB`);
            }
            catch (err) {
                reject(`Could not decode audio data for ${dbkey} from IndexedDB [${err}]`);
            }
        });
    }

    // Used to load sound files from user's computer
    // (used in Pad 'Load' button)
    loadSoundFile(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = async () => {
                const arrayBuffer = fileReader.result;
                try {
                    this.audioBuffer = await this.bbDrumMachine.audioContext.decodeAudioData(arrayBuffer);
                    resolve(`${file} loaded`);
                }
                catch(err) {
                    reject(`Error decoding ${file} [${err}]`); 
                }
            };

            fileReader.onerror = () => {
                reject(fileReader.error);
            };

            fileReader.readAsArrayBuffer(file);
        });
    }

    get name() {
        return this.soundName;
    }

    set name(n) {
        this.soundName = n;
    }

    // play sound immediately
    play() {
        try {
            const bufferSource = this.bbDrumMachine.audioContext.context.createBufferSource();
            bufferSource.buffer = this.audioBuffer;
            bufferSource.connect(this.gain_node).connect(this.bbDrumMachine.audioContext.gainNode);
            bufferSource.start();
        }
        catch (err) {
            console.log(`Can't play sound [${err}]`);
        }
    }

    // used for scheduling sound into the future
    playAt(time) {
        try {
            const bufferSource = this.bbDrumMachine.audioContext.context.createBufferSource();
            bufferSource.buffer = this.audioBuffer;
            bufferSource.connect(this.gain_node).connect(this.bbDrumMachine.audioContext.gainNode);
            if (time === undefined || time === 0 || time === 'now') {
                bufferSource.start();
            }
            else if (typeof time === 'number') {
                bufferSource.start(time);
            }
        }
        catch (err) {
            console.log(`Can't play sound [${err}]`);   
        }
    }
}

export default Sound;