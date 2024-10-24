## tnote

> "Y es música, música, siempre, sí." -- Norberto Napolitano

tnote is a textual musical notation. It is based on the following principles:

1. **Use text to represent music**: tnote uses an open text format to represent and transmit music. The format is humanly readable and writable; it is also easily parseable by computers, facilitating both analysis and artistic creation with the help of computers.
2. **Treat all twelve notes as equal citizens**: tnote uses a single number to represent each of the twelve notes of the [octave](https://en.wikipedia.org/wiki/Equal_temperament). There is no concept of sharps or flats.
3. **Use the graphical possibilities of the digital age**: the widespread availability of computers allows faithful reproduction of alternate graphical arrangements to express music. While tnote is textual, the tnote interface it uses colors and levels of scale to make the music more readable and memorable.
4. **Use the interactive possibilities of the digital age**: a digital music notation allows for interactivity, which can be an aid to learning and memorizing. The tnote interface allows reproduction of individual notes, voices and entire pieces, to assist reading and to allow exploration.
5. **Stimulate the exploration of novel approaches to notate music**: the standard musical notation is a refined, time-tested and indisputable tool for reading and writing music. This project considers, however, that the time is ripe to explore alternatives and improvements to it. tnote is a contribution to this latent potential.

## Using tnote

The tnote interface runs on any modern browser and requires no installation. You can find the latest version [here](https://fpereiro.github.io/tnote/tnote/tnote.html). Note: the latest version of the interface uses an older tnote format. The authoritative version of the notation is the one contained here, not in the interface.

tnote uses Keith Horwood's amazing [audiosynth library](https://github.com/keithwhor/audiosynth) to generate synthetized piano sounds.

## Demo

To be uploaded.

## Notational principles

1. Notes are organized in voices. A voice is a continuous sequence of notes belonging to a certain instrument. There can be more than one voice per instrument simultaneously.

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
   - The stop is represented by the number `0`.

3. The [octave](https://en.wikipedia.org/wiki/Octave) of the note is expressed as either a number or a color (or both):

   - The first octave is represented by either `o` or the color red.
   - The second octave is represented by either `p` or the color orange.
   - The third octave is represented by either `q` or the color yellow.
   - The fourth octave is represented by either `r` or the color green.
   - The fifth octave is represented by either `s` or the color blue.
   - The sixth octave is represented by either `t` or the color indigo.
   - The seventh octave is represented by either `u` or the color violet.

   The octave starts at the pitch class 1 (C). For example, [A440](https://en.wikipedia.org/wiki/A440_(pitch_standard)) belongs to octave `r`.

4. The [value](https://en.wikipedia.org/wiki/Note_value) (duration) of the note is expressed by either a fraction or a multiplier.

5. Chords are expressed as a single note segment with the note numbers being written in succession, from the lowest to the highest. The octave of the segment belongs to that of the *lowest* note.

## The tnote file format

The tnote format is designed to be easy to write and moderately readable, while being very compact. This is how a tnote file looks like:

```
author  Johann Sebastian Bach
title   WTC 1 - Prelude & Fugue I - BVW 846
version 20190113
transcription by Federico Pereiro <fpereiro@gmail.com>

START SECTION

title Prelude I
bpm   92
bpb   4

(notes go here)

END SECTION

START SECTION

title Fugue I
bpm   60
bpb   4

(notes go here)

END SECTION
```

`bpm` stands for *beats por minute*. `bpb` stands for *beats per bar*. If a bar contains four beats, then `bpb` will be 4.

As for the `notes`, they are organized in `voices`. A `voice` lists all the notes belonging to a certain voice and a certain bar. This is the basic structure:

```
 NN NAME  notes...
```

`NN` stands for the bar number. `NAME` is the name of the voice (for example, `R1` if it's the first voice of the right hand of a piano piece). Here's an example:

```
1 R2  0ca r1d
```

Notes are separated by spaces. Multiple spaces can be used to align the notes in a more readable way. Here's an example of an entire bar in *unabridged notation*:

```
 4 R  0b      rC9b    rC9b    52Bb    0b      rC9b    rC9b    rB8b
 4 L  q9d r4d q9d r4d q8d r4d q8d r4d q9d r4d q9d r4d q4d r4d q4d r4d
```

As for the notes, this is how you write them:

- Start with the octave, which is a letter between `o` and `u`, with `o` corresponding to octave 1, `p` corresponding to octave 2, and so forth until `u`, which corresponds to octave 7.
- Immediately after, place the pitch class of the note, which is 1-9 or A, B or C. For example, C4 would be written s1; and G5 would be written s8; while B3 would be written qC.
- If the note is a rest, you write `0` and don't add an octave.
- If the note is a chord, start writing the octave number of the first note. Then write the notes of the chord sorted from low to high. If between two contiguous notes on the chord there's a jump of more than an octave (for example: C4 to D5), put a + in the middle. For example, the chord C4+D5 would be written `r1+3`. If the jump is of two octaves, you'd write `r1++3` instead. In general, for a jump of n octaves, place n `+` signs.
- Next goes the value (duration). The base unit is the beat (quarter note). Durations are expressed with lowercase letters, where `a` represents `1`, `b` represents `2`, etc. If only one number is added, that's understood as a *divisor*: for example, `a` means *beat divided by one*, which is equivalent to a beat (quarter note); `b` means *beat divided by two*, which is equivalent to an eight note. `c` conveys an eight note. To convey a half note (two beats), use `ba` which means two divided by one. To convey a note with a value of 3/4, use `cd`.
- There are a few symbols to indicate certain modifications to the note:
   - `_` indicates this note is [ligated](https://en.wikipedia.org/wiki/Ligature_(music)) to the next one. When a note is ligated over bars, a dot can be added to the beginning of the note of the second bar.
   - `^` indicates a [fermata](https://en.wikipedia.org/wiki/Fermata).
   - `*` indicates an [appogiatura](https://en.wikipedia.org/wiki/Appoggiatura).
   - `~` indicates a [mordent](https://en.wikipedia.org/wiki/Mordent).
   - `!` indicates a [trill](https://en.wikipedia.org/wiki/Trill_(music)).
- Regarding the spacing of notes, tnote is oblivious to multiple spaces. However, I employ two rules to [pretty print](https://en.wikipedia.org/wiki/Prettyprint) its content. The two rules are:
   1. Notes on the same bar that are on different voices and start at the same time should be horizontally aligned
   2. If there's no overlap between two notes in different voices, then the note that starts later should be pushed to the right until its starting voice avoids overlap with the other note.
   - In other words: *notes from different voices that are aligned start at the same time; and notes from different voices that overlap graphically must also overlap in sound.* For rule #1, the reverse is also true: if two notes start at the same time, they should be aligned; but for rule #2, it is possible for two notes that overlap in time to not overlap in space; however *the converse cannot be true*.

The notes in a tnote voice can be abridged in the following ways, either within a bar or in a longer section:
   - If the previous note has the same octave, the octave can be omitted.
   - If the previous note has the same value (duration), the duration can be omitted.
   - Abridged notation is the default, but it is entirely optional. It is important to understand that the abridged notation is designed to *not* generate any ambiguities.
   - Besides being shorter, the abridged notation allows to see more clearly the changes in octave and duration between notes.

```
 4 R  0b     rC9   rC9   52B   0     rC9   rC9   rB8
 4 L  q9d r4 q9 r4 q8 r4 q8 r4 q9 r4 q9 r4 q4 r4 q4 r4
 ```

- Fingerings can be optionally added at the top of each voice, in a line of their own, chained by dashes (`-`).
- For representing fingerings, we use a left-to-right standard where `1` is the left pinky, `2` is the left ring finger, `3` is the left middle finger, `4` is the left index finger, `5` is the left thumb, `6` is the right thumb, `7` is the right index finger, `8` is the right middle finger, `9` is the right ring finger and `0` is the right pinky.
- Note: the digitations shown in the list of available music are my own and should *not* be considered authoritative.

```
       7---6-7-8-9--6--7--8-9-6-7-8----9---1
 4 R1  rCd 8 A C s1 rC s1 3 5 3 5 7    8b  rC
```

## Available music in tnote format

[List of available pieces](https://github.com/fpereiro/tnote/tree/master/music).

## Notes on learning music using tnote

### Dodecaphonic solfège

I love mental play (singing the notes of a melody or a harmony in my head) know and use the traditional solfège (do-re-mi-fa-sol-la-si), but it only has seven notes. The black keys have no names and singing "flat" or "sharp" breaks the stride of the solfège. This, over time, made me way less confident when playing music that uses lots of black keys.

So I assigned five sounds to the black keys. The sounds are nonsensical, but they are chosen to start with different letters than the traditional seven sounds. The five sounds are:

- *jo* (for C sharp or D Flat)
- *ka* (for D sharp or E flat)
- *pe* (for F sharp or G flat)
- *bu* (for G sharp or A flat)
- *te* (for A sharp or B flat)

The entire dodecaphonic scale, in solfège, is then:

**do jo re ka mi fa pe sol bu la te si**

### Digital solfège

I'm experimenting also with singing the digitation of each voice, which could be called **digital solfège**. By being able to pronounce the digitations, my hope is that they will be easier to memorize and retain. I have chosen to use the five vowels to represent the five fingers. Since I'm a native Spanish speaker, I choose the [Spanish sounds](https://en.wikipedia.org/wiki/Help:IPA/Spanish) for the vowels (`aeiou` in IPA). Each vowel is prepended by a consonant that is quite distinct in sound from the others; I took these consonants from the [Major System](https://en.wikipedia.org/wiki/Mnemonic_major_system). As a result, each of the ten fingers is associated with a syllable that is easy to pronounce and distinct from the others.

- `ta` corresponds to the left pinky (`1`).
- `ne` corresponds to the left ring finger (`2`).
- `mi` corresponds to the left middle finger (`3`).
- `ro` corresponds to the left index finger (`4`).
- `lu` corresponds to the left thumb (`5`).
- `sha` corresponds to the right thumb (`6`).
- `ke` corresponds to the right index (`7`).
- `fi` corresponds to the right middle finger (`8`).
- `po` corresponds to the right ring finger (`9`).
- `su` corresponds to the right pinky (`0`).

To perform digital solfège, sing the melody of the voice (using the original note pitches and durations) but singing the sound corresponding to the finger which plays the note. This is directly applicable to the piano or any instrument where each note is played with one finger.
