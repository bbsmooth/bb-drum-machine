import React, { useState, useRef } from 'react';
import DrumPad from './DrumPad';
import './SectionDrumPad.css';
import Utils from './Utils';
//import { Wrapper, Tab, TabList, TabPanel } from 'react-aria-tabpanel';
import { useStoreValue } from 'react-context-hook';

export default function DrumPadsSection(props) {

    const currentBank = useStoreValue('bank');
    //const accessKeys = useStoreValue('accessKeys');
    const [isSectionHidden, setSectionHidden] = useState(false);
    const expandContractButton = useRef(null);

    // arrow keys when pads are in focus
    function handleKeyDown(event) {
        const target = event.target;
        const key_pressed = event.keyCode || event.which;

        // if Shift/Ctrl is held down then let it bubble
        if (event.shiftKey || event.ctrlKey || event.altKey) {
            return;
        }

        // Handle Esc
        if (key_pressed === 27) {
            expandContractButton.current.focus();
            Utils.stopEvent(event);
            return;
        }

        // we only want to handle arrow keys if focus 
        // is on a drum pad (not volume or such)
        if (!target.classList.contains('pad') || !Utils.isArrowKey(key_pressed)) {
            return;
        }

        const [bank,row,col] = Utils.getBankRowCol(target.id);

        const drumpads_single_file = document.getElementById('drumpads_single_file');
        const style = window.getComputedStyle(drumpads_single_file);
        const drumpads_alignment = style.getPropertyValue('display') === 'block' ? 'single' : 'triple';

        switch(key_pressed) {
            case 37: // left arrow
                if (drumpads_alignment === 'triple') {
                    if (col > 0) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_${col - 1}`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_2`));
                    }
                }
                else {
                    if (row === 0 && col === 0) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_2_2`));
                    }
                    else if (col === 0) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row - 1}_2`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_${col - 1}`));
                    }
                }
                Utils.stopEvent(event);
                break;
            case 38: // up arrow
                if (drumpads_alignment === 'triple') {
                    if (row > 0) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row - 1}_${col}`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_2_${col}`));
                    }
                }
                else {
                    if (row === 0 && col === 0) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_2_2`));
                    }
                    else if (col === 0) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row-1}_2`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_${col-1}`));
                    }
                }
                Utils.stopEvent(event);
                break;
            case 39: // right arrow
                if (drumpads_alignment === 'triple') {
                    if (col < 2) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_${col + 1}`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_0`));
                    }
                }
                else {
                    if (row === 2 && col === 2) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_0_0`));
                    }
                    else if (col === 2) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row + 1}_0`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_${col + 1}`));
                    }
                }
                Utils.stopEvent(event);
                break;
            case 40: // down arrow
                if (drumpads_alignment === 'triple') {
                    if (row < 2) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row + 1}_${col}`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_0_${col}`));
                    }
                }
                else {
                    if (row === 2 && col === 2) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_0_0`));
                    }
                    else if (col === 2) {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row + 1}_0`));
                    }
                    else {
                        Utils.setFocus(document.getElementById(`pad_${bank}_${row}_${col + 1}`));
                    }
                }
                Utils.stopEvent(event);
                break;
            default:
        }
    }

    function toggleDrumpadSection(event) {
        if (isSectionHidden) {
            setSectionHidden(false);
            props.setHideHeader(false);
        }
        else {
            setSectionHidden(true);
            props.setHideHeader(true);
        }
    }

    return(
        <div id="drumpads_wrap" className="section_wrap">
            <h2 id="drumpad_header" className="drumpad_header section-header">
                <button ref={expandContractButton} id="drumpad_button" onClick={toggleDrumpadSection} aria-expanded={!isSectionHidden} aria-controls="drumpads"><i aria-hidden="true" className={`fa ${isSectionHidden ? 'fa-plus' : 'fa-minus'}`}></i> Drum Pads [S<span className='complete'>ound </span>B<span className='complete'>ank </span>{currentBank}]</button>
            </h2>
            <section id="drumpads" aria-labelledby="drumpad_button" className="section-border" onKeyDown={handleKeyDown} aria-hidden={isSectionHidden}>
                <DrumPad bank="1" alertUser={props.alertUser}/>
                <DrumPad bank="2" alertUser={props.alertUser}/>
                <div className="placeholder" aria-hidden="true">
                    <div className="placeholder_button"></div>
                    <div className="placeholder_button"></div>
                    <div className="placeholder_button"></div>
                </div>
            </section>
        </div>
    );
}
