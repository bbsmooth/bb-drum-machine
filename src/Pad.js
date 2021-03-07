import React, { useRef } from 'react';
import Utils from './Utils';
import { useStoreValue, useGetAndset } from 'react-context-hook';
import FileDialog from 'file-dialog';
import FileType from 'file-type/browser';
import notAllowed from './signal.png';

// cap size of sound file to be loaded by user
const MAX_FILE_SIZE = 500000;
// allowable sound file types
const AUDIO_TYPES = new Set(['audio/x-wav', 'audio/mpeg']);

const ALLOWED_CLASSES = new Set(['pad', 'name', 'keyWrap', 'key', 'not-allowed', 'not-allowed-img']);

export default function Pad(props) {
    let isEditingName = false;
    const volumeId = props.id.replace('pad','volume');
    const [bank, row, col] = Utils.getBankRowCol(props.id);
    const soundId = Utils.getSoundId(bank, row, col);
    const soundName = useStoreValue('soundNames')[soundId];
    const [soundNames, setSoundNames] = useGetAndset('soundNames');

    // Refs for easy access
    const volumeDisplayRef = useRef(null);
    const editSoundNameButtonRef = useRef(null);
    const soundNameSpanRef = useRef(null);
    const volumeInputRef = useRef(null);
    const buttonRef = useRef(null);

    function playSound(event) {

        const target = event.target;

        //window.bbDrumMachine.messages.add(`playSound: ${event.type}`);

        // check if we are editing sound name
        if (target.classList.contains('name') && target.isContentEditable) {
            return;
        }

        // keydown on Drum Pad 
        if (event.type === 'keydown') {
            if (event.repeat) {
                Utils.stopEvent(event);
                return;
            }
            const key_pressed = event.keyCode || event.which;
            if (key_pressed === 13 || key_pressed === 32) {
                window.bbDrumMachine.sounds[soundId].play();    
                buttonRef.current.classList.add('clicked');
                Utils.stopEvent(event);
            }
            return;
        }
        // left mouse click only
        else if (event.type === 'mousedown' && event.button !== 0) {
            return;
        }

        if (ALLOWED_CLASSES.has(target.classList[0])) {
            window.bbDrumMachine.sounds[soundId].play();
            buttonRef.current.classList.add('clicked');
            Utils.setFocus(buttonRef.current);
            Utils.stopEvent(event);
        }
    }

    function removeClickedClass(event) {
        buttonRef.current.classList.remove('clicked');
        if (event.type === 'touchend') {
            Utils.stopEvent(event);
        }
    }

    function loadSound(event) {

        // if this is a keydown then make sure it is either
        // space bar or enter key
        if (event.type === 'keydown') {
            const key_pressed = event.which || event.keyCode;
            if (!Utils.isKeyClick(key_pressed)) {
                return;
            }
        }
        // left mouse click only
        else if (event.button !== 0) {
            return;
        }

        Utils.stopEvent(event);
        Utils.setFocus(event.target);

        FileDialog({accept: 'audio/*'}).then(file => {
            FileType.fromBlob(file[0]).then(file_type => {
                // verify this is a valid audio file
                if (!AUDIO_TYPES.has(file[0].type)) {
                    props.alertUser(`Bad File Format: File must be an audio file.`);
                }
                // make sure it's not too big
                else if (file[0].size > MAX_FILE_SIZE) {
                    props.alertUser(`File Exceeds Size Limit: File must be less than ${MAX_FILE_SIZE} <abbr title="kilobytes">kB</abr>.`);
                }
                // add the new sound
                else {
                    const thisSound = window.bbDrumMachine.sounds[soundId];
                    thisSound.loadSoundFile(file[0])
                    .then(() => {
                        const newArray = [...soundNames];
                        newArray[soundId] = Utils.getSoundNameFromFile(file[0].name);
                        setSoundNames(newArray);
                    })
                    .catch(e => {
                        console.log(e);
                    });
                }
            });
        });
    }

    function editName(event) {

        // if this is a keydown then make sure it is either
        // space bar or enter key
        if (event.type === 'keydown') {
            const key_pressed = event.which || event.keyCode;
            if (!Utils.isKeyClick(key_pressed)) {
                return;
            }
        }
        // left mouse click only
        else if (event.button !== 0) {
            Utils.stopEvent(event);
            return;
        }

        Utils.stopEvent(event);

        // if we are in the process of editing the name then 
        // this button says 'Save' now and we should save whatever is
        // in the name span
        if (isEditingName) {
            saveSoundName();
            setNameButtonLabel('Edit');
            Utils.setFocus(editSoundNameButtonRef.current);
            isEditingName = false;
            return;
        }

        setNameButtonLabel('Save');
        isEditingName = true;
        soundNameSpanRef.current.setAttribute('contentEditable', 'true');
        soundNameSpanRef.current.focus();
    }

    // If we lose focus on name field while editing then put
    // it back to what it was
    function editNameFocusOut(event) {
        const target = event.target;

        // check to make sure the name field is still editable
        // we may have left it already due to the tab key
        if (target.getAttribute('contenteditable') === 'false') {
            return;
        }

        target.textContent = soundNames[soundId];
        target.setAttribute('contenteditable', 'false');
        setNameButtonLabel('Edit');
        isEditingName = false;
        Utils.setFocus(editSoundNameButtonRef.current);
    }

    function editNameKeyDown(event) {

        const key_pressed = event.which || event.keyCode;

        // return (save new name)
        if (key_pressed === 13) {
            saveSoundName();
        }
        // escape (put current name back)
        else if (key_pressed === 27){
            soundNameSpanRef.current.textContent = soundNames[soundId];
        }
        // tab (put current name back and move focus to volume control)
        else if (key_pressed === 9) {
            soundNameSpanRef.current.textContent = soundNames[soundId];
            soundNameSpanRef.current.setAttribute('contenteditable', 'false');
            isEditingName = false;
            Utils.stopEvent(event);
            setNameButtonLabel('Edit');
            Utils.setFocus(volumeInputRef.current);
            return;
        }
        // keys that move the cursor, back/delete: we need to handle these
        // separately so that the length limit below doesn't block them.
        else if (Utils.isDirectionKey(key_pressed) || key_pressed === 46 || key_pressed === 8) {
            event.stopPropagation();
            return;
        }
        // all other characters: we need to keep the content from going past
        // 50 characters
        else {
            const nameLength = soundNameSpanRef.current.textContent.length;
            if (nameLength > 39) {
                // don't allow user to type any more characters
                event.preventDefault();
            }
            // we need to stop this from bubbling in case
            // drum pad keys are on 
            event.stopPropagation();
            return;
        }

        // if we get here we are done editing
        soundNameSpanRef.current.setAttribute('contenteditable', 'false');
        setNameButtonLabel('Edit');
        Utils.setFocus(editSoundNameButtonRef.current);
        Utils.stopEvent(event);
        isEditingName = false;
    }

    function saveSoundName() {
        const nameText = soundNameSpanRef.current.textContent.trim();
        let saving = true;

        if (nameText.length < 1 || !(/\S/.test(nameText))) {
            saving = false;
        }
        
        if (saving) {
            soundNameSpanRef.current.textContent = nameText;
            const newArray = [...soundNames];
            newArray[soundId] = nameText;
            setSoundNames(newArray);
        }
        else {
            soundNameSpanRef.current.textContent = soundNames[soundId];
        }
    }

    function setNameButtonLabel(label) {
        editSoundNameButtonRef.current.innerHTML = `${label} <span class="visually-hidden">sound name</span>`;
    }

    function adjustGain(event) {
        const target = event.target;
        const parentEl = target.parentNode;
        let volumeDisplayValue = (target.value * 10) - 10;

        parentEl.classList.add('display-volume');
        volumeDisplayRef.current.innerHTML = Utils.formatVolumeDisplay(volumeDisplayValue);
        window.bbDrumMachine.sounds[soundId].gain = target.value;

        const inputWidth = target.offsetWidth;
        const incrementWidth = inputWidth/20;
        const stepsFromRight = 20 - (target.value * 10);
        const volumeDisplayIncrementWidth = volumeDisplayRef.current.offsetWidth/20;
        const rightPosition = (stepsFromRight*incrementWidth) - (volumeDisplayIncrementWidth*stepsFromRight);

        volumeDisplayRef.current.style.right = `calc(${rightPosition}px`;

        Utils.stopEvent(event);
    }

    function endAdjustGain(event) {
        const parentEl = event.target.parentNode;
        parentEl.classList.remove('display-volume');
    }

    return(
        <div className="padWrap">
                <div className="padButtonWrap">
                <button ref={buttonRef} id={props.id} data-soundid={soundId} className="pad" data-bank={props.bank} onKeyDown={playSound} onKeyUp={removeClickedClass} onTouchStart={playSound} onTouchEnd={removeClickedClass} onMouseDown={playSound} onMouseUp={removeClickedClass} onMouseOut={removeClickedClass}>
                        <span ref={soundNameSpanRef} id={`${props.id}_edit`} contentEditable="false" className="name" suppressContentEditableWarning={true} onBlur={editNameFocusOut} onKeyDown={editNameKeyDown}>{soundName}</span>
                        <span className="keyWrap">
                            <span className="key">{props.kbKey}</span>
                            <span className="not-allowed"><img className="not-allowed-img" aria-hidden="true" src={notAllowed} alt=""/></span>
                        </span>
                    </button>
                </div>
                <div className="volumeCtrl">
                    <label htmlFor={volumeId}><span className="visually-hidden">{soundName} Volume</span><span aria-hidden="true">VOL</span></label>
                    {/* Volume input needs id for <label> above*/}
                <input ref={volumeInputRef} type="range" id={volumeId} className="control-volume" min="0" max="2" defaultValue="1" step="0.1" onInput={adjustGain} onFocus={adjustGain} onBlur={endAdjustGain} onTouchEnd={endAdjustGain}/>
                    <span data-id={`${volumeId}_display`} className="volumeDisplay" ref={volumeDisplayRef}></span>
                </div>
                <div className="padCtrlWrap">   
                    <div className="fileLoad">
                        <button data-id={`${props.id}_file_load`} onKeyDown={loadSound} onMouseDown={loadSound} className="pad-button">Load <span className="visually-hidden">new sound</span></button>
                    </div>
                    <div className="editName">
                        <button ref={editSoundNameButtonRef} data-id={`${props.id}_edit_name`} onKeyDown={editName}onMouseDown={editName} className="pad-button">Edit <span className="visually-hidden">sound name</span></button>
                    </div>
                </div>
            </div>
    );
}
