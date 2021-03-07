import React from 'react';
import './SequencerCell.css';

export default function BeatGeneratorCell(props) {
    const activeClass = props.active ? 'active' : '';

    return (
        <span id={`beat${props.beatNumber}`} className={`beat ${activeClass}`}data-beat={props.beatNumber}>{props.beatNumber}</span>
    );
}