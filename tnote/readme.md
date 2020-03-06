## Todo

- Fix imperfect alignment (example: bvw 846 fugue I, slight right on r1 on bar 2).

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

State.show
   fin: true|false (show/hide fingerings)
   oct: true|false (show/hide octave)
   dur: true|false (show/hide duration)
   not: true|false (show/hide notes)

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
