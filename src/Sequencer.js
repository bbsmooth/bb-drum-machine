import React, { useState, useRef } from 'react';
import './Sequencer.css';
import SequencerCell from './SequencerCell';
import AudioScheduler from './AudioScheduler';
import Utils from './Utils';
import { useStoreValue } from 'react-context-hook';

let currentBeat = -1;
let beatListener = null;

const app_wrapper = document.getElementById('app_wrapper');

export default function Sequencer(props) {

    // local state (to be passed to audioScheduler)
    const [power, setPower] = useState("off");
    const [isSectionHidden, setSectionHidden] = useState(false);

    // global state
    const tempo = useStoreValue('tempo');
    const metronome = useStoreValue('metronome');

    const masterVolumeDisplayRef = useRef(null);
    const tempoSliderRef = useRef(null);
    const expandContractButton = useRef(null);

    function handleStartButton(event) {
        const target = event.target;
        const button_pressed = target.getAttribute('aria-pressed');
        if (button_pressed === 'true') {
            target.setAttribute('aria-pressed', 'false');
            setPower('off');
            stopBeatListener();
            target.innerHTML = 'Start <span class="visually-hidden">Sequencer</span>';
        }
        else {
            target.setAttribute('aria-pressed', 'true');
            setPower('on');
            startBeatListener();
            target.innerHTML = 'Stop <span class="visually-hidden">Sequencer</span>';
        }
        Utils.stopEvent(event);
    }

    function startBeatListener() {
        const bbDrumMachine = window.bbDrumMachine;
        if (beatListener !== null) {
            return;
        }
        beatListener = setInterval(() => {
            // if we are just starting out then immediately show the 
            // first beat tracker box as active
            if (currentBeat < 0) {
                //const array = new Array(16).fill(false);
                //array[0] = true;
                //setBeat(array);
                //bbDrumMachine.currentBeat = 1;
                app_wrapper.dataset.current_beat = 1;
                currentBeat = 0;
            }
            // otherwise, once we make it to the time of the next beat
            // (or just slightly after it) make the next beat tracker
            // box active
            else {
                const nextBeat = currentBeat < 15 ? currentBeat + 1 : 0;
                const currentTime = bbDrumMachine.audioContext.currentTime;
                if (currentTime >= bbDrumMachine.nextBeatTime[nextBeat]) {
                    //bbDrumMachine.currentBeat = nextBeat;
                    app_wrapper.dataset.current_beat = nextBeat+1;
                    //const array = new Array(16).fill(false);
                    //array[nextBeat] = true;
                    //setBeat(array);
                    currentBeat = nextBeat;
                }
            }
        }, 25);
    }

    function stopBeatListener() {
        if (beatListener === null) {
            return;
        }
        clearInterval(beatListener);
        beatListener = null;
        //const array = new Array(16).fill(false);
        //bbDrumMachine.currentBeat = 0;
        app_wrapper.dataset.current_beat = 0;
        //setBeat(array);
        currentBeat = -1;
    }

    function handleTempoChange(event) {
        props.setTempo(Number(tempoSliderRef.current.value));
        Utils.stopEvent(event);
    }

    function handleMasterVolumeInput(event) {
        const gain = event.target.value;
        window.bbDrumMachine.audioContext.gain = gain;
        const volumeDisplayValue = (gain * 10) - 10;
        masterVolumeDisplayRef.current.innerHTML = Utils.formatVolumeDisplay(volumeDisplayValue);
    }

    function toggleSequencerSection(event) {
        if (event.altKey) {
            return;
        }
        if (isSectionHidden) {
            setSectionHidden(false);
        }
        else {
            setSectionHidden(true);
        }
        Utils.stopEvent(event);
    }

    function handleKeyDown(event) {
        //const target = event.target;
        const key_pressed = event.keyCode || event.which;

        // if Shift/Ctrl is held down then let it bubble
        if (event.shiftKey || event.ctrlKey) {
            return;
        }

        // Handle Esc
        if (key_pressed === 27) {
            expandContractButton.current.focus();
            Utils.stopEvent(event);
            return;
        }
    }

    return (
        <div id="sequencer_wrap" className="section_wrap">
            <h2 id="sequencer_header" className="section-header">
            <button ref={expandContractButton} id="sequencer_button" onClick={toggleSequencerSection} aria-expanded={!isSectionHidden} aria-controls="sequencer_section"><i aria-hidden="true" className={`fa ${isSectionHidden ? 'fa-plus' : 'fa-minus'}`}></i> Player</button>
            </h2>
            <section id="sequencer_section" aria-labelledby="sequencer_header" className="section-border" aria-hidden={isSectionHidden} onKeyDown={handleKeyDown}>
                <div id="beat_tracker_controls">
                    <div className="sequencer_controls_wrap">
                        <button id="sequencer_on_off" className="control" onClick={handleStartButton} aria-pressed="false" >Start <span className="visually-hidden">Sequencer</span></button>
                        <div className="tempo_wrap">
                            <label htmlFor="tempo">Tempo</label>
                            <span id="beats_per_minute">{tempo} <span className="bpm"><abbr title="Beats Per Minute">BPM</abbr></span></span>
                            <input ref={tempoSliderRef} id="tempo" onChange={handleTempoChange} className="control" type="range" min="30.0" max="180.0" step="1" value={tempo}></input>
                        </div>
                        <div className="master_volume_wrap">
                            <label htmlFor="master_volume"><span className="visually-hidden">Master </span>Volume</label>
                            <span ref={masterVolumeDisplayRef} id="master_volume_display">&#177;0</span>
                            <input id="master_volume" onInput={handleMasterVolumeInput} className="control" type="range" min="0" max="2" step="0.1" defaultValue="1"></input>
                        </div>
                    </div>
                </div>
                <div className="placeholder" aria-hidden="true">
                    <div className="placeholder_button"></div>
                    <div className="placeholder_button"></div>
                    <div className="placeholder_button"></div>
                </div>
            <div aria-hidden="true" id="beat_tracker" className="beat_tracker_row">
                <div className="quarter">
                    <SequencerCell beatNumber="1"/>
                    <SequencerCell beatNumber="2"/>
                    <SequencerCell beatNumber="3"/>
                    <SequencerCell beatNumber="4"/>
                </div>
                <div className="quarter">
                    <SequencerCell beatNumber="5"/>
                    <SequencerCell beatNumber="6"/>
                    <SequencerCell beatNumber="7"/>
                    <SequencerCell beatNumber="8"/>
                </div>
                <div className="quarter">
                    <SequencerCell beatNumber="9"/>
                    <SequencerCell beatNumber="10"/>
                    <SequencerCell beatNumber="11"/>
                    <SequencerCell beatNumber="12"/>
                </div>
                <div className="quarter">
                    <SequencerCell beatNumber="13"/>
                    <SequencerCell beatNumber="14"/>
                    <SequencerCell beatNumber="15"/>
                    <SequencerCell beatNumber="16"/>
                </div>
            </div>
            <AudioScheduler power={power} tempo={tempo} click={metronome} />
            </section>
        </div>
    );
}
