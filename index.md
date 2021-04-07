## tnote

> "Y es música, música, siempre, sí." -- Norberto Napolitano

tnote is a textual musical notation. It is based on the following principles:

1. **Use text to represent music**: tnote uses an open text format to represent and transmit music. The format is humanly readable and writable; it is also easily parseable by computers, facilitating both analysis and artistic creation with the help of computers.
2. **Treat all twelve notes as equal citizens**: tnote uses a single number to represent each of the twelve notes of the [octave](https://en.wikipedia.org/wiki/Equal_temperament). There is no concept of sharps or flats.
3. **Use the graphical possibilities of the digital age**: the widespread availability of computers allows faithful reproduction of alternate graphical arrangements to express music. While tnote is textual, the tnote interface it uses colors and levels of scale to make the music more readable and memorable.
4. **Use the interactive possibilities of the digital age**: a digital music notation allows for interactivity, which can be an aid to learning and memorizing. The tnote interface allows reproduction of individual notes, voices and entire pieces, to assist reading and to allow exploration.
5. **Stimulate the exploration of novel approaches to notate music**: the standard musical notation is a refined, time-tested and indisputable tool for reading and writing music. This project considers, however, that the time is ripe to explore alternatives and improvements to it. tnote is a contribution to this latent potential.

## Using tnote

The tnote interface runs on any modern browser and requires no installation. You can find the latest version [here](https://fpereiro.github.io/tnote/tnote/tnote.html).

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

   The stop is represented by the number `0`.

3. The octave of the note is expressed as either a number or a color (or both):

   - The first octave is represented by either `1` or the color red.
   - The second octave is represented by either `2` or the color orange.
   - The third octave is represented by either `3` or the color yellow.
   - The fourth octave is represented by either `4` or the color green.
   - The fifth octave is represented by either `5` or the color blue.
   - The sixth octave is represented by either `6` or the color indigo.
   - The seventh octave is represented by either `7` or the color violet.

   The octave starts at the pitch class 1 (C). For example, [A440](https://en.wikipedia.org/wiki/A440_(pitch_standard)) belongs to octave 4.

4. The [value](https://en.wikipedia.org/wiki/Note_value) (duration) of the note is expressed by either a fraction or a multiplier.

5. Chords are expressed as a single note segment with the note numbers being written in succession, from the lowest to the highest. The octave color of the segment belongs to that of the *lower* note.

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
1 R2  0*3 41
```

Notes are separated by spaces. Multiple spaces can be used to align the notes in a more readable way. Here's an example of an entire bar in *unabridged notation*:

```
 4 R  0/2       4C9/2     4C9/2     52B/2     0/2       4C9/2     4C9/2     4B8/2
 4 L  39/4 44/4 39/4 44/4 38/4 44/4 38/4 44/4 39/4 44/4 39/4 44/4 34/4 44/4 34/4 44/4
```

As for the notes, this is how you write them:

- Start with the octave, which is a number between 1 and 7.
- Immediately after, place the pitch class of the note, which is 1-9 or A, B or C. For example, C4 would be written 41; and G5 would be written 58; while B3 would be written 3C.
- If the note is a rest, you write `0` and don't add an octave.
- If the note is a chord, start writing the octave number of the first note. Then write the notes of the chord sorted from low to high. If between two contiguous notes on the chord there's a jump of more than an octave (for example: C4 to D5), put a + in the middle. For example, the chord C4+D5 would be written `41+3`. If the jump is of two octaves, you'd write `41++3` instead. In general, for a jump of n octaves, place n `+` signs.
- Next goes the duration. If the duration is exactly one beat (a quarter note), a `/1` should be added. If the note is a fraction expressible as 1 / n (where n is an integer), you would place `/n` after the note. For example, for half a beat you would write `41/2`. For a quarter beat, `41/4`. For a third of a beat, `41/3`.
- If the note is a multiple of a beat, you'd write `41*2` (for twice a beat), `41*4` (for four times a beat), etc.
- You can also multiply a note by a number. For example, for one and a half beats, you can write `41*1.5`.
- You can also multiply by a fraction. For the same note as above, you can write `41*3/2`.
- There are a few capital letters to indicate certain modifications to the note:
   - `L` indicates this note is [ligated](https://en.wikipedia.org/wiki/Ligature_(music)) to the next one.
   - `F` indicates a [fermata](https://en.wikipedia.org/wiki/Fermata).
   - `P` indicates an [appogiatura](https://en.wikipedia.org/wiki/Appoggiatura).
   - `M` indicates a [mordent](https://en.wikipedia.org/wiki/Mordent).
   - `T` indicates a [trill](https://en.wikipedia.org/wiki/Trill_(music)).
- Regarding the spacing of notes, the tnote interface is oblivious to multiple spaces. However, I employ two rules to [pretty print](https://en.wikipedia.org/wiki/Prettyprint) its content. The two rules are:
   1. Notes on the same bar that are on different voices and start at the same time should be horizontally aligned
   2. If there's no overlap between two notes in different voices, then the note that starts later should be pushed to the right until its starting voice avoids overlap with the other note.
   - In other words: *notes from different voices that are aligned start at the same time; and notes from different voices that overlap graphically must also overlap in sound.* For rule #1, the reverse is also true: if two notes start at the same time, they should be aligned; but for rule #2, it is possible for two notes that overlap in time to not overlap in space; however *the converse cannot be true*.
- The notes in a tnote voice can be abridged in the following ways, either within a bar or in a longer section:
   - If the previous note has the same octave, the octave can be omitted. The only exception is chords, which always must show the octave to make it clear that it is a chord.
   - If the previous note has the same value (duration), the duration can be omitted.
   - Abridged notation is the default, but it is entirely optional. It is important to understand that the abridged notation is designed to *not* generate any ambiguities.
   - Besides being shorter, the abridged notation allows to see more clearly the changes in octave and duration between notes.

```
 4 R  0/2     4C9   4C9   52B   0     4C9   4C9   4B8
 4 L  39/4 44 39 44 38 44 38 44 39 44 39 44 34 44 34 44
 ```

- Fingerings can be optionally added at the end of each bar, after a double pipe (`||`). They can also be pretty printed to give a clearer notion of how they combine together.
- For representing fingerings, we use the standard of `1` for thumb, `2` for index finger, `3` for middle finger, `4` for ring finger and `5` for the pinky. If the finger is from the opposite hand (for example, if for a right hand voice the digitation is done by a finger from the left hand), an `x` is added in front of the digitation. Finally, for chords, the fingerings are grouped with parenthesis, to indicate they happen at the same time.
- Note: the digitations shown in the list of available music are my own and should *not* be considered authoritative.

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

I'm experimenting also with singing the digitation of each voice, which could be called **digital solfège**. I have chosen to use the five vowels to represent the five fingers. Since I'm a native Spanish speaker, I choose the [Spanish sounds](https://en.wikipedia.org/wiki/Help:IPA/Spanish) for the vowels (`aeiou` in IPA).

- `a` corresponds to the thumb (`1`).
- `e` corresponds to the index (`2`).
- `i` corresponds to the middle finger (`3`).
- `o` corresponds to the ring finger (`4`).
- `u` corresponds to the little finger (`5`).

To perform digital solfège, sing the melody of the voice (using the right note values and durations) but using the vowel corresponding to the finger which plays the note. This is directly applicable to the piano or any instrument where each note is played with a determinate finger.
