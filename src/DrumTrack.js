import React from 'react';
//import './DrumTrack.css';
import Utils from './Utils';
import { useStoreValue } from 'react-context-hook';

export default function DrumTrack(props) {

    const soundName = useStoreValue('soundNames')[props.soundId];
    const position = props.position;
    const [bank, row, col] = Utils.getBankRowCol(`beat_${position}`);
    const soundId = Utils.getSoundId(bank, row, col);
    const tabIndex = 0;

    function toggleBeat(event) {
        const target = event.target;
        const beatTarget = target.classList.contains('beat_number') ? target.parentElement : target;

        if (event.type === 'keydown') {
            const key_pressed = event.keyCode || event.which;
            // only space/return trigger toggle
            if (key_pressed !== 32 && key_pressed !== 13) {
                return;
            }
            if (event.repeat) {
                Utils.stopEvent(event);
                return;
            }
        }
        // we only want to toggle on left mouse click
        else if (event.button !== 0) {
            // we don't want keyboard focus to move to button
            Utils.stopEvent(event);
            return;
        }
        Utils.toggleDrumTrackBeat(beatTarget);
        Utils.stopEvent(event);
        Utils.setFocus(event.target);
    }

    function clearTrack(event) {
        Utils.clearDrumTrack(soundId);
        Utils.stopEvent(event);
    }

    return(
        <React.Fragment>
            <h3 id={`h3_track_${props.soundId}`}>{soundName} <span className="visually-hidden">Drum Track</span></h3>
            <div id={`track_${props.soundId}`} className="drumtrack" aria-describedby={`h3_track_${props.soundId}`}>
                <div className="beats">
                        <div className="quarter">
                            <span id={`beat_${position}_1`} tabIndex={tabIndex} role="button" data-position={position} data-beat="1" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">1</span></span>
                            <span id={`beat_${position}_2`} tabIndex={tabIndex}   role="button" data-position={position} data-beat="2" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">2</span></span>
                            <span id={`beat_${position}_3`} tabIndex={tabIndex} role="button" data-position={position} data-beat="3" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">3</span></span>
                            <span id={`beat_${position}_4`} tabIndex={tabIndex} role="button" data-position={position} data-beat="4" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">4</span></span>
                        </div>
                        <div className="quarter">
                            <span id={`beat_${position}_5`} tabIndex={tabIndex} role="button" data-position={position} data-beat="5" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">5</span></span>
                            <span id={`beat_${position}_6`} tabIndex={tabIndex}   role="button" data-position={position} data-beat="6" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">6</span></span>
                            <span id={`beat_${position}_7`} tabIndex={tabIndex} role="button" data-position={position} data-beat="7" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">7</span></span>
                            <span id={`beat_${position}_8`} tabIndex={tabIndex} role="button" data-position={position} data-beat="8" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">8</span></span>
                        </div>
                    
                        <div className="quarter">
                            <span id={`beat_${position}_9`} tabIndex={tabIndex} role="button" data-position={position} data-beat="9" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">9</span></span>
                            <span id={`beat_${position}_10`} tabIndex={tabIndex}   role="button" data-position={position} data-beat="10" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">10</span></span>
                            <span id={`beat_${position}_11`} tabIndex={tabIndex} role="button" data-position={position} data-beat="11" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">11</span></span>
                            <span id={`beat_${position}_12`} tabIndex={tabIndex} role="button" data-position={position} data-beat="12" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">12</span></span>
                        </div>
                        <div className="quarter">
                            <span id={`beat_${position}_13`} tabIndex={tabIndex} role="button" data-position={position} data-beat="13" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">13</span></span>
                            <span id={`beat_${position}_14`} tabIndex={tabIndex}   role="button" data-position={position} data-beat="14" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">14</span></span>
                            <span id={`beat_${position}_15`} tabIndex={tabIndex} role="button" data-position={position} data-beat="15" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">15</span></span>
                            <span id={`beat_${position}_16`} tabIndex={tabIndex} role="button" data-position={position} data-beat="16" aria-pressed="false" className="beat" onMouseDown={toggleBeat} onKeyDown={toggleBeat}><span className="beat_number visually-hidden">16</span></span>
                        </div>
                    
                </div>
                <button className="clear_track" title="Clear track" onClick={clearTrack}><span className="visually-hidden">{`Clear ${soundName} Track`}</span>
                    <i className="fa fa-trash-o" aria-hidden="true"></i>
                </button>
            </div>
        </React.Fragment>
    );
}
