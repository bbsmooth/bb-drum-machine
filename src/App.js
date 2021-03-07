import React, { useRef, useEffect, useState } from 'react';
import { withStore, useGetAndset } from 'react-context-hook';
//import './bbDrumMachine';
import './App.css';
import Sequencer from './Sequencer';
import DrumTracksSection from './DrumTracksSection';
import DrumPadsSection from './DrumPadsSection';
import Sound from './Sound';
import DefaultSounds from './DefaultSounds';
import Utils from './Utils';
import Modal from 'react-modal';
import SimpleMenu from './SimpleMenu';
import AudioToWave from 'audiobuffer-to-wav';
import FileSaver from 'file-saver';
import FileDialog from 'file-dialog';
import JSZip from 'jszip';
import FileType from 'file-type/browser';
import AppMenu from './AppMenu'; // menu definitions
import DRUMPAD_KEYCODES from './DrumPadKeyCodes';
import whatInput from 'what-input';
import MacIosUnlock from './MacIosUnlock';
import Messages from './Messages';
import AudioContext from './AudioContext';

// global object for accessing sound data
window.bbDrumMachine = {
  sounds: [],
  soundMatrix: new Array(18).fill(0).map(() => new Array(16).fill(0)),
  // nextBeatTime = { next beat number: time it will be played}
  nextBeatTime: { 0: 0 },
  audioContext: null,
  currentBeat: 0
};

// hack for testing only
window.bbDrumMachine.messages = new Messages();

const audioContext = new AudioContext();
window.bbDrumMachine.audioContext = audioContext;

const MacUnlock = new MacIosUnlock();
MacUnlock.start();

whatInput.registerOnChange(type => {
  if (type !== 'keyboard') {
    document.body.dataset.showfocus = false;
  }
  else {
    document.body.dataset.showfocus = true;
  }
}, 'input');


// Modal settings for alert pop-up
const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '30em',
    lineHeight: '1.2'
  }
};
Modal.setAppElement('#app_wrapper');

// for react-context-hook store (global)
const initialState = {
  beat: 0,
  power: true,
  bank: 1,
  tempo: 110,
  metronome: false,
  altKeys: false,
  padKeysAlwaysOn: false,
  soundNames: DefaultSounds.soundNames,
  openModal: false,
  onCloseModalFocus: null,
  modalText: 'Illegal operation.',
  accessKeys: {
    menu: 'm',
    drums: 'd',
    player: 'p',
    tracks: 't'
  }
};
const storeConfig = {
  proxyStore: true,
  /*logging: true*/
}

window.addEventListener('focusin', event => {
  if (whatInput.ask() !== 'keyboard') {
    return;
  }
  const target = event.target;
  if (/appMenu/.test(target.id)) {
    return;
  }
  const menuBottom = MENU.getMenu().getBoundingClientRect().bottom;
  const targetTop = event.target.getBoundingClientRect().top;

  if ((targetTop - 15) < menuBottom) {
    let fontHeight = 0;
    if (target.classList.contains('beat')) {
      fontHeight = document.getElementById('test_trash').offsetHeight;
    }
    window.scrollTo(0, window.pageYOffset - (menuBottom - targetTop) - fontHeight - 25);
  }
  else if (target.classList.contains('pad')) {
    const targetBottom = event.target.getBoundingClientRect().bottom;
    const viewportBottom = window.innerHeight;

    if (targetBottom + 15 > viewportBottom) {
      window.scrollTo(0, window.pageYOffset + (targetBottom - viewportBottom) + 25);
    }
  }
});


let SAVE_ZIP_NAME = 'bbDrumMachineSession.zip';
let MENU = null;
let myObserver; // for watching width changes
let INSTRUCTIONS_WINDOW = null;

