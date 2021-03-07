import React from 'react';
import Pad from './Pad';
import { useStoreValue } from 'react-context-hook';

export default function DrumPad(props) {

    const bank = useStoreValue('bank');

    return (
        <div id={`drumpad_${props.bank}`} className='drumpad' aria-hidden={Number(props.bank) !== bank}>
            <div className="drumpad_wrap">
                <div className="drumpad_row">
                    <Pad alertUser={props.alertUser} kbKey="Q" id={`pad_${props.bank}_0_0`} />
                    <Pad alertUser={props.alertUser} kbKey="W" id={`pad_${props.bank}_0_1`} />
                    <Pad alertUser={props.alertUser} kbKey="E" id={`pad_${props.bank}_0_2`} />
                </div>
                <div className="drumpad_row">
                    <Pad alertUser={props.alertUser} kbKey="A" id={`pad_${props.bank}_1_0`} />
                    <Pad alertUser={props.alertUser} kbKey="S" id={`pad_${props.bank}_1_1`} />
                    <Pad alertUser={props.alertUser} kbKey="D" id={`pad_${props.bank}_1_2`} />
                </div>
                <div className="drumpad_row">
                    <Pad alertUser={props.alertUser} kbKey="Z" id={`pad_${props.bank}_2_0`} />
                    <Pad alertUser={props.alertUser} kbKey="X" id={`pad_${props.bank}_2_1`} />
                    <Pad alertUser={props.alertUser} kbKey="C" id={`pad_${props.bank}_2_2`} />
                </div>
            </div>
        </div>
    );

}
