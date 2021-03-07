//import scrollIntoView from 'scroll-into-view-if-needed';

class Utils {

    static setFocus(element) {
        element.focus();
        //scrollIntoView(element, {scrollMode: 'if-needed'});
    }

    static alertUser(title, message) {
        document.getElementById('my-accessible-dialog-title').innerText = title;
        document.getElementById('dialogContent').innerHTML = message;
        this.dialog.show();
    }

    static getSoundNameFromFile(filename) {
        filename = filename.replace(/\.wav$/, '');
        filename = filename.replace(/[-_]/, ' ');
        return filename;
    }

    static syncDrumTracksWithSoundMatrix() {

        const bbDrumMachine = window.bbDrumMachine;

        // clear all current active beats in drum track
        const activeBeats = document.getElementById('drumtracks').querySelectorAll('.beat[aria-pressed="true"]');
        activeBeats.forEach(function(beat) {
            const beatEl = document.getElementById(beat.id);
            beatEl.classList.remove('active');
            beatEl.setAttribute('aria-pressed', 'false');
        });

        for (let soundId=0; soundId<18; soundId++) {
            const drumTrack = bbDrumMachine.soundMatrix[soundId];
            drumTrack.forEach((beat, beatIndex) => {
                if (beat === 1) {
                    const bank = soundId < 9 ? 1 : 2;
                    const beatEl = document.getElementById(`beat_${bank}_${Utils.getPositionFromSoundId(soundId)}_${beatIndex+1}`);
                    beatEl.classList.add('active');
                    beatEl.setAttribute('aria-pressed', 'true');
                }
            });
        }
    }

    static getSoundId(bank, row, col) {
        return col + (row * 3) + ((bank-1) * 9);
    }

    static getSoundIdFromTarget(target) {
        if (target.classList.contains('pad')) {
            return Number(target.dataset.soundid);
        }
        let currTarget = target;
        for (let i = 0; i < 3; i++) {
            currTarget = currTarget.parentNode;
            if (currTarget.classList.contains('pad')) {
                return Number(currTarget.dataset.soundid);
            }
        }
        return undefined;
    }

    static powerOn() {
        return window.bbDrumMachine.power;
    }

    static stopEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    static getBankRowCol(id) {
        const [,bank,row,col] = id.split('_').map(i => Number(i));
        return [bank,row,col];
    }

    static getBankRowColBeat(id) {
        const [,bank,row,col,beat] = id.split('_').map(i => Number(i));
        return [bank,row,col,beat];
    }

    static setSoundMatrixBeat(soundId, beat, status) {
        if (status === 1) {
            window.bbDrumMachine.soundMatrix[soundId][beat-1] = 1;
        }
        else {
            window.bbDrumMachine.soundMatrix[soundId][beat-1] = 0;
        }
    }

    static getBankFromSoundId(id) {
        if (id < 9) {
            return 1;
        }
        return 2;
    }

    static getPositionFromSoundId(id) {
        if (id > 8) {
            id -= 9;
        }
        const row = (id < 3) ? 0 : (id < 6) ? 1 : 2;
        let col = 0;
        if (id === 1 || id === 4 || id === 7) {
            col = 1;
        }
        else if (id === 2 || id === 5 || id === 8) {
            col = 2;
        }
        return `${row}_${col}`;
    }

    // return the section that the event was triggered in
    static getSection(event) {
        const sectionIds = {
            'drumpads_wrap': 'drumpads',
            'sequencer_wrap': 'player',
            'drumtracks_section_wrap': 'drumtracks',
            'menu-appMenu': 'menu',
            'none': 'none'
        };

        let section = 'none', currElement = event.target;
        while (1) {
            if (!currElement) {
                return sectionIds[section];
            }
            const currElementId = currElement.id;
            if (currElementId === 'drum-machine' || currElementId === 'app_wrapper') {
                return sectionIds[section];
            }
            if (currElementId in sectionIds) {
                section = currElementId;
                break;
            }
            try {
                currElement = currElement.parentNode;
            }
            catch {
                return sectionIds[section];
            }
        }

        return sectionIds[section];
    }

    static isArrowKey(key) {
        if (key >= 37 && key <= 40) {
            return true;
        }
        return false;
    }

    static isDirectionKey(key) {
        if (key >= 33 && key <= 40) {
            return true;
        }
        return false;
    }

    static toggleDrumTrackBeat(beatTarget) {
        const [bank,row,col,beat] = Utils.getBankRowColBeat(beatTarget.id);
        const pressed = beatTarget.getAttribute('aria-pressed');
    
        if (pressed === 'false') {
            beatTarget.classList.add('active');
            beatTarget.setAttribute('aria-pressed', 'true');
            Utils.setSoundMatrixBeat(Utils.getSoundId(bank, row, col), beat, 1);
        }
        else {
            beatTarget.classList.remove('active');
            beatTarget.setAttribute('aria-pressed', 'false');
            Utils.setSoundMatrixBeat(Utils.getSoundId(bank, row, col), beat, 0);
        }
    }

    static togglePowerInput(event, setPower) {
        if (event.target.checked) {
            setPower(true);
        }
        else {
            setPower(false);
        }
    }

    static isKeyClick(keyCode) {
        if (keyCode === 13 || keyCode === 32) {
            return true;
        }
        return false;
    }

    static setVolumes(volumeArray) {
        volumeArray.forEach((volume, soundId) => {
            if (volume === undefined) {
                volume = 1;
            }
            const volumeId = `volume_${Utils.getBankFromSoundId(soundId)}_${Utils.getPositionFromSoundId(soundId)}`;
            document.getElementById(volumeId).value = volume;
            window.bbDrumMachine.sounds[soundId].gain = volume;
        });
    }

    static formatVolumeDisplay(value) {
        if (value < 0) {
            return String(value);
        }
        if (value === 0) {
            return String(`&#177;${value}`);
        }
        else {
            return String(`+${value}`);
        }
    }

    static getDbKey(str) {
        return str.replace(/[^a-zA-Z0-9]/, '').toLowerCase();
    }

    static currentBank() {
        return Number(document.getElementById('drum-machine').dataset.bank);
    }

    static clearDrumTrack(soundId) {
        // Earlier versions kept the click sound in the 
        // matrix and it was saved off to the zip. If we 
        // load a zip with the click sound in the matrix 
        // it will throw an error because it doesn't have 
        // a standard ID like the other tracks. We can just
        // catch it and ignore.
        let activeBeats;
        try {
            activeBeats = document.getElementById(`track_${soundId}`).querySelectorAll('.beat[aria-pressed="true"]');
        }
        catch(err) {
            console.log(`Utils.clearDrumTrack(${soundId}): ${err.message}`);
            return;
        }
        activeBeats.forEach(function(beat) {
            const beatEl = document.getElementById(beat.id);
            beatEl.classList.remove('active');
            beatEl.setAttribute('aria-pressed', 'false');
        });

        const trackMatrix = new Array(16).fill(0);
        window.bbDrumMachine.soundMatrix[soundId] = trackMatrix;
    }

    static clearAllDrumTracks() {
        window.bbDrumMachine.soundMatrix.forEach((matrix, soundId) => {
            Utils.clearDrumTrack(soundId);
        });
    }

    static storageAvailable(type) {
        let storage;
        try {
            storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch (e) {
            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                (storage && storage.length !== 0);
        }
    }
}

export default Utils;