import React, { useState, useRef } from 'react';
import DrumTracks from './DrumTracks';
import Utils from './Utils';
import { useStoreValue } from 'react-context-hook';
import './DrumTracksSection.css';

export default function DrumTracksSection(props) {

    const currentBank = useStoreValue('bank');
    const [isSectionHidden, setSectionHidden] = useState(false);
    const drumtracksWrapRef = useRef(null);
    const expandContractButton = useRef(null);

    function handleKeyDown(event) {
        const target = event.target;
        const key_pressed = event.keyCode || event.which;
        const [bank, row, col, beat] = Utils.getBankRowColBeat(target.id);

        if (event.altKey || event.shiftKey || event.ctrlKey) {
            return;
        }

        // Handle Esc
        if (key_pressed === 27) {
            expandContractButton.current.focus();
            Utils.stopEvent(event);
            return;
        }

        if (!target.classList.contains('beat') || !Utils.isDirectionKey(key_pressed)) {
            return;
        }

        switch (key_pressed) {
            case 33: // Page Up
                Utils.setFocus(document.getElementById(`beat_${bank}_0_0_${beat}`));
                break;
            case 34: // Page Down
                Utils.setFocus(document.getElementById(`beat_${bank}_2_2_${beat}`));
                break;
            case 35: // End
                Utils.setFocus(document.getElementById(`beat_${bank}_${row}_${col}_16`));
                break;
            case 36: // Home
                Utils.setFocus(document.getElementById(`beat_${bank}_${row}_${col}_1`));
                break;
            case 37: // left arrow
                if (beat > 1) {
                    Utils.setFocus(document.getElementById(`beat_${bank}_${row}_${col}_${Number(beat) - 1}`));
                }
                else {
                    Utils.setFocus(document.getElementById(`beat_${bank}_${row}_${col}_16`));
                }
                break;
            case 38: // up arrow
                Utils.setFocus(document.getElementById(`beat_${bank}_${getNextUpPosition(row, col, beat)}`));
                break;
            case 39: // right arrow
                if (beat < 16) {
                    Utils.setFocus(document.getElementById(`beat_${bank}_${row}_${col}_${Number(beat) + 1}`));
                }
                else {
                    Utils.setFocus(document.getElementById(`beat_${bank}_${row}_${col}_1`));
                }
                break;
            case 40: // down arrow
                Utils.setFocus(document.getElementById(`beat_${bank}_${getNextDownPosition(row, col, beat)}`));
                break;
            default:
        }
        Utils.stopEvent(event);
    }

    function getTrackAlignment() {
        const half = document.getElementById('drumtracks_half');
        const full = document.getElementById('drumtracks_full');
        const half_style = window.getComputedStyle(half);
        const full_style = window.getComputedStyle(full);
        
        if (full_style.getPropertyValue('display') === 'block') {
            return 'full';
        }
        if (half_style.getPropertyValue('display') === 'block') {
            return 'half';
        }
        return 'quarter';
    }

    function getNextUpPosition(currRow, currCol, currBeat) {
        const trackAlign = getTrackAlignment();
        currRow = Number(currRow);
        currCol = Number(currCol);
        currBeat = Number(currBeat);

        if (trackAlign === 'full') {
            if (currCol > 0) {
                return `${currRow}_${currCol - 1}_${currBeat}`;
            }
            if (currRow === 0) {
                return `2_2_${currBeat}`;
            }
            return `${currRow - 1}_2_${currBeat}`;
        }

        if (trackAlign === 'half') {
            if (currBeat > 8) {
                return `${currRow}_${currCol}_${currBeat - 8}`;
            }    
            if (currCol > 0) {
                return `${currRow}_${currCol - 1}_${currBeat + 8}`;
            }
            if (currRow === 0) {
                return `2_2_${currBeat + 8}`;
            }
            return `${currRow - 1}_2_${currBeat + 8}`;
        }

        if (currBeat > 4) {
            return `${currRow}_${currCol}_${currBeat - 4}`;
        }
        if (currCol > 0) {
            return `${currRow}_${currCol - 1}_${currBeat + 12}`;
        }
        if (currRow === 0) {
            return `2_2_${currBeat + 12}`;
        }
        return `${currRow - 1}_2_${currBeat + 12}`;
    }

    function getNextDownPosition(currRow, currCol, currBeat) {
        const trackAlign = getTrackAlignment();
        currRow = Number(currRow);
        currCol = Number(currCol);
        currBeat = Number(currBeat);

        if (trackAlign === 'full') {
            if (currCol < 2) {
                return `${currRow}_${currCol + 1}_${currBeat}`;
            }
            if (currRow === 2) {
                return `0_0_${currBeat}`;
            }
            return `${currRow + 1}_0_${currBeat}`;
        }

        if (trackAlign === 'half') {
            if (currBeat < 9) {
                return `${currRow}_${currCol}_${currBeat + 8}`;
            }
            if (currCol < 2) {
                return `${currRow}_${currCol + 1}_${currBeat - 8}`;
            }
            if (currRow === 2) {
                return `0_0_${currBeat - 8}`;
            }
            return `${currRow + 1}_0_${currBeat - 8}`;
        }

        if (currBeat < 13) {
            return `${currRow}_${currCol}_${currBeat + 4}`;
        }
        if (currCol < 2) {
            return `${currRow}_${currCol + 1}_${currBeat - 12}`;
        }
        if (currRow === 2) {
            return `0_0_${currBeat - 12}`;
        }
        return `${currRow + 1}_0_${currBeat - 12}`;
    }

    function toggleDrumtracksSection(event) {
        if (isSectionHidden) {
            setSectionHidden(false);
            drumtracksWrapRef.current.dataset.hidden = false;
        }
        else {
            setSectionHidden(true);
            drumtracksWrapRef.current.dataset.hidden = true;
        }
    }

    return (
        <div ref={drumtracksWrapRef} id="drumtracks_section_wrap" className="section_wrap drumtracks_section_wrap">
            <h2 id="drumtracks_header" className="drumpad_header section-header">
                <button ref={expandContractButton} id="drumtracks_button" onClick={toggleDrumtracksSection} aria-expanded={!isSectionHidden} aria-controls="drumtracks"><i aria-hidden="true" className={`fa ${isSectionHidden ? 'fa-plus' : 'fa-minus'}`}></i> Drum Tracks [S<span className='complete'>ound </span>B<span className='complete'>ank </span>{currentBank}]
                </button>
            </h2>
            <section id="drumtracks" className="section-border" onKeyDown={handleKeyDown} aria-hidden={isSectionHidden}>
                <DrumTracks bank="1" />
                <DrumTracks bank="2" />
                <div className="placeholder" aria-hidden="true">
                    <div className="placeholder_button"></div>
                    <div className="placeholder_button"></div>
                    <div className="placeholder_button"></div>
                </div>
            </section>
        </div>
    );

}
