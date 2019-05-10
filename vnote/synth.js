// This module is a rewrite of Keith Horwood's amazing audiosynth library (https://github.com/keithwhor/audiosynth). Below is the license of the original code.

/*
The MIT License (MIT)

Copyright (c) 2013 Keith William Horwood

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function () {

   if ((! window.URL && ! window.webkitURL) || ! window.Blob) throw new Error ('This browser does not support AudioSynth');

   var Synth = window.Synth = {
      config: {
         notes: [261.63, 277.18, 293.66, 311.13, 329.63, 346.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88],
         baseOctave:    4,
         bitsPerSample: 16,
         channels:      1,
         sampleRate:    20000,
         volume:        0.4,
      }
   }

   Synth.modfunMaker = function (k1, k2) {
      return function (i, sampleRate, frequency, x) {
         return k1 * Math.sin (k2 * Math.PI * ((i / sampleRate) * frequency) + x);
      }
   }

   Synth.modfuns = dale.do ([[1, 2], [1, 2], [1, 4], [1, 8], [1, 0.5], [1, 0.25], [0.5, 2], [0.5, 4], [0.5, 8], [0.5, 0.5], [0.5, 0.25]], function (parameters) {
      return Synth.modfunMaker (parameters [0], parameters [1]);
   });

   Synth.cache = {};

   // The mute parameter exists for creating the note before it is played.
   Synth.play = function (note, instrument, options, mute) {
      var key = JSON.stringify ({note: note, instrument: instrument.name, options: options});
      if (! Synth.cache [key]) {
         Synth.cache [key] = new Audio (Synth.createSound (note, instrument, options));
         if (! mute) Synth.cache [key].play ();
      }
      else {
         if (mute) return;
         if (Synth.cache [key].paused) Synth.cache [key].play ();
         else Synth.cache [key].cloneNode ().play ();
      }
   }

   Synth.instruments = {
      piano: {
         attack: 0.002,
         dampen: function (sampleRate, frequency, volume) {
            return Math.pow (0.5 * Math.log ((frequency * volume) / sampleRate), 2);
         },
         wave: function (i, sampleRate, frequency, volume) {
            var volume = Math.pow (Synth.modfuns [0] (i, sampleRate, frequency, 0), 2);
            volume += 0.75 * Synth.modfuns [0] (i, sampleRate, frequency, 0.25);
            volume += 0.1  * Synth.modfuns [0] (i, sampleRate, frequency, 0.5);
            return Synth.modfuns [1] (i, sampleRate, frequency, volume);
         }
      }
   }

   // note.note 0-12, octave is 1 to 7, duration is in seconds
   Synth.createSound = function (note, instrument, options, raw) {

      options = dale.obj (options || {}, teishi.c (Synth.config), function (v, k) {return [k, v]});

      var frequency = options.notes [note.note - 1] * Math.pow (2, note.octave - options.baseOctave);
      var volume    = Math.round (options.volume * 32768);

      var dampen = instrument.dampen (options.sampleRate, frequency, volume);
      var data   = new Uint8Array (new ArrayBuffer (Math.ceil (options.sampleRate * note.duration * 2)));

      dale.do (dale.times (Math.round (options.sampleRate * instrument.attack), 0), function (i) {
         var value = volume * (i / (options.sampleRate * instrument.attack)) * instrument.wave (i, options.sampleRate, frequency, volume);
         data [i << 1] = value;
         data [(i << 1) + 1] = value >> 8;
      });

      var q1 = Math.round (options.sampleRate * instrument.attack), i = q1, value;
      while (i < q1 + Math.round (options.sampleRate * note.duration)) {
         value = 1 - ((i - (options.sampleRate * instrument.attack)) / (options.sampleRate * (note.duration - instrument.attack)));
         value = volume * Math.pow (value, dampen) * instrument.wave (i, options.sampleRate, frequency, volume);
         data [i << 1] = value;
         data [(i << 1) + 1] = value >> 8;
         i++;
      }

      var pack = function (c, arg) {
         return [new Uint8Array ([arg, arg >> 8]), new Uint8Array ([arg, arg >> 8, arg >> 16, arg >> 24])] [c];
      };

      var out = [
         'RIFF',
         pack (1, 4 + (8 + 24 /* chunk 1 length */) + (8 + 8/* chunk 2 length */)), // Length
         'WAVE',
         // chunk 1
         'fmt ', // Sub-chunk identifier
         pack (1, 16), // Chunk length
         pack (0, 1), // Audio format (1 is linear quantization)
         pack (0, options.channels),
         pack (1, options.sampleRate),
         pack (1, options.sampleRate * options.channels * options.bitsPerSample / 8), // Byte rate
         pack (0, options.channels * options.bitsPerSample / 8),
         pack (0, options.bitsPerSample),
         // chunk 2
         'data', // Sub-chunk identifier
         pack (1, data.length * options.channels * options.bitsPerSample / 8), // Chunk length
         data
      ];

      if (raw) return out;

      return (window.URL || window.webkitURL).createObjectURL (new Blob (out, {type: 'audio/wav'}));
   }

}) ();
