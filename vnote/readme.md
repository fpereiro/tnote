## Internal structure




## Current version

State.view
State.play
   playing: true|false
   section: INTEGER
   muted:   {LINENAME1: true|false, ...}
   bpm:     INTEGER
   from:    INTEGER
   to:      INTEGER
   backgroundVolume: FLOAT

Data.library: [name, link]
Data.piece: {
   title:  STRING
   author: STRING
   sections: [{
      title: STRING
      bpm:   INTEGER
      bpb:   INTEGER
      lines: {
         LINENAME: [
            // Single note
            [octave, pitch, duration, {ligature: true|UNDEFINED, fermata: true|UNDEFINED, offset: INTEGER, duration: INTEGER, k: INTEGER}]
            // Chord
            [undefined, [[octave, pitch], [octave, pitch], ...], duration, {...}],