function App() {

  const [currentBank, setBank] = useGetAndset('bank');
  const [altKeys, setAltKeys] = useGetAndset('altKeys');
  const [padKeysAlwaysOn, setPadKeysAlwaysOn] = useGetAndset('padKeysAlwaysOn');
  const [openModal, setOpenModal] = useGetAndset('openModal');
  const [onCloseModalFocus, setOnCloseModalFocus] = useGetAndset('onCloseModalFocus');
  const [modalText, setModalText] = useGetAndset('modalText');
  const [soundNames, setSoundNames] = useGetAndset('soundNames');
  const [tempo, setTempo] = useGetAndset('tempo');
  const [metronome, setMetronome] = useGetAndset('metronome');

  const [hideHeader, setHideHeader] = useState(false);

  const modalCloseButton = useRef(null);
  const drumMachineRef = useRef(null);

  // make sure we only show one error message at a time
  let ALERT_DISPLAYED = false;

  function displayDefaultSoundError(err) {
    alertUser(`An error occured loading the Drum Machine. <br/> ${err}. <br/>Please keep reloading the page until you are error free.`);
  }

  function saveToZip() {
    const zip = new JSZip();
    const sounds = {};

    closeVerticalMenu();

    window.bbDrumMachine.sounds.forEach((sound, idx) => {
      const wav = AudioToWave(sound.audioBuffer);
      const blob = new window.Blob([new DataView(wav)], {
        type: 'audio/wav'
      });
      zip.file(`pad_${idx}.wav`, blob);
      sounds[`pad_${idx}.wav`] = {};
      sounds[`pad_${idx}.wav`].name = soundNames[idx];
      sounds[`pad_${idx}.wav`].volume = sound.gain;
    });

    const confObj = {
      sounds: sounds,
      matrix: window.bbDrumMachine.soundMatrix,
      tempo: Number(drumMachineRef.current.dataset.tempo)
    };
    const manifestString = JSON.stringify(confObj);
    zip.file('bbDrumMachine.conf', manifestString);

    zip.generateAsync({ type: "blob" })
      .then(function (blob) {
        FileSaver.saveAs(blob, SAVE_ZIP_NAME);//.then(() => MENU.setFocusToHamburger());
      });
  }

  async function loadFromZip() {

    closeVerticalMenu();

    // Get the local file picked by the user
    const file = await FileDialog({ accept: 'application/zip' });

    // Check to make sure it is a zip file
    const file_type = await FileType.fromBlob(file[0]);

    if (file_type === undefined || file_type.mime !== 'application/zip') {
      alertUser('Bad File Type: File must be a zip file created by BB Drum Machine.');
      return;
    }

    // read in zip file
    const readZip = new JSZip();
    const zip = await readZip.loadAsync(file[0]);

    // Make sure config file exists
    if (zip.files['bbDrumMachine.conf'] === undefined) {
      alertUser('Bad Zip File: Zip file must be created by BB Drum Machine.');
      return;
    }
    // Make sure all 18 wav files exist
    for (let i = 0; i < 18; i++) {
      if (zip.files[`pad_${i}.wav`] === undefined) {
        alertUser('Bad Zip File: Zip file must be created by BB Drum Machine.');
        return;
      }
    }

    // Save name of zip in case user wants to save it again
    SAVE_ZIP_NAME = file[0].name;

    // Read in config file and convert to JSON object
    const confText = await readZip.file('bbDrumMachine.conf').async('text');
    const config = JSON.parse(confText);

    // TODO: Probably do some sanity checking on 'config' to make
    // sure it looks like a good config object.

    const newSoundNames = [];
    const newVolumes = [];

    // Load the wav files
    for (let i = 0; i < 18; i++) {
      const wav_file_name = `pad_${i}.wav`;
      newSoundNames[i] = config.sounds[wav_file_name].name;
      newVolumes[i] = config.sounds[wav_file_name].volume;

      try {
        const arrayBuffer = await readZip.file(wav_file_name).async('arraybuffer');
        await window.bbDrumMachine.sounds[i].loadWav(arrayBuffer);
      }
      catch (err) {
        alertUser(`Error loading ${wav_file_name}: ${err}`);
        // TODO: We should probably set everything to 
        // defaults if we have an error here.
        return;
      }
    }

    setSoundNames(newSoundNames);
    Utils.setVolumes(newVolumes);
    window.bbDrumMachine.soundMatrix = config.matrix;
    Utils.syncDrumTracksWithSoundMatrix();
    setTempo(Number(config.tempo));
    setBank(1);
    // set Bank to 1 in menu
    // this is a hack for now until I settle on a method
    // in SimpleMenu for implementing this
    document.getElementById('menu-item-appMenu_1_0').setAttribute('aria-checked', true);
    document.getElementById('menu-item-appMenu_1_1').setAttribute('aria-checked', false);
  }

  // Load default sounds
  useEffect(() => {

    // only create the menu once
    if (MENU === null) {

      // add <h1>
      const h1 = document.createElement('h1');
      h1.innerText = 'BB Drum Machine';
      document.getElementById('h1_wrapper').prepend(h1);

      MENU = new SimpleMenu('appMenu', 'BB Drum Machine', AppMenu.menu, AppMenu.events);
      const nav_wrapper = document.createElement('div');
      nav_wrapper.id = 'nav_wrapper';
      nav_wrapper.appendChild(MENU.getMenu());
      document.getElementById('app_wrapper').insertBefore(nav_wrapper, document.getElementById('root'));
    
      myObserver = new ResizeObserver(entries => {

        const iconWidth = document.getElementById('test_trash').offsetWidth;
        const bodyWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const drumtracksWidth = document.getElementById('drumtracks_section_wrap').offsetWidth;

        if ((bodyWidth - drumtracksWidth) / 2 > iconWidth) {
          drumMachineRef.current.classList.add('trash');
        }
        else {
          drumMachineRef.current.classList.remove('trash');
        }

        const hamburger = document.getElementById('menu-appMenu-hamburger');
        // If hamburger button is not visible then we want to
        // hide the vertical menu. This is primarily for when we
        // had the v-menu and then widened the window enough to
        // transition to the horizontal menu.
        if (hamburger.clientHeight === 0) {
          MENU.hideHamburger();
        }
        // If we are transitioning from horizonal to vertical
        // and a menu item is currently in focus then make sure 
        // we show the v-menu automatically.
        else if (MENU.getMenu().classList.contains('inFocus')) {
          // only show v-menu if it was actually expanded
          if (MENU.isSubMenuExpanded()) {
            MENU.getMenu().classList.add('show-menu');
          }
          else {
            MENU.setFocusToHamburger();
          }
        }
      });

      myObserver.observe(document.querySelector('.drumtracks_section_wrap'));
      myObserver.observe(document.body);
    
      // verify browser has necessary capabilities
      verifyFeatures();

      // check for saved settings for auto-play and Alt Keys
      checkSavedSettings();
    }

    // event listener for menu
    document.body.addEventListener('appMenuCustomEvent', handleAppMenuEvent);

    // listener for pad keys
    document.body.addEventListener('keydown', handleBodyKeyDown);

    // we only want to create the default sounds once
    if (window.bbDrumMachine.sounds.length < 1) {
      createDefaultSounds();
    }

    return function cleanup() {
      document.body.removeEventListener('appMenuCustomEvent', handleAppMenuEvent);
      document.body.removeEventListener('keydown', handleBodyKeyDown);
    };
  });

  function checkSavedSettings() {
    if (!Utils.storageAvailable('localStorage')) {
      return;
    }

    const autoPlay = localStorage.getItem('bbdm_autoplay') === 'true';
    const altKeys = localStorage.getItem('bbdm_altkeys') === 'true';


    if (autoPlay) {
      setPadKeysAlwaysOn(true);
      MENU.checkMenuItem(document.getElementById('menu-item-appMenu_2_0'));
    }

    if (altKeys) {
      setAltKeys(true);
      MENU.checkMenuItem(document.getElementById('menu-item-appMenu_2_1'));
    }
  }

  function createDefaultSounds() {
    DefaultSounds.bank1.forEach((entry, idx) => {
      window.bbDrumMachine.sounds[idx] = new Sound();
      window.bbDrumMachine.sounds[idx].loadDefaultSoundFile(entry.file)
        //.then(result => window.bbDrumMachine.messages.add(result))
        .catch(err => {
          window.bbDrumMachine.messages.add(err);
          displayDefaultSoundError(err);
        });
    });
    DefaultSounds.bank2.forEach((entry, idx) => {
      window.bbDrumMachine.sounds[idx + 9] = new Sound();
      window.bbDrumMachine.sounds[idx + 9].loadDefaultSoundFile(entry.file)
        //.then(result => window.bbDrumMachine.messages.add(result))
        .catch(err => {
          window.bbDrumMachine.messages.add(err);
          displayDefaultSoundError(err);
        });
    });
    // click sound (metronome)
    window.bbDrumMachine.clickSound = new Sound();
    window.bbDrumMachine.clickSound.gain = 0.7;
    window.bbDrumMachine.clickSound.loadDefaultSoundFile('click.mp3')
      //.then(result => window.bbDrumMachine.messages.add(result))
      .catch(err => {
        window.bbDrumMachine.messages.add(err);
        displayDefaultSoundError(err);
      });
  }

  function verifyFeatures() {
    const hasAudioContext = window.AudioContext // Default
      || window.webkitAudioContext // Safari and old versions of Chrome
      || false;
    if (!hasAudioContext) {
      alertUser('Sorry, your web browser does not have the audio capabilities needed to play sounds through bbDrumMachine. Try using a very recent version of Firefox or Chrome.');
    }
    else if (!window.Worker) {
      alertUser('Sorry, your web browser does not have the needed capabilities to play bbDrumMachine. Try using a very recent version of Firefox or Chrome.');
    }
  }

  // handlers for menu
  function handleAppMenuEvent(event) {
    const menuItem = event.detail.menuItem;
    switch (menuItem) {
      case 'menu-item-appMenu_0_0':
        handleSaveZip(event);
        break;
      case 'menu-item-appMenu_0_1':
        handleLoadZip(event);
        break;
      case 'bbdmSoundBank':
        handleSoundBank(event);
        break;
      case 'menu-item-appMenu_2_0':
        handleDrumPadKeys(event);
        break;
      case 'menu-item-appMenu_2_1':
        handleAltKeys(event);
        break;
      case 'menu-item-appMenu_2_2':
        handleMetronome(event);
        break;
      case 'menu-item-appMenu_2_3':
        handleClearDrumTracks(event);
        break;
      case 'menu-item-appMenu_3_0':
        handleInstructions();
        break;
      case 'menu-item-appMenu_3_1':
        handleAbout();
        break;
      default:
        console.log(`handleAppMenuEvent: don't know how to handle menuItem ${menuItem}`);
    } // end switch
    Utils.stopEvent(event);
  }
  function closeVerticalMenu() {
    if (MENU.isVertical()) {
      MENU.closeVerticalMenu();
      MENU.setFocusToHamburger();
    }
  }
  function handleLoadZip(event) {
    loadFromZip();
  }
  function handleSaveZip(event) {
    saveToZip();
  }
  function handleSoundBank(event) {
    const currBank = Number(drumMachineRef.current.dataset.bank);
    const bankClicked = Number(event.target.dataset.bank);
    if (currBank !== bankClicked) {
      setBank(bankClicked);
    }
    closeVerticalMenu();
  }
  function handleDrumPadKeys(event) {
    const padKeys = drumMachineRef.current.dataset.drumpadkeys === 'true';
    if (Utils.storageAvailable('localStorage')) {
      localStorage.setItem('bbdm_autoplay', !padKeys);
    }
    setPadKeysAlwaysOn(!padKeys);
    closeVerticalMenu();
  }

  function handleAltKeys(event) {
    const altKeys = drumMachineRef.current.dataset.altkeys === 'true';
    if (Utils.storageAvailable('localStorage')) {
      localStorage.setItem('bbdm_altkeys', !altKeys);
    }
    setAltKeys(!altKeys);
    closeVerticalMenu();
  }

  function handleMetronome(event) {
    const metronome = drumMachineRef.current.dataset.metronome === 'true';
    setMetronome(!metronome);
    closeVerticalMenu();
  }

  function handleClearDrumTracks(event) {
    Utils.clearAllDrumTracks();
    closeVerticalMenu();
  }

  function afterOpenModal() {
    modalCloseButton.current.focus();
  }

  function closeModal() {
    setOpenModal(false);
    if (onCloseModalFocus !== null) {
      MENU.setFocusTo(onCloseModalFocus);
      setOnCloseModalFocus(null);
    }
  }

  function handleBodyKeyDown(event) {
    // don't do anything if we are editing a sound name
    if (event.target.classList.contains('name')) {
      return;
    }

    const key_pressed = event.which || event.keyCode;

    // check for Alt keys
    if (event.altKey) {
      const altKeysOn = drumMachineRef.current.dataset.altkeys === 'true';

      if (!altKeysOn) {
        return;
      }

      let handled = false;

      switch (key_pressed) {
        case 38: // up arrow
        case 40: // down arrow
          if (!MENU.isVertical() && MENU.isSubMenuExpanded()) {
            MENU.closeActiveSubmenu();
          }
          handleAltUpDownArrow(event);
          handled = true;
          break;
        case 83: // 's'
          handleAltSpace(event);
          handled = true;
          break;
        case 49: // '1'
        case 50: // '2'
          handleAltNumber(event);
          handled = true;
          break;
        default:
      }

      if (handled) {
        Utils.stopEvent(event);
        return;
      }
    } // end Alt keys

    const drumKeysOn = drumMachineRef.current.dataset.drumpadkeys === 'true';
    const currentBank = Number(drumMachineRef.current.dataset.bank);

    // if auto-play keys are enabled and a drumpad keyboard
    // key is pressed then play sound
    if (drumKeysOn && key_pressed in DRUMPAD_KEYCODES && !event.repeat) {
      const soundId = currentBank === 2 ? DRUMPAD_KEYCODES[key_pressed].soundId + 9 : DRUMPAD_KEYCODES[key_pressed].soundId;
      window.bbDrumMachine.sounds[soundId].play();
      Utils.stopEvent(event);
    }
  }

  function handleAltUpDownArrow(event) {

    const key_pressed = event.keyCode || event.which;
    const section = Utils.getSection(event);

    // up arrow
    if (key_pressed === 38) {
      switch (section) {
        case 'drumtracks':
          document.getElementById('sequencer_button').focus();
          break;
        case 'player':
          document.getElementById('drumpad_button').focus();
          break;
        case 'drumpads':
          MENU.setFocusToFirstSubmenu();
          break;
        case 'menu':
          MENU.closeVerticalMenu();
          document.getElementById('drumtracks_button').focus();
          break;
        default: // 'none'
          MENU.closeVerticalMenu();
          document.getElementById('drumtracks_button').focus();
          break;
      }
    }
    // down arrow
    else {
      switch (section) {
        case 'drumtracks':
          MENU.setFocusToFirstSubmenu();
          break;
        case 'player':
          document.getElementById('drumtracks_button').focus();
          break;
        case 'drumpads':
          document.getElementById('sequencer_button').focus();
          break;
        case 'menu':
          MENU.closeVerticalMenu();
          document.getElementById('drumpad_button').focus();
          break;
        default: // 'none'
          MENU.setFocusToFirstSubmenu();
          break;
      }
    }
    Utils.stopEvent(event);
  }

  function handleAltSpace(event) {
    document.getElementById('sequencer_on_off').click();
    Utils.stopEvent(event);
  }

  function handleAltNumber(event) {
    const key_pressed = event.keyCode || event.which;
    const bankNum = key_pressed - 48;
    if (!event.target.dataset) {
      event.target.dataset = {};
    }
    event.target.dataset.bank = bankNum;
    handleSoundBank(event);
    const bankIdEl = document.getElementById(`menu-item-appMenu_1_${bankNum - 1}`);
    MENU.checkMenuItem(bankIdEl);
    const currFocusedElId = document.activeElement.id;
    if (/^(volume|pad|beat)_[12]_/.test(currFocusedElId)) {
      const newFocusedElId = currFocusedElId.replace(/^([a-z]+_)[12]/, "$1" + bankNum);
      document.getElementById(newFocusedElId).focus();
    }
    Utils.stopEvent(event);
  }

  function handleInstructions() {
    closeVerticalMenu();

    if (INSTRUCTIONS_WINDOW == null || INSTRUCTIONS_WINDOW.closed) {
      INSTRUCTIONS_WINDOW = window.open('./instructions.html', '_bbdrummachineinstructions');
    }
    else {
      INSTRUCTIONS_WINDOW.focus();
    }
  }

  function handleAbout() {
    let closeFocus = 'menu-item-appMenu_3';
    if (MENU.isVertical()) {
      MENU.closeVerticalMenu();
      closeFocus = 'menu-appMenu-hamburger';
    }
    const message = "BB Drum Machine Version 1.0.<br>Created using create-react-app.<br>Developed on Fedora 31.<br>Custom menu by bbsmooth.";
    alertUser(message, { onCloseModalFocus: closeFocus });
  }

  function createModalTextMarkup() {
    return { __html: modalText };
  }

  function alertUser(message, options) {
    if (!ALERT_DISPLAYED) {
      setModalText(message);
      if (options && options.onCloseModalFocus) {
        setOnCloseModalFocus(options.onCloseModalFocus);
      }
      setOpenModal(true);
      ALERT_DISPLAYED = true;
    }
  }

  return (
    <main ref={drumMachineRef} id="drum-machine" data-tempo={tempo} data-bank={currentBank} data-metronome={metronome} data-drumpadkeys={padKeysAlwaysOn} data-altkeys={altKeys}>
      <div id="h1_wrapper" data-hideheader={hideHeader}>
        <DrumPadsSection alertUser={alertUser} setHideHeader={setHideHeader}/>
      </div>
      <Sequencer setTempo={setTempo} alertUser={alertUser} />
      <DrumTracksSection />
      <Modal
        isOpen={openModal}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="An error has occurred"
        role="alertdialog"
      >
        <p dangerouslySetInnerHTML={createModalTextMarkup()}></p>
        <button id="modalCloseButton" ref={modalCloseButton} onClick={closeModal}>OK</button>
      </Modal>
    </main>
  );
}

export default withStore(App, initialState, storeConfig);
