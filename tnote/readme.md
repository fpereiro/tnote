## Client Data/State structure

State.view
State.play
   playing: true|false
   section: INTEGER
   muted:   {VOICENAME1: true|false, ...}
   bpm:     INTEGER
   start:   INTEGER
   end:     INTEGER
   backgroundVolume: FLOAT

Data.library: [name, link]
Data.piece: {
   title:  STRING
   author: STRING
   sections: [{
      title: STRING
      bpm:   INTEGER
      bpb:   INTEGER
      voices: {
         VOICENAME: [
            // Single note
            [octave, pitch, duration, {ligature: true|UNDEFINED, fermata: true|UNDEFINED, offset: INTEGER, duration: INTEGER, k: INTEGER}]
            // Chord
            [undefined, [[octave, pitch], [octave, pitch], ...], duration, {...}],
