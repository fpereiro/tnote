/*
tnote - v1.0.0

Written by Federico Pereiro (fpereiro@gmail.com) and released into the public domain.

Please refer to readme.md to read the annotated source (but not yet!).
*/

(function () {

   // *** SETUP ***

   var dale = window.dale, teishi = window.teishi, lith = window.lith, c = window.c, B = window.B;
   var type = teishi.t, clog = console.log;

   B.prod = true;

   B.do ({from: {ev: 'initialize'}}, 'set', 'State', {});
   B.do ({from: {ev: 'initialize'}}, 'set', 'Data',  {});

   window.State = B.get ('State'), window.Data = B.get ('Data');

   c.ready (function () {
      B.mount ('body', Views.main ());
   });

   var FONTSIZE = 28;

   // *** TNOTE OBJECT ***

   var T = window.T = {};

   T.parse = function (text) {
      var last = function (a) {return a [a.length - 1]}
      var piece = {sections: []};
      dale.do (text.split ('\n'), function (voice) {
         if (! voice.length) return;
         if (voice.match (/^START SECTION/)) return piece.sections.push ({voices: {}});
         if (voice.match (/^END SECTION/))   return;
         if (! piece.sections.length) {
            voice = voice.split (/\s+/);
            return piece [voice [0]] = voice.slice (1).join (' ');
         }
         if (voice.match (/^\s*[a-zA-Z]+/)) {
            voice = voice.split (/\s+/);
            var value = voice.slice (1).join (' ');
            if (value.match (/^\d/)) value = parseInt (value);
            return last (piece.sections) [voice [0]] = value;
         }
         voice = voice.replace (/^\s*/, '').replace (/\s+$/, '').split (/\s+/);
         var pushnote = function (b, l, n) {
            var notes = piece.sections [piece.sections.length - 1].voices;
            if (! notes [l]) notes [l] = [];
            if (! notes [l] [b]) notes [l] [b] = [];
            notes [l] [b].push (n);
         }
         dale.do (voice, function (v, k) {
            if (k < 2) return;
            pushnote (voice [0] - 1, voice [1], v);
         });
      });

      // For certain voices, add bars that are only rests.
      dale.do (piece.sections, function (section) {
         dale.do (section.voices, function (voice) {
            dale.do (dale.times (voice.length, 0), function (k) {
               if (voice [k] === undefined) voice [k] = ['0*' + section.bpb];
            });
         });
      });

      // We parse the notes into a format [octave, pitch, duration, {'textual-duration': STRING, ligature: true|undefined, fermata: true|undefined, fingering: STRING|undefined}].
      // If it's a chord, instead it will look like [undefined, [[octave, pitch], [octave, pitch], ...], duration, {...}]
      var parseNote = function (note) {
         var output = [];
         if (note.match (/^0/)) {
            note = note.replace ('0', '');
            output [1] = 0;
         }
         else {
            var fingering;
            if (note.match (/[a-z]+/)) {
               fingering = note.match (/[a-z]+/) [0];
               note = note.replace (fingering, '');
            }
            var octave = parseInt (note [0]);
            var pitch  = note.replace (octave + '', '').match (/[0-9A-C+]+/) [0];
            if (pitch.length === 1) {
               output [0] = octave;
               output [1] = ! pitch.match (/[A-C]/) ? parseInt (pitch) : {'A': 10, 'B': 11, 'C': 12} [pitch];
            }
            else {
               output [1] = [];
               dale.do (pitch.split (''), function (pitch) {
                  if (pitch === '+') return octave++;
                  pitch = ! pitch.match (/[A-C]/) ? parseInt (pitch) : {'A': 10, 'B': 11, 'C': 12} [pitch];
                  if (output [1].length && output [1] [output [1].length - 1] [1] >= pitch) octave++;
                  output [1].push ([octave, pitch]);
               });
            }
         }

         var tduration = note.replace (/[FLPTM]+/g, '');
         var duration = tduration.split (/[*\/]/);
         if (duration.length === 1)      output [2] = 1;
         else if (duration.length === 3) output [2] = parseFloat (duration [1]) / parseFloat (duration [2]);
         else if (note.match (/\*/))     output [2] = parseFloat (duration [1]);
         else                            output [2] = 1 / parseFloat (duration [1]);

         output [3] = {'textual-duration': tduration.replace (duration [0], '')};
         if (note.match ('F')) output [3].fermata     = true;
         if (note.match ('P')) output [3].appogiatura = true;
         if (note.match ('L')) output [3].ligature    = true;
         if (note.match ('T')) output [3].trill       = true;
         if (note.match ('M')) output [3].mordent     = true;
         if (fingering)        output [3].fingering   = fingering;
         return output;
      }

      // We go through all the notes and convert them to the desired format. Voices will be now a flat array of notes (instead of having one array per bar).
      dale.do (piece.sections, function (section) {
         dale.do (section.voices, function (voice, voicename) {
            var flatvoice = [];
            dale.do (voice, function (bar, k) {
               dale.do (bar, function (note) {
                  flatvoice.push (parseNote (note));
               });
            });
            section.voices [voicename] = flatvoice;
         });
      });

      /*
         We go again through all the notes and add the following parameters to the object in the fourth position of each note: {
         offset: INTEGER (bars since the start),
         duration: integer (0 if the note is muted by a ligature, or the number of beats of the note if it is prolonged by a ligature),
         k: number of note in the voice
      }
      */
      dale.do (piece.sections, function (section) {
         dale.do (section.voices, function (voice) {
            var offset = 0;
            dale.do (voice, function (note, k) {
               note [3].k = k;
               if (note [3].duration === undefined) note [3].duration = note [2];
               note [3].offset = offset;
               offset += note [2] / section.bpb;
               if (Math.ceil  (offset) - offset < 0.02) offset = Math.ceil  (offset);
               if (offset - Math.floor (offset) < 0.02) offset = Math.floor (offset);
               // If this is the first note of a ligature, then mark the rest of the notes within the ligature.
               if (note [3].ligature && (k === 0 || ! voice [k - 1] [3].ligature)) {
                  dale.stop (voice.slice (k + 1), false, function (nextnote, k2) {
                     // We extend the original note to a maximum of four beats.
                     note [3].duration     = Math.min (4, note [3].duration + nextnote [2]);
                     nextnote [3].ligated = true;
                     if (! nextnote [3].ligature) return false;
                  });
               }
            });
         });
      });
      return piece;
   }

   T.playnote = function (note, bpm, volume, mute) {
      // If silent or ligated note, ignore the note.
      if (note [1] === 0 || note [3].ligated || volume === 0) return;

      volume = {volume: (volume || 1) * 0.5};

      // We add 0.5s to give it more sustain and a minimum length.
      if (type (note [1]) === 'integer') return Synth.play ({note: note [1], octave: note [0], duration: 60 / bpm * note [3].duration + 0.5}, Synth.instruments.piano, volume, mute);

      dale.do (note [1], function (n) {
         Synth.play ({note: n [1], octave: n [0], duration: 60 / bpm * note [3].duration + 0.5}, Synth.instruments.piano, volume, mute);
      });
   }

   T.play = function () {

      var section = B.get ('Data', 'piece', 'sections', B.get ('State', 'play', 'section'));

      var init = Date.now () + 200;

      var playnext = function (name, voice, k, repeat) {

         setTimeout (function () {

            var options = B.get ('State', 'play'), note = voice [k];
            var prevElem = document.getElementById (name + ':' + (k - 1)), currElem = document.getElementById (name + ':' + k);

            if (! options.playing) {
               if (prevElem) prevElem.classList.remove ('playing');
               return;
            }

            // If we run out of notes, or if the end parameter means that we should stop reproducing notes:
            if (! note || (options.end && note [3].offset >= options.end)) {
               if (prevElem) prevElem.classList.remove ('playing');
               // We start playing the whole thing again.
               return playnext (name, voice, 0, repeat + 1);
            }

            // If there's a note and its start is after options.start, we call the function again for the next note.
            if (note && (options.start - 1) > note [3].offset) return playnext (name, voice, k + 1, repeat);

            var offset = Date.now () - init - ((note [3].offset - (options.start - 1)) * 1000 * 60 / options.bpm * section.bpb);
            if (repeat) {
               var end   = options.end || Math.round (voice [voice.length - 1] [3].offset + voice [voice.length - 1] [2] / section.bpb);
               var start = (options.start || 1) - 1;

               offset -= repeat * (end - start) * (1000 * 60 / options.bpm * section.bpb);
            }

            // We will play this note when the time comes, but not now.
            if (offset < -3) return playnext (name, voice, k, repeat);

            if (currElem) currElem.classList.add ('playing');
            T.playnote (note, options.bpm, options.muted [name] ? options.backgroundVolume : 1);
            if (k > 0 && prevElem) prevElem.classList.remove ('playing');

            playnext (name, voice, k + 1, repeat);

         }, 3);
      }

      dale.do (section.voices, function (voice, name) {
         playnext (name, voice, 0, 0);
      });
   }

   T.draw = function () {
      var section = B.get ('Data', 'piece', 'sections', B.get ('State', 'play', 'section'));

      var map  = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 'A', 11: 'B', 12: 'C'};
      var cmap = {0: 'black', 1: 'darkred', 2: 'red', 3: 'darkorange', 4: 'green', 5: 'blue', 6: 'indigo', 7: 'violet'}

      var printPad = function (width) {
         return ['li', {class: 'float pad', style: 'width: ' + width + 'px'}];
      }

      var printLabel = function (barNumber, voiceName) {
         return ['li', {class: 'label', style: 'text-align: left'}, barNumber + ' : ' + voiceName];
      }

      var printNote = function (note, voiceName) {
         // This is a chord
         if (type (note [1]) === 'array') {
            var chord = note [1];
            var octave = note [0] = note [1] [0] [0];
            var nname = dale.do (chord, function (cnote, knote) {
               if (knote === 0 || octave === cnote [0]) return map [cnote [1]];
               octave
               var pluses = cnote [0] - octave - (cnote [1] <= chord [knote - 1] [1] ? 1 : 0);
               var output = dale.do (dale.times (pluses), function () {return '+'}).join ('');
               output += map [cnote [1]];
               octave = cnote [0];
               return output;
            }).join ('');
         }
         // This a single note.
         else var nname = map [note [1]];

         var notes = '';

         if (note [3].fermata)     notes += 'F';
         if (note [3].appogiatura) notes += 'P';
         if (note [3].mordent)     notes += 'M';
         if (note [3].trill)       notes += 'T';

         return ['li', B.ev ({class: 'note' + (note [3].duration === 0 ? ' ligature' : ''), id: voiceName + ':' + note [3].k}, ['onclick', 'click', 'note', note, name]), [
            B.get ('State', 'show', 'fin') ? ['span', {class: 'fingering'}, dale.do ((note [3].fingering || '').split (''), function (v) {
               var colors = {a: 'green', i: 'green', u: 'green', e: 'red', o: 'red'};
               return ['span', {style: 'font-weight: bold; color: ' + (colors [v] || 'black')}, v];
            })] : [],
            B.get ('State', 'show', 'oct') ? ['span', {class: 'octave', style: 'color: ' + cmap [note [0] || 0]}, note [0] || ''] : [],
            ['span', {class: 'pitch', style: 'color: ' + (B.get ('State', 'show', 'oct') ? 'black' : cmap [note [0] || 0])}, nname],
            B.get ('State', 'show', 'dur') ? ['span', {class: 'duration'}, note [3] ['textual-duration']] : [],
            B.get ('State', 'show', 'not') ? ['span', {class: 'notes'}, notes] : [],
            ['span', {class: 'ligature', style: 'color: red; font-weight: bold'}, note [3].ligature ? ' ‿' : ''],
         ]];
      }

      document.body.innerHTML += '<span id="test" style="display: inline-block"></span>';
      var getWidth = function (l) {
         document.getElementById ('test').innerHTML = lith.g (l, true);
         var width = Math.ceil (document.getElementById ('test').getBoundingClientRect ().width);
         return width;
      }

      var lineGroups = [], barsPerLine = 1;

      // split all the piece into lineGroups. Each lineGroup represents a group of notes that will be printed on the same set/group of lines, organized by voice. Strictly speaking, each lineGroup is an object where each key is a voice name and the value is an array of notes.
      dale.do (section.voices, function (voice, name) {
         dale.do (voice, function (note) {
            var k = Math.floor (note [3].offset / barsPerLine);
            if (! lineGroups [k])        lineGroups [k] = {};
            if (! lineGroups [k] [name]) lineGroups [k] [name] = [];
            lineGroups [k] [name].push (note);
            // Preload notes.
            setTimeout (function () {
               T.playnote (note, B.get ('State', 'play', 'bpm'), undefined, true);
            }, 1);
         });
      });

      dale.do (lineGroups, function (lineGroup, k) {
         var voiceNames = dale.keys (lineGroup);
         // printGroup is the output.
         var printGroup = dale.obj (voiceNames, function (k) {return [k, []]});
         // time offsets
         var toff       = dale.obj (voiceNames, function (k) {if (lineGroup [k] [0]) return [k, lineGroup [k] [0] [3].offset]});
         // space offsets
         var soff       = dale.obj (voiceNames, function (k) {return [k, 0]});
         // index tracks what is the next note to be printed on each voice
         var index      = dale.obj (voiceNames, function (k) {return [k, 0]});

         // We add the labels
         dale.do (printGroup, function (voice, name) {
            var label = printLabel ((k / barsPerLine) + 1, name);
            printGroup [name].push (label);
            soff [name] += getWidth (label);
         });

         // We print all notes that start at the same time and are at the leftmost in time. We call all notes that start at the same time a "ray"
         var printRay = function () {
            //if (k !== 1) return;
            // We find the earliest offset to be printed.
            var mint = Math.min.apply (Math, dale.fil (voiceNames, undefined, function (name) {
               var nextNote = lineGroup [name] [index [name]];
               // If there's no note for this index, we're done printing this voice, so we ignore it.
               if (nextNote) return nextNote [3].offset;
            }));

            // When to pad? If we were to pad at the end of the process, then you'd have to check for allowed overlaps of subsequent notes!
            // Better to let a ray of notes to be printed to deal with its own padding.
            // List which voices will be printed in the next ray, and which ones won't.
            // For the voices printed, find rightmost space offset.
            var print = [], maxs = 0;
            dale.do (voiceNames, function (name) {
               var nextNote = lineGroup [name] [index [name]];
               if (nextNote && Math.abs (nextNote [3].offset - mint) < 0.02) {
                  print.push (name);
                  if (maxs < soff [name]) maxs = soff [name];
               }
               else {
                  // For the voices not printed in this ray:
                  var prevNote = lineGroup [name] [index [name] - 1];
                  // if there's no previously printed note, there's nothing to do.
                  if (! prevNote) return;

                  // If the previously printed note ends before than the time when the current ray starts, increase the max space offset so that they don't overlap.
                  if (toff [name] < mint && ((mint - toff [name]) < 0.02) && soff [name] > maxs) maxs = soff [name];

                  // If the previously printed note (that started earlier in time) would start at the same spot that the ray is (or within FONTSIZE), move the ray to the right.
                  if ((soff [name] - getWidth (printNote (prevNote, name)) + (FONTSIZE / 2)) > maxs) {
                     maxs = Math.max (maxs, soff [name] - getWidth (printNote (prevNote, name)) + (FONTSIZE / 2));
                  }
               }
            });

            // If voices on the ray are more to the left than maxs, pad them. This contemplates both making them all start at the same time, and preventing overlaps in space that don't represent overlaps in time.
            // Notice we don't pad voices that we don't print now.
            dale.do (print, function (name) {
               if (soff [name] < maxs) {
                  printGroup [name].push (printPad (maxs - soff [name]));
                  soff [name] = maxs;
               }
               // We print the notes and update the offsets.
               var note = printNote (lineGroup [name] [index [name]], name);
               soff [name] += getWidth (note);
               toff [name] += lineGroup [name] [index [name]] [3].duration / section.bpb;
               index [name]++;
               printGroup [name].push (note);
            });

            var done = dale.stopNot (voiceNames, true, function (name) {
               return index [name] === lineGroup [name].length;
            });

            if (! done) printRay ();
         }
         printRay ();
         lineGroups [k] = printGroup;
      });
      document.body.removeChild (document.getElementById ('test'));

      return [
         ['h2', {class: 'title'}, section.title],
         dale.do (lineGroups, function (line) {
            return [
               dale.do (line, function (voice) {
                  return [
                     ['ul', {class: 'line'}, [
                        voice,
                        ['span', {class: 'clear'}],
                     ]],
                  ];
               }),
               ['br'], ['br'],
            ];
         })
      ];
   }

   // *** VIEWS ***

   var Views = {};

   Views.main = function () {
      var listeners = [
         ['setint', '*', function (x, value) {
            B.do ('set', x.path, parseInt (value));
         }],
         ['setfloat', '*', function (x, value) {
            B.do ('set', x.path, parseFloat (value));
         }],
      ];
      return B.view (['State', 'view'], {listen: listeners, ondraw: function () {
         if (! B.get ('State', 'view')) B.do ('set', ['State', 'view'], 'library');
      }}, function (x, view) {
         if (! view) return;
         return [
            ['style', [
               // general CSS
               ['body', {
                  'padding-top, padding-bottom': 15,
                  margin: 0,
                  'background-color': '#fcfcfc',
                  'font-family': '\'Inria Serif\', serif',
               }],
               ['span.action', {
                  cursor: 'pointer',
                  color: 'blue',
                  'text-decoration': 'underline',
               }],
               ['.pointer', {cursor: 'pointer'}],
               ['.float', {float: 'left'}],
               // play: top bar
               ['div.top', {
                  position: 'fixed',
                  'padding-top': 20,
                  height:   40,
                  top: 0,
                  'z-index': '1',
                  width: 1,
                  'background-color': '#CFCFCF',
                  'padding-left': 15,
               }],
               ['input.play', {
                  width: 60,
                  float: 'left',
                  'margin-left': 5
               }],
               // play: bars
               ['div.bars', {
                  'margin-top': 40,
                  // This line is for debugging note alignment
                  //'background-image': 'repeating-linear-gradient(90deg, black, black 1px, linen 1px, linen 5px)'
               }],
               ['ul.line', {
                  height: FONTSIZE,
                  width: 1,
                  display: 'inline-block',
               }],
               ['h2.title', {
                  width: 0.86,
                  'margin-left, margin-right': 0.07,
                  'margin-bottom': 20,
                  'text-align': 'center',
                  'font-size': 24,
               }],
               ['li.pad', {opacity: 0}],
               ['li.label, li.note', {
                  // li.pad should also have this property but adding it makes it take no width.
                  'list-style-type': 'none',
                  'border-radius': 10
               }],
               ['li.label', {
                  'font-size': FONTSIZE * 3/4, 'padding-top': FONTSIZE / 4,
                  float: 'left',
               }],
               ['li.note, li.label', {
                  color: 'black',
               }],
               ['li.note', {
                  cursor: 'pointer',
                  float: 'left',
                  'box-sizing': 'border-box',
                  'padding-left': FONTSIZE / 2,
                  border: 0,
                  'font-weight': 'normal',
               }, [
                  ['span', {'font-family': '\'Inria Serif\', serif'}],
                  //['span', {'font-family': 'Monospace'}],
                  ['span.ligature, span.duration, span.notes', {'font-size': FONTSIZE / 2, 'padding-top': FONTSIZE / 2}],
                  ['span.octave, span.pitch, span.fingering', {'font-size': FONTSIZE, 'padding-top': FONTSIZE / 2}],
                  ['span.clear', {clear: 'both'}],
               ]],
               ['li.ligature', {'padding-left': 0}],
               ['li.playing', {
                  'background-color': '#D33E43',
               }],
            ]],
            Views [view] (),
         ];
      });
   }

   Views.library = function () {
      var SHA = '71ea50be3aebd857b25775bfcd89690a24125bdd';
      var listeners = [
         ['retrieve', 'library', function () {
            c.ajax ('get', 'https://cdn.jsdelivr.net/gh/fpereiro/tnote@' + SHA + '/music/readme.md', {}, '', function (error, data) {
               if (error) return alert ('There was an error accessing the library.');
               var pieces = [];
               dale.do (data.body.split ('\n'), function (voice) {
                  if (! voice || voice.match (/^#/)) return;
                  voice = voice.split (':');
                  var title = voice [0];
                  pieces.push ([title, voice.join (':').replace (title + ': ', '')]);
               });
               B.do ('set', ['Data', 'library'], pieces);
            });
         }],
         ['load', 'piecelink', function (x, link) {
            c.ajax ('get', link, {}, '', function (error, data) {
               if (error) return alert ('There was an error accessing the library.');
               B.do ('set', ['Data', 'piece'], T.parse (data.body));
               B.do ('set', ['State', 'view'], 'play');
            });
         }],
         ['load', 'piecefile', function (x) {
            var file = c ('#piecefile').files [0];
            if (! file) return alert ('No file selected.');
            var reader = new FileReader ();
            reader.readAsText (file, 'UTF-8');
            reader.onload = function (e) {
               B.do ('set', ['Data', 'piece'], T.parse (e.target.result));
               B.do ('set', ['State', 'view'], 'play');
            }
            reader.onerror = function () {
               alert ('There was an error reading the file.');
            }
         }],
      ];
      return B.view (['Data', 'library'], {listen: listeners, ondraw: function () {
         B.do ('retrieve', 'library');
         B.do ('rem', 'State', 'play');
      }}, function (x, library) {
         return ['div', {style: 'padding-left: 20px;'}, [
            ['h2', ['Tnote Library (', ['a', {target: '_blank', href: 'https://github.com/fpereiro/tnote/tree/' + SHA + '/music/readme.md'}, 'link'], ')']],
            dale.do (library, function (piece) {
               return [
                  ['span', B.ev ({class: 'action'}, ['onclick', 'load', 'piecelink', piece [1]]), piece [0]],
                  ['span', {style: 'width: 20px; display: inline-block'}, ' '],
                  ['span', B.ev ({class: 'action'}, ['onclick', 'load', 'piecelink', piece [1].replace ('.txt', '_fin.txt')]), '(fingered)'],
                  ['br'],
                  ['br'],
               ];
            }),
            ['br'],
            ['h4', ['Or load file from your computer: ', ['input', B.ev ({value: 'Choose file', id: 'piecefile', type: 'file'}, ['onchange', 'load', 'piecefile'])]]],
            ['br'],
            ['h4', {style: 'position: absolute; top: 0; right: 30px'}, ['a', {target: '_blank', href: 'https://fpereiro.github.io/tnote'}, 'tnote project home']],
         ]];
      });
   }

   Views.play = function () {
      var listeners = [
         ['click', 'note', function (x, note) {
            T.playnote (note, B.get ('State', 'play', 'bpm'));
         }],
         ['make', 'play', function () {
            var piece   = B.get ('Data', 'piece');
            var section = piece.sections [B.get ('State', 'play', 'section') || 0];
            B.do ('set', ['State', 'play'], {
               section: B.get ('State', 'play', 'section') || 0,
               playing: false,
               muted:   dale.obj (section.voices, function (v, k) {
                  return [k, false];
               }),
               bpm:     section.bpm,
               start:   1,
               end:     (function () {
                  var voice = section.voices [dale.keys (section.voices) [0]];
                  var note = voice [voice.length - 1];
                  // the rounding is for pieces with notes divided by 3, 6 and the like.
                  return Math.round (note [3].offset + note [2] / section.bpb);
               }) (),
               backgroundVolume: B.get ('State', 'play', 'backgroundVolume') || 0,
            });
            B.do ('change', ['State', 'play', 'section']);
         }],
         ['change', ['State', 'play', 'playing'], function () {
            if (B.get ('State', 'play', 'playing')) T.play ();
         }],
         ['change', ['State', 'play', 'bpm'], function () {
            var section = B.get ('Data', 'piece', 'sections', B.get ('State', 'play', 'section'));
            if (! section) return;
            // Preload notes if bpm changes.
            dale.do (section.voices, function (voice, name) {
               if (B.get ('State', 'play', 'muted', name) && B.get ('State', 'play', 'backgroundVolume') === 0) return;
               dale.do (voice, function (note) {
                  setTimeout (function () {
                     T.playnote (note, B.get ('State', 'play', 'bpm'), undefined, true);
                  }, 1);
               });
            });
         }],
         ['change', ['State', 'show'], function (x) {
            B.do (x, 'change', ['State', 'play', 'section']);
         }],
      ];
      return [
         B.view (['State', 'play'], {attrs: {class: 'top'}, listen: listeners, ondraw: function () {
            if (! B.get ('State', 'play')) B.do ('make', 'play');
            if (! B.get ('State', 'show')) B.do ('set', ['State', 'show'], {fin: true, oct: true, dur: true, not: true});
         }}, function (x, play) {
            if (! play) return;
            return [
               ['div', {class: 'float'}, [
                  ['span', B.ev ({class: 'action', style: 'position: absolute; top: 20; right: 30'}, ['onclick', 'set', ['State', 'view'], 'library']), 'Back to library'],
                  ['select', B.ev ({style: 'width: 200px'}, [
                     ['onchange', 'set',    ['State', 'playing'], false],
                     ['onchange', 'setint', ['State', 'play', 'section']],
                     ['onchange', 'make', 'play'],
                  ]), dale.do (B.get ('Data', 'piece', 'sections'), function (section, k) {
                     return ['option', {selected: play.section === k, value: k}, section.title];
                  })],
                  ['button', B.ev ({style: 'margin-left: 5px', class: 'pointer'}, ['onclick', 'set', ['State', 'play', 'playing'], ! play.playing]), play.playing ? 'stop' : 'play'],
               ]],
               ['div', {class: 'float'}, [
                  ['input', B.ev ({class: 'play', readonly: play.playing, placeholder: 'start', value: play.start}, ['onchange', 'setint', ['State', 'play', 'start']])],
                  ['input', B.ev ({class: 'play', readonly: play.playing, placeholder: 'end',   value: play.end},   ['onchange', 'setint', ['State', 'play', 'end']])],
                  ['input', B.ev ({class: 'play', readonly: play.playing, placeholder: 'bpm',  value: play.bpm},    ['onchange', 'setint', ['State', 'play', 'bpm']])],
                  ['input', B.ev ({style: 'width: 150px', class: 'play', readonly: play.playing, placeholder: 'backgroundVolume', value: play.backgroundVolume},   ['onchange', 'setfloat', ['State', 'play', 'backgroundVolume']])],
               ]],
               ['div', {class: 'float'}, [
                  dale.do (play.muted, function (muted, voice) {
                     return [['label', voice], ['input', B.ev ({type: 'checkbox', checked: ! muted}, ['onclick', 'set', ['State', 'play', 'muted', voice], ! muted])]];
                  }),
                  ['span', {style: 'width: 30px; display: inline-block'}],
                  B.view (['State', 'show'], {tag: 'span'}, function (x, show) {
                     if (! show) return;
                     return dale.do (show, function (v, k) {
                        return [['label', k], ['input', B.ev ({type: 'checkbox', checked: v}, ['onclick', 'set', ['State', 'show', k], ! v])]];
                     })
                  }),
               ]],
            ];
         }),
         ['br'],
         B.view (['State', 'play', 'section'], {attrs: {class: 'bars'}}, function (x, section) {
            if (section !== undefined) return T.draw ();
         }),
      ];
   }

}) ();
