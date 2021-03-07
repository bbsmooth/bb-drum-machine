import AudioContext from './AudioContext';
import Utils from './Utils';

/* https://artandlogic.com/2019/07/unlocking-the-web-audio-api/ */

class MacIosUnlock {

    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    start() {
        this._unlockAudio();
    }

    /**
     * Some browsers/devices will only allow audio to be played after 
     * a user interaction.
     * Attempt to automatically unlock audio on the first user 
     * interaction.
     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
     * Borrows in part from: https://github.com/goldfire/howler.js/blob/master/src/howler.core.js
     */
    _unlockAudio() {

        window.bbDrumMachine.iOSAudioContextUnlocked = false;

        // Scratch buffer to prevent memory leaks on iOS.
        // See: https://stackoverflow.com/questions/24119684/web-audio-api-memory-leaks-on-mobile-platforms
        const _scratchBuffer = this._audioCtx.createBuffer(1, 1, 22050);

        // We call this when user interaction will allow us to unlock
        // the audio API.
        const unlock = (e) => {
            const source = this._audioCtx.createBufferSource();
            source.buffer = _scratchBuffer;
            source.connect(this._audioCtx.destination);

            // Play the empty buffer.
            source.start(0);

            // Calling resume() on a stack initiated by user gesture is
            // what actually unlocks the audio on Chrome >= 55.
            if (typeof this._audioCtx.resume === 'function') {
                this._audioCtx.resume();
            }

            // Once the source has fired the onended event, indicating 
            // it did indeed play,
            // we can know that the audio API is now unlocked.
            source.onended = async () => {

                source.disconnect(0);

                if (window.bbDrumMachine.iOSAudioContextUnlocked) {
                    return;
                }

                window.bbDrumMachine.audioContext.close();

                try {
                    const status = await this._audioCtx.close();
                    window.bbDrumMachine.iOSAudioContextUnlocked = true;
                }
                catch (err) {
                    window.bbDrumMachine.messages.add(`Error closing temp AudioContext: ${err.message}`);
                }

                const newAudioContext = new AudioContext();
                window.bbDrumMachine.audioContext = newAudioContext;
                window.bbDrumMachine.sounds.forEach(sound => sound.refreshGainNode());

                const ALLOWED_CLASSES = new Set(['pad', 'name', 'keyWrap', 'key', 'not-allowed', 'not-allowed-img']);

                // if this was a drumpad
                if (ALLOWED_CLASSES.has(e.target.classList[0])) {
                    const soundId = Utils.getSoundIdFromTarget(e.target);
                    if (soundId !== undefined) {
                        window.bbDrumMachine.sounds[soundId].play();
                    }
                }

                // Remove the click/touch listeners.
                document.removeEventListener('touchstart', unlock, true);
                //document.removeEventListener('touchend', unlock, true);
                //document.removeEventListener('click', unlock, true);
            };
        };

        // Setup click/touch listeners to capture the first interaction
        // within this context.
        document.addEventListener('touchstart', unlock, true);
        //document.addEventListener('touchend', unlock, true);
        //document.addEventListener('click', unlock, true);
    }



}

export default MacIosUnlock;