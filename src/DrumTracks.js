import React from 'react';
import DrumTrack from './DrumTrack';
//import './DrumTracks.css';
import { useStoreValue } from 'react-context-hook';

export default function DrumTracks(props) {

    const sndInc = (Number(props.bank) === 1) ? 0 : 9;
    const bank = useStoreValue('bank');

    return (
        <div id={`drumtracks_${props.bank}`} className="drumtracks" aria-hidden={Number(props.bank) !== bank}>
            <DrumTrack soundId={0 + sndInc} position={`${props.bank}_0_0`}/>
            <DrumTrack soundId={1 + sndInc} position={`${props.bank}_0_1`}/>
            <DrumTrack soundId={2 + sndInc} position={`${props.bank}_0_2`}/>
            <DrumTrack soundId={3 + sndInc} position={`${props.bank}_1_0`}/>
            <DrumTrack soundId={4 + sndInc} position={`${props.bank}_1_1`}/>
            <DrumTrack soundId={5 + sndInc} position={`${props.bank}_1_2`}/>
            <DrumTrack soundId={6 + sndInc} position={`${props.bank}_2_0`}/>
            <DrumTrack soundId={7 + sndInc} position={`${props.bank}_2_1`}/>
            <DrumTrack soundId={8 + sndInc} position={`${props.bank}_2_2`}/>
        </div> 
    );
}
