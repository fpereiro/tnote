## Vnote

Vnote is an alternative and experimental musical notation. It is based on the following principles:

1. **Treat all twelve notes as equal citizens**: Vnote uses a single number to represent each of the twelve notes of the [octave](https://en.wikipedia.org/wiki/Equal_temperament). There is no concept of sharps or flats.
2. **Use the graphical possibilities of the digital age**: the widespread availability of computers allows faithful reproduction of alternate graphical arrangements to express music. Vnote uses colors to represent octaves and line widths to express note durations.
3. **Use the interactive possibilities of the digital age**: a digital music notation allows for interactivity, which can be an aid to learning and memorizing. Vnote allows reproduction of individual notes, note lines and entire pieces, to assist reading and to allow exploration.
4. **Share music through an open format based in JSON**: Vnote stores music in an open source format based on JSON, which is easy to parse and to edit.
5. **Stimulate the exploration of approaches to express music**: the standard musical notation is a refined, time-tested and indisputable tool for writing music. This project considers, however, that the time is ripe to explore alternatives and improvements to it. Vnote is a contribution to this latent potential.

## Using Vnote

Vnote runs on any modern browser and requires no installation. You can find the latest version [here](https://cdn.rawgit.com/fpereiro/vnote/9cd401bd978983d0acc716718ae5070329dd7f72/vnote/vnote.html#).

## Demo

Here's a video of Vnote reproducing the first Fugue in C from Johann Sebastian Bach's Well Tempered Clavier (book 1).

<iframe width="560" height="315" src="https://www.youtube.com/embed/qUx6OlXBT94" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

## Notational principles

1. Notes are organized in lines. A line is a continuous sequence of notes belonging to a certain instrument. There can be more than one line per instrument simultaneously. Lines could also be called *voices*.

2. The [pitch class](https://en.wikipedia.org/wiki/Pitch_class) of a note is expressed as a number in the hexadecimal scale:

   - The number `1` represents `C`.
   - The number `2` represents `C#` or `Db`.
   - The number `3` represents `D`.
   - The number `4` represents `D#` or `Eb`.
   - The number `5` represents `E`.
   - The number `6` represents `F`.
   - The number `7` represents `F#` or `Gb`.
   - The number `8` represents `G`.
   - The number `9` represents `G#` or `Ab`.
   - The letter `A` (the number `10` in hexadecimal notation) represents `A`.
   - The letter `B` (the number `11` in hexadecimal notation) represents `A#` or `Bb`.
   - The letter `C` (the number `12` in hexadecimal notation) represents `B`.

   The stop is represented by the number `0`.

3. The octave of the note is expressed as a color:

   - The first octave is represented by the color red.
   - The second octave is represented by the color orange.
   - The third octave is represented by the color yellow.
   - The fourth octave is represented by the color green.
   - The fifth octave is represented by the color blue.
   - The sixth octave is represented by the color indigo.
   - The seventh octave is represented by the color violet.

   The octave starts at the pitch class 1 (C). For example, [A440](https://en.wikipedia.org/wiki/A440_(pitch_standard)) belongs to octave 4.

4. The [value](https://en.wikipedia.org/wiki/Note_value) (duration) of the note is expressed by its width.

5. Chords are expressed as a single note segment with the note numbers being written in succession, from the lowest to the highest. The octave color of the segment belongs to that of the *lower* note.

## Vnote JSON format

Vnote uses JSON to store and share music. Here's a specification of the Vnote format:

```javascript
{
   "piece": {
      "author": "...",
      "title": "...",
      // (other fields are possible)
   },
   "transcription": {
      "author": "...",
      // (other fields are possible)
   },
   "sections": [
      {
         "name": "...",
         // (bpm must be an integer)
         "bpm": ...,
         // (bpb represents `beats per bar` and indicates how many quarter notes fit in a bar; it must be an integer)
         "bpb": ...,
         // (the content of `notes` is specified in the next example)
         notes: [...]
      },
      // (other sections are possible)
   ]
}
```

As for the `notes`, they are organized in an array of `notelines`. A `noteline` is an array that starts with a string indicating the name of the note line, and is followed by a number of notes.

A note is expressed an array of three or four elements: `[pitch class, duration, octave, {...}]`.

- The pitch class must be an integer between 0 and 12.
- The duration is a number or fraction (1 for a quarter note; 2 for a half note; 4 for a whole note; 1/2 for an eight note; 1/4 for a sixteenth note; etc.).
- The octave is an integer between 1 and 7. It is not required for rest notes.
- The options object is optional and intends to give additional information to the interpreter (both human and digital). Currently the only option interpreted by Vnote is the `lig` marking to express ligatures, placed in the first note of the ligature: `{lig: true}`.

Chords are expressed differently: their third element is irrelevant. The notes and octaves are expressed in the first element of the array, expressed as an array of arrays of the following form: `[note, octave]`. The notes of the array should be sorted from lowest to highest. For example, a quarter C major chord in the fourth octave, lasting for a whole note, should be written like this: `[[[1, 4], [5, 4], [8, 4]], 4]`.

## Vnote player (as seen on the video)

To be polished before publishing initial version.

## Available music in Vnote JSON format

New pieces will be added [here](https://github.com/fpereiro/vnote/tree/master/music).

A transcription of [Bach's BVW 846](https://en.wikipedia.org/wiki/Prelude_and_Fugue_in_C_major,_BWV_846) can be found [here](https://cdn.rawgit.com/fpereiro/vnote/f2d757be6d65474654daec70ded354f0e11995c0/music/Bach%20-%20WTC%20846.json).

## Notes on learning music using Vnote

### Dodecaphonic solfège

I love mental play (singing the notes of a melody or a harmony in my head) know and use the traditional solfège (do-re-mi-fa-sol-la-si), but it only has seven notes. The black keys have no names and singing "flat" or "sharp" breaks the stride of the solfège. This, over time, made me way less confident when playing music that uses lots of black keys, which sucks.

So I assigned five sounds to the black keys.

They are:

- *jo* (for C sharp or D Flat)
- *ka* (for D sharp or E flat)
- *pe* (for F sharp or G flat)
- *bu* (for G sharp or A flat)
- *te* (for A sharp or B flat)

The entire dodecaphonic scale, in solfège, is then:

**do jo re ka mi fa pe sol bu la te zi**

The sounds are nonsensical, but they are chosen to start with different letters than the traditional seven sounds. Notice also that *si* is pronounced *zi* to start with a different letter than *sol*.
