/*
vnote - v1.0.0

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

   // *** VNOTE OBJECT ***

   var V = window.V = {};

   V.parse = function (text) {
      var last = function (a) {return a [a.length - 1]}
      var piece = {sections: []};
      dale.do (text.split ('\n'), function (line) {
         if (! line.length) return;
         if (line.match (/^START SECTION/)) return piece.sections.push ({lines: {}});
         if (line.match (/^END SECTION/))   return;
         if (! piece.sections.length) {
            line = line.split (/\s+/);
            return piece [line [0]] = line.slice (1).join (' ');
         }
         if (line.match (/^\s*[a-zA-Z]+/)) {
            line = line.split (/\s+/);
            var value = line.slice (1).join (' ');
            if (value.match (/^\d/)) value = parseInt (value);
            return last (piece.sections) [line [0]] = value;
         }
         line = line.replace (/^\s*/, '').split (/\s+/);
         var pushnote = function (b, l, n) {
            var notes = piece.sections [piece.sections.length - 1].lines;
            if (! notes [l]) notes [l] = [];
            if (! notes [l] [b]) notes [l] [b] = [];
            notes [l] [b].push (n);
         }
         dale.do (line, function (v, k) {
            if (k < 2) return;
            pushnote (line [0] - 1, line [1], v);
         });
      });

      // Add bars that are only rests.
      dale.do (piece.sections, function (section) {
         dale.do (section.lines, function (line) {
            dale.do (dale.times (line.length, 0), function (k) {
               if (line [k] === undefined) line [k] = ['0*' + section.bpb];
            });
         });
      });

      // We parse the notes into a format [octave, pitch, duration, {ligature: true|undefined, fermata: true|undefined}].
      // If it's a chord, instead it will look like [undefined, [[octave, pitch], [octave, pitch], ...], duration, {...}]
      var parseNote = function (note) {
         var output = [];
         if (note.match (/^0/)) {
            note = note.replace ('0', '');
            output [1] = 0;
         }
         else {
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

         var duration = note.replace ('L', '').replace ('F', '').split (/[*\/]/);
         if (duration.length === 1)      output [2] = 1;
         else if (duration.length === 3) output [2] = parseFloat (duration [1]) / parseFloat (duration [2]);
         else if (note.match (/\*/))     output [2] = parseFloat (duration [1]);
         else                            output [2] = 1 / parseFloat (duration [1]);

         output [3] = {};
         if (note.match ('L')) output [3].ligature = true;
         if (note.match ('F')) output [3].fermata  = true;
         return output;
      }

      // We go through all the notes and convert them to the desired format. Lines will be now a flat array of notes (instead of having one array per bar.
      dale.do (piece.sections, function (section) {
         dale.do (section.lines, function (line, linename) {
            var flatline = [];
            dale.do (line, function (bar) {
               dale.do (bar, function (note) {
                  flatline.push (parseNote (note));
               });
            });
            section.lines [linename] = flatline;
         });
      });

      // We go again through all the notes and add the following parameters to the object in the fourth position of each note: {offset: INTEGER (bars since the start), duration: integer (0 if the note is muted by a ligature, or the number of beats of the note if it is prolonged by a ligature), k: number of note in the line}
      dale.do (piece.sections, function (section) {
         dale.do (section.lines, function (line) {
            var offset = 0;
            dale.do (line, function (note, k) {
               note [3].k = k;
               if (note [3].duration === undefined) note [3].duration = note [2];
               note [3].offset = offset;
               offset += note [2] / section.bpb;
               if (Math.ceil  (offset) - offset < 0.02) offset = Math.ceil  (offset);
               if (offset - Math.floor (offset) < 0.02) offset = Math.floor (offset);
               // If this is the first note of a ligature, then mark the rest of the notes within the ligature.
               if (note [3].ligature && (k === 0 || ! line [k - 1] [3].ligature)) {
                  dale.stop (line.slice (k + 1), false, function (nextnote, k2) {
                     // We extend the original note to a maximum of four beats.
                     note [3].duration     = Math.min (4, note [3].duration + nextnote [2]);
                     nextnote [3].duration = 0;
                     if (! nextnote [3].ligature) return false;
                  });
               }
            });
         });
      });
      return piece;
   }

   V.playnote = function (note, bpm, volume, mute) {
      // If silent or ligated note, ignore the note.
      if (note [1] === 0 || note [3].duration === 0 || volume === 0) return;

      volume = {volume: (volume || 1) * 0.5};

      // We add 0.5s to give it more sustain and a minimum length.
      if (type (note [1]) === 'integer') return Synth.play ({note: note [1], octave: note [0], duration: 60 / bpm * note [3].duration + 0.5}, Synth.instruments.piano, volume, mute);

      dale.do (note [1], function (n) {
         Synth.play ({note: n [1], octave: n [0], duration: 60 / bpm * note [3].duration + 0.5}, Synth.instruments.piano, volume, mute);
      });
   }

   V.play = function () {

      var section = B.get ('Data', 'piece', 'sections', B.get ('State', 'play', 'section'));

      var init = Date.now () + 100;

      var playnext = function (name, line, k, repeat) {

         setTimeout (function () {

            var options = B.get ('State', 'play'), note = line [k];

            // If we run out of notes, or we have to stop playing altogether, or if the end parameter means that we should stop reproducing notes.
            if (! note || ! options.playing || (options.end && note [3].offset >= options.end)) {
               document.getElementById (name + ':' + (k - 1)).className = '';
               if (! options.playing) return;
               // We start playing the whole thing again.
               return playnext (name, line, 0, repeat + 1);
            }

            // There might be no note if we're at the end of the line. If there's a note and its start is after options.start, we call the function again after a while.
            if (note && (options.start - 1) > note [3].offset) return playnext (name, line, k + 1, repeat);

            var offset = Date.now () - init - ((note [3].offset - (options.start - 1)) * 1000 * 60 / options.bpm * section.bpb);

            offset -= repeat * ((options.end || line [line.length - 1] [3].offset + line [line.length - 1] [3].duration) - (options.start || 0)) * (1000 * 60 / options.bpm);

            // We will play this note when the time comes.
            if (offset < -15) return playnext (name, line, k, repeat);

            document.getElementById (name + ':' + k).className = 'playing';
            V.playnote (note, options.bpm, options.muted [name] ? options.backgroundVolume : 1);
            if (k > 0) document.getElementById (name + ':' + (k - 1)).className = '';

            playnext (name, line, k + 1, repeat);

         }, 8);
      }

      dale.do (section.lines, function (line, name) {
         playnext (name, line, 0, 0);
      });
   }

   V.draw = function () {
      var section = B.get ('Data', 'piece', 'sections', B.get ('State', 'play', 'section'));

      var map  = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 'A', 11: 'B', 12: 'C'};
      var cmap = {0: 'black', 1: 'red', 2: 'orange', 3: 'yellow', 4: 'green', 5: 'blue', 6: 'indigo', 7: 'violet'}

      var printlines = [], barsperline = window.innerWidth > 900 ? 2 : 1, width = window.innerWidth > 900 ? 100 : 50;

      dale.do (section.lines, function (line, name) {
         dale.do (line, function (note) {
            var k = Math.floor (note [3].offset / barsperline);
            if (! printlines [k])        printlines [k] = {};
            if (! printlines [k] [name]) printlines [k] [name] = [];
            printlines [k] [name].push (note);
            // Preload notes
            setTimeout (function () {
               V.playnote (note, B.get ('State', 'play', 'bpm'), undefined, true);
            }, 1);
         });
      });

      return [
         ['style', [
            ['div.bars', {
               'padding-left': 15,
               'background-size': width + 'px',
               'background-position': 15 + (width * 0.5) + 'px',
               'background-image': 'linear-gradient(to right, #222222 1px, transparent 1px)',
            }],
            ['li.label', {width: width * 0.5, color: 'black'}],
         ]],
         dale.do (printlines, function (printline, k) {
            return [
               dale.do (printline, function (noteline, name) {
                  return ['ul', [
                     ['li', {class: 'label', style: 'text-align: left'}, name],
                     dale.do (noteline, function (note, i) {
                        // This is a chord
                        if (type (note [1]) === 'array') {
                           var chord = note [1];
                           var octave = note [0] = note [1] [0] [0];
                           var nname = dale.do (chord, function (cnote, k) {
                              if (k === 0 || octave === cnote [0]) return map [cnote [1]];
                              octave
                              var pluses = cnote [0] - octave - (cnote [1] <= chord [k - 1] [1] ? 1 : 0);
                              var output = dale.do (dale.times (pluses), function () {return '+'}).join ('');
                              output += map [cnote [1]];
                              octave = cnote [0];
                              return output;
                           }).join ('');
                        }
                        // This a single note.
                        else var nname = map [note [1]];

                        return ['li', B.ev ({
                           id: name + ':' + note [3].k,
                           style: (note [0] === 2 || note [0] === 3 ? 'color: black;' : '') + (note [3].duration === 0 ? 'border-left: solid 3px red;' : '') + 'cursor: pointer; width: ' + (note [2] * width) + 'px; background-color: ' + cmap [note [0] || 0]
                        }, ['onclick', 'click', 'note', note, name]), nname];
                     }),
                     //dale.keys (line) [0] === name ? ['li', {class: 'label', style: 'text-align: center'}, Math.round (k * barsperline + linelength / section.bpb)] : [],
                     ['br'],
                  ]];
               }),
               ['br'],
            ];
         }),
      ];
   }

   // *** VIEWS ***

   var Views = {};

   Views.main = function () {
      var routes = [
         ['setint', '*', function (x, value) {
            B.do ('set', x.path, parseInt (value));
         }],
         ['setfloat', '*', function (x, value) {
            B.do ('set', x.path, parseFloat (value));
         }],
      ];
      return B.view (['State', 'view'], {listen: routes, ondraw: function () {
         if (! B.get ('State', 'view')) B.do ('set', ['State', 'view'], 'library');
      }}, function (x, view) {
         if (! view) return;
         return [
            ['style', [
               ['body', {
                  'padding-top, padding-bottom': 15,
                  'font-family': 'mono',
                  margin: 0,
               }],
               ['span.action', {
                  cursor: 'pointer',
                  color: 'blue',
                  'text-decoration': 'underline',
               }],
               ['.pointer', {cursor: 'pointer'}],
               ['.float', {
                  float: 'left',
               }],
               ['ul', {
                  'margin, padding': 0,
                  'border-bottom': 'solid 3px transparent',
               }],
               ['li', {
                  float: 'left',
                  'list-style-type': 'none',
                  color: 'white',
                  'font-weight': 'bold',
                  'text-align': 'left',
                  'box-sizing': 'border-box',
                  'border-left': 'solid 2px white'
               }],
               ['input.play', {
                  width: 60,
                  float: 'left',
               }],
               ['.playing', {
                  'filter': 'invert(30%)'
               }],
               ['div.select', {
                  width: 0.2,
                  position: 'fixed',
                  'top, right': 20,
               }, ['select', {'margin-bottom': 10}]],
            ]],
            Views [view] (),
         ];
      });
   }

   Views.library = function () {
      var SHA = 'd3d5d50b4999ffb122aad92399585647f936e81b';
      var routes = [
         ['retrieve', 'library', function () {
            c.ajax ('get', 'https://cdn.jsdelivr.net/gh/fpereiro/vnote@' + SHA + '/music/readme.md', {}, '', function (error, data) {
               if (error) return alert ('There was an error accessing the library.');
               var pieces = [];
               dale.do (data.body.split ('\n'), function (line) {
                  if (! line || line.match (/^#/)) return;
                  line = line.split (':');
                  var title = line [0];
                  pieces.push ([title, line.join (':').replace (title + ': ', '')]);
               });
               B.do ('set', ['Data', 'library'], pieces);
            });
         }],
         ['load', 'piece', function (x, link) {
            c.ajax ('get', link, {}, '', function (error, data) {
               if (error) return alert ('There was an error accessing the library.');
               B.do ('set', ['Data', 'piece'], V.parse (data.body));
               B.do ('set', ['State', 'view'], 'play');
            });
         }],
         ['load', 'piecefile', function (x) {
            var file = c ('#piecefile').files [0];
            if (! file) return alert ('No file selected.');
            var reader = new FileReader ();
            reader.readAsText (file, 'UTF-8');
            reader.onload = function (e) {
               B.do ('set', ['Data', 'piece'], V.parse (e.target.result));
               B.do ('set', ['State', 'view'], 'play');
            }
            reader.onerror = function () {
               alert ('There was an error reading the file.');
            }
         }],
      ];
      return B.view (['Data', 'library'], {listen: routes, ondraw: function () {
         B.do ('retrieve', 'library');
         B.do ('rem', 'State', 'play');
      }}, function (x, library) {
         return ['div', {style: 'padding-left: 20px;'}, [
            ['h2', ['Tnote Library (', ['a', {target: '_blank', href: 'https://github.com/fpereiro/vnote/tree/' + SHA + '/music/readme.md'}, 'link'], ')']],
            dale.do (library, function (piece) {
               return [
                  ['span', B.ev ({class: 'action'}, ['onclick', 'load', 'piece', piece [1]]), piece [0]],
                  ['br'],
                  ['br'],
               ];
            }),
            ['br'],
            ['h4', ['Or load file from your computer: ', ['input', B.ev ({value: 'Choose file', id: 'piecefile', type: 'file'}, ['onchange', 'load', 'piecefile'])]]],
            ['br'],
            ['h4', {style: 'position: absolute; top: 0; right: 30px'}, ['a', {target: '_blank', href: 'https://fpereiro.github.io/vnote'}, 'Vnote project home']],
         ]];
      });
   }

   Views.play = function () {
      var routes = [
         ['click', 'note', function (x, note) {
            V.playnote (note, B.get ('State', 'play', 'bpm'));
         }],
         ['make', 'play', function () {
            var piece   = B.get ('Data', 'piece');
            var section = piece.sections [B.get ('State', 'play', 'section') || 0];
            B.do ('set', ['State', 'play'], {
               section: B.get ('State', 'play', 'section') || 0,
               playing: false,
               muted:   dale.obj (section.lines, function (v, k) {
                  return [k, false];
               }),
               bpm:     section.bpm,
               start:   1,
               end:     (function () {
                  var line = section.lines [dale.keys (section.lines) [0]];
                  var note = line [line.length - 1];
                  return note [3].offset + note [2] / section.bpb;
               }) (),
               backgroundVolume: B.get ('State', 'play', 'backgroundVolume') || 0,
            });
            B.do ('change', ['State', 'play', 'section']);
         }],
         ['change', ['State', 'play', 'playing'], function () {
            if (B.get ('State', 'play', 'playing')) V.play ();
         }],
      ];
      return [
         ['style', [
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
         ]],
         B.view (['State', 'play'], {attrs: {class: 'top'}, listen: routes, ondraw: function () {
            if (! B.get ('State', 'play')) B.do ('make', 'play');
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
               ['style', ['input.play', {'margin-left': 5}]],
               ['div', {class: 'float'}, [
                  ['input', B.ev ({class: 'play', readonly: play.playing, placeholder: 'start', value: play.start}, ['onchange', 'setint', ['State', 'play', 'start']])],
                  ['input', B.ev ({class: 'play', readonly: play.playing, placeholder: 'end',   value: play.end},   ['onchange', 'setint', ['State', 'play', 'end']])],
                  ['input', B.ev ({class: 'play', readonly: play.playing, placeholder: 'bpm',  value: play.bpm},  ['onchange', 'setint', ['State', 'play', 'bpm']])],
                  ['input', B.ev ({style: 'width: 150px', class: 'play', readonly: play.playing, placeholder: 'backgroundVolume', value: play.backgroundVolume},   ['onchange', 'setfloat', ['State', 'play', 'backgroundVolume']])],
               ]],
               ['div', {class: 'float'}, [
                  dale.do (play.muted, function (muted, line) {
                     return [['label', line], ['input', B.ev ({type: 'checkbox', checked: ! muted}, ['onclick', 'set', ['State', 'play', 'muted', line], ! muted])]];
                  })
               ]],
            ];
         }),
         ['br'],
         ['style', [
            ['div.bars', {
               'margin-top':   40,
            }],
         ]],
         B.view (['State', 'play', 'section'], {attrs: {class: 'bars'}}, function (x, section) {
            if (section === undefined) return;
            return V.draw ();
         }),
      ];
   }

}) ();
