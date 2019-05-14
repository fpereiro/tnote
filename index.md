## Vnote

Vnote is an alternative and experimental musical notation. It is based on the following principles:

1. **Treat all twelve notes as equal citizens**: Vnote uses a single number to represent each of the twelve notes of the [octave](https://en.wikipedia.org/wiki/Equal_temperament). There is no concept of sharps or flats.
2. **Use the graphical possibilities of the digital age**: the widespread availability of computers allows faithful reproduction of alternate graphical arrangements to express music. Vnote uses colors to represent octaves and line widths to express note durations.
3. **Use the interactive possibilities of the digital age**: a digital music notation allows for interactivity, which can be an aid to learning and memorizing. Vnote allows reproduction of individual notes, note lines and entire pieces, to assist reading and to allow exploration.
4. **Share music through an open format based in JSON**: Vnote stores music in an open source format based on JSON, which is easy to parse and to edit.
5. **Stimulate the exploration of approaches to express music**: the standard musical notation is a refined, time-tested and indisputable tool for writing music. This project considers, however, that the time is ripe to explore alternatives and improvements to it. Vnote is a contribution to this latent potential.

## Using Vnote

Vnote runs on any modern browser and requires no installation. You can find the latest version [here](https://fpereiro.github.io/vnote/vnote/vnote.html).

Vnote uses Keith Horwood's amazing [audiosynth library](https://github.com/keithwhor/audiosynth) to generate the synthetized piano sounds.

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

## The tnote format

Vnote uses a text format to store and share music, called *tnote*. tnote is designed to be easy to write and moderately readable, while being very compact. This is how a tnote file looks like:

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

As for the `notes`, they are organized in `notelines`. A `noteline` lists all the notes belonging to a certain line and a certain bar. This is the basic structure:

```
 NN name notes...
```

`NN` stands for the bar number. `name` is the name of the line (for example, `rh1` if it's the first line of the right hand of a piano piece). Here's an example:

```
1 rh2 0*3 41
```

Notes are separated by spaces. Multiple spaces can be used to align the notes in a more readable way. Here's an example of an entire bar.

```
 4 rh  0/2       4C9/2     4C9/2     52B/2     0/2       4C9/2     4C9/2     4B8/2
 4 lh  39/4 44/4 39/4 44/4 38/4 44/4 38/4 44/4 39/4 44/4 39/4 44/4 34/4 44/4 34/4 44/4
```

As for the notes, this is how you write them:

- Start with the octave, which is a number between 1 and 7.
- Immediately after, place the pitch class of the note, which is 1-9 or A, B or C. For example, C4 would be written 41; and G5 would be written 58; while B3 would be written 3C.
- If the note is a rest, you write `0` and don't add an octave.
- If the note is a chord, start writing the octave number of the first note. Then write the notes of the chord sorted from low to high. If between two contiguous notes on the chord there's a jump of more than an octave (for example: C4 to D5), put a + in the middle. For example, the chord C4+D5 would be written `41+3`. If the jump is of two octaves, you'd write `41++3` instead. In general, for a jump of n octaves, place n `+` signs.
- Next goes the duration. If the duration is exactly one beat (a quarter note), nothing should be added. If the note is a fraction expressible as 1 / n (where n is an integer), you would place `/n` after the note. For example, for half a beat you would write `41/2`. For a quarter beat, `41/4`. For a third of a beat, `41/3`.
- If the note is a multiple of a beat, you'd write `41*2` (for twice a beat), `41*4` (for four times a beat), etc.
- You can also multiply a note by a number. For example, for one and a half beats, you can write `41*1.5`.
- You can also multiply by a fraction. For the same note as above, you can write `41*3/2`.
- Finally, add a `L` if the note is ligated to the next one.

tnote is oblivious to multiple spaces. However, I employ two rules to [pretty print](https://en.wikipedia.org/wiki/Prettyprint) its content. The two rules are: 1) notes on the same bar that start at the same time should be horizontally aligned; and 2) if there's no overlap between two notes in different lines, then the note that starts later should be pushed to the right until its starting line avoids intersection with the other note.

## Available music in tnote format

Go [here](https://github.com/fpereiro/vnote/tree/master/music) to see a list of available pieces.

I am currently working on a script to convert pieces into tnote from the [wonderful Humdrum music repository](https://github.com/humdrum-tools/humdrum-data), which contains hundreds of pieces in a format named *kern*. This holds the promise of creating a corpus of tnote pieces while avoiding hand transcription (though proofreading will probably still be needed).

This is a good place to thank the [The Center for Computer Assisted Research in the Humanities](https://ccrma.stanford.edu/CCRMA/newOverview/assisted.html) for making digitized transcriptions of music readily available.

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

An alternate idea I'm playing with is to sing the numbers from 1 to 12 instead of a nonsensical sound. This has the advantage that the mathematical relationship between notes starts to be immediately more clear and in the forefront of your mind. The disadvantage is that it's not so easy to pronounce numbers in a quick and unambiguous way (at least not in the languages I know).

In English, I'm working with these sounds: "ua", "two", "tri", "fo", "fai", "si", "sev", "eit", "nai", "te", "il", "tue".
