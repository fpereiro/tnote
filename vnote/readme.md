## Internal structure

localStorage:
- vnote_data: array of pieces.
- vnote_config: {
   barsperline: INT
   width: INT
   piece: INT
}

State.instrument: Synth used to play.

State.playing: true/false. Starts/stops playing.

State.play: {
   piece:   INT
   section: INT
   bpm:     INT
   lines: [STR, ...]
   start: INT|UND
   stop:  INT|UND
}

note (before parse):
- single: pitch class, length, octave, params {lig: true}
- chord: pitch class, length, undefined, params {lig: true}

note (after parse):
- pitch class, length, octave, {lig: true|und, t: startTime, mute: true|und, dur: int}
- dur is different only for longer notes (head note of ligature).
- mute is for ligated notes.
