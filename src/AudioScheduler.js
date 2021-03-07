import myWorker from './Scheduler.worker';
import React from 'react';

let isPlaying = false;
const timerWorker = new myWorker(); // Web Worker used to fire timer mesg
let unlocked = false;
let current16thNote = null; // What note is currently last scheduled
let nextNoteTime = 0.0;     // when the next note is due.
const lookahead = 25.0; //How often to call scheduling function (milliseconds)
const scheduleAheadTime = 0.1; // How far ahead to schedule audio (seconds)
let tempo = 0;
let playClick = false;

export default function AudioScheduler(props) {
    const bbDrumMachine = window.bbDrumMachine;

    tempo = Number(props.tempo);
    playClick = props.click;

    if (timerWorker.onmessage === null) {
        timerWorker.onmessage = event => {
            if (event.data === "tick") {
                scheduler();
            }
            else {
                console.log("message: " + event.data);
            }
        };
        timerWorker.postMessage({"interval": lookahead});
    }

    if (props.power === 'off') {
        stop();
    }
    if (props.power === 'on') {
        start();
    }

    function nextNote() {
        // Advance current note and time by a 16th note...
        // This picks up the CURRENT tempo value to calculate beat length
        const secondsPerBeat = 60.0 / tempo;

        // Add beat length to last beat time
        nextNoteTime += 0.25 * secondsPerBeat;
    
        // Advance the beat number, wrap to zero
        current16thNote++;
        if (current16thNote === 16) {
            current16thNote = 0;
        }

        bbDrumMachine.nextBeatTime[current16thNote] = nextNoteTime;
    }

    function scheduler() {
        // while there are notes that will need to play before the next
        // interval, schedule them and advance the pointer.
        //props.setActiveBeat(current16thNote+1);
        while (nextNoteTime < bbDrumMachine.audioContext.currentTime + scheduleAheadTime) {
            scheduleNote(current16thNote, nextNoteTime);
            nextNote(props);
        }
    }

    function scheduleNote(beatNumber, time) {
        for (let i=0; i<18; i++) {
            if (bbDrumMachine.soundMatrix[i][beatNumber] === 1) {
                bbDrumMachine.sounds[i].playAt(time);
            }
        }
        if (playClick) {
            switch(beatNumber) {
                case 0:
                case 4:
                case 8:
                case 12:
                    bbDrumMachine.clickSound.playAt(time);
                    break; // to make linter happy
                default:   
            }
        }
    }

    function start() {
        if (isPlaying) {
            return;
        }
        if (!unlocked) {
            // play silent buffer to unlock the audio
            const buffer = bbDrumMachine.audioContext.context.createBuffer(1, 1, 22050);
            const node = bbDrumMachine.audioContext.context.createBufferSource();
            node.buffer = buffer;
            node.start(0);
            unlocked = true;
        }
        current16thNote = 0;
        nextNoteTime = bbDrumMachine.audioContext.currentTime;
        timerWorker.postMessage("start");
        isPlaying = true;
    }

    function stop() {
        if (isPlaying) {
            timerWorker.postMessage("stop");
            isPlaying = false;
            return "play";
        }
    }

    return (
        <div id="audioScheduler" aria-hidden="true" data-tempo={tempo} data-power={props.power} data-click={props.click}></div>
    );
}
