(function () {

   // *** SETUP ***

   var dale  = window.dale, teishi = window.teishi, lith = window.lith, c = window.c, B = window.B;

   var type = teishi.t, log = teishi.l;

   window.State = B.store.State = {};

   B.prod = true;

   var V = window.V = {};

   V.parse = function (notes) {

      var lines = {};

      dale.do (teishi.c (notes), function (noteline) {
         var key = noteline [0];

         if (! lines [key]) lines [key] = [];
         dale.do (noteline, function (note, k) {
            if (k > 0) lines [key].push (note);
         });
      });

      dale.do (lines, function (line) {
         var elapsed = 0;
         dale.do (line, function (note, k) {
            note [3] = note [3] || {};
            note [3].k = k;
            note [3].dur = note [1];
            if (note [3].lig && (k === 0 || ! line [k - 1] [3].lig)) {
               dale.stop (line, false, function (nextnote, k2) {
                  if (k2 < k + 1) return;
                  nextnote [3] = nextnote [3] || {};
                  nextnote [3].mute = true;
                  note [3].dur += nextnote [1];
                  if (! nextnote [3].lig) return false;
               });
               // limit maximum duration of ligature
               if (note [3].dur > 4) note [3].dur = 4;
            }
            note [3].t = elapsed;
            elapsed += note [1];
         });
      });

      return lines;
   }

   V.playnote = function (note, bpm) {
      // If silent note, ignore the note.
      if (note [0] === 0) return;
      var map = {1: 'C', 2: 'C#', 3: 'D', 4: 'D#', 5: 'E', 6: 'F', 7: 'F#', 8: 'G', 9: 'G#', 10: 'A', 11: 'A#', 12: 'B'};

      // We add 0.5s to give it more sustain and a minimum length.
      if (type (note [0]) === 'integer') return B.get ('State', 'instrument').play (map [note [0]], note [2], 60 / bpm * note [3].dur + 0.5);

      dale.do (note [0], function (n) {
         B.get ('State', 'instrument').play (map [n [0]], n [1], 60 / bpm * note [3].dur + 0.5);
      });
   }

   V.play = function (lines, options) {

      var init = Date.now () + 100, done = 0;

      B.do ('set', ['State', 'playing'], true);

      var playNext = function (name, line, k, repeat) {

         var note = line [k];

         if (note && options.start && options.start > note [3].t) return playNext (name, line, k + 1, repeat);

         if (! note || ! B.get ('State', 'playing') || (options.stop && note [3].t >= options.stop)) {
            document.getElementById (name + ':' + (k - 1)).className = '';
            if (B.get ('State', 'playing')) playNext (name, line, 0, repeat + 1);
            return;
         }

         var offset = Date.now () - init - ((note [3].t - (options.start || 0)) * 1000 * 60 / options.bpm);

         offset -= repeat * ((options.stop || line [line.length - 1].t + line [line.length - 1].dur) - (options.start || 0)) * (1000 * 60 / options.bpm);

         if (offset > -15) {

            if (B.get.apply (null, options.lines).indexOf (name) !== -1 && ! note [3].mute) V.playnote (note, options.bpm, offset);

            document.getElementById (name + ':' + k).className = 'playing';
            if (k > 0) document.getElementById (name + ':' + (k - 1)).className = '';

            window.setTimeout (function () {
               playNext (name, line, k + 1, repeat);
            }, 3);
         }
         else window.setTimeout (function () {
            playNext (name, line, k, repeat);
         }, 3);
      }

      dale.do (dale.keys (lines), function (name) {
         playNext (name, lines [name], 0, 0);
      });

   }

   V.draw = function (piece, section) {

      piece = B.get ('Data', piece);

      var map0 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 'A', 11: 'B', 12: 'C'};
      var map1 = {0: 0, 1: 'D', 2: 'J', 3: 'R', 4: 'K', 5: 'M', 6: 'F', 7: 'P', 8: 'S', 9: 'B', 10: 'L', 11: 'T', 12: 'Z'};

      var cmap = {0: 'black', 1: 'red', 2: 'orange', 3: 'yellow', 4: 'green', 5: 'blue', 6: 'indigo', 7: 'violet'}

      var lines = [];

      dale.do (piece.sections [section].notes, function (noteline, name) {
         dale.do (noteline, function (note, k) {
            var linek = Math.floor (note [3].t / (piece.sections [section].bpb * B.get ('State', 'config', 'barsperline')));
            if (! lines [linek]) lines [linek] = {};
            if (! lines [linek] [name]) lines [linek] [name] = [];
            lines [linek] [name].push (note);
         });
      });

      return dale.do (lines, function (line, k) {
         return [
            dale.do (line, function (noteline, name) {
               var linelength = noteline [noteline.length - 1] [1] + noteline [noteline.length - 1] [3].t - noteline [0] [3].t;
               return ['ul', [
                  ['li', {class: 'label', style: 'text-align: left'}, name],
                  dale.do (noteline, function (note, i) {
                     var nname = map0 [note [0]];
                     // This is a chord
                     if (type (note [0]) === 'array') {
                        var chord = note [0];
                        note [2] = chord [0] [1];
                        var octave = note [2];
                        nname = dale.do (chord, function (cnote) {
                           return dale.do (dale.times (cnote [1] - octave), function () {
                              octave++;
                              return '+';
                           }).join ('') + map0 [cnote [0]];
                        }).join ('');
                     }
                     var lig = note [3].mute ? 'border-left: solid 3px red;' : '';
                     if (note [0] === 0) note [2] = 0;
                     var font = (note [2] === 2 || note [2] === 3) ? 'color: black;' : '';

                     return ['li', B.ev ({
                        id: name + ':' + note [3].k,
                        style: font + lig + 'cursor: pointer; width: ' + (note [1] * B.get ('State', 'config', 'width')) + 'px; background-color: ' +  cmap [note [2]]
                     }, ['onclick', 'play', 'note', note]), nname];
                  }),
                  dale.keys (line) [0] === name ? ['li', {class: 'label', style: 'text-align: center'}, k * B.get ('State', 'config', 'barsperline') + linelength / piece.sections [section].bpb] : [],
                  ['br'],
               ]];
            }),
            ['br'],
         ];
      });
   }

   var view = function () {
      return B.view (['Data'], function (x, Data) {
         return B.view (['State'], {listen: [
            ['setint', '*', function (x, value) {
               B.do ('set', x.path, parseInt (value));
            }],
            ['play', 'note', function (x, note) {
               if (! note) return;
               V.playnote (note, B.get ('State', 'play', 'bpm'));
            }],
            ['change', ['State', 'playing'], function (x) {
               if (! B.get ('State', 'playing')) return;
               var section = B.get ('Data', B.get ('State', 'play', 'piece'), 'sections', B.get ('State', 'play', 'section'));
               if (! section) return;
               V.play (section.notes, {
                  bpm:   B.get ('State', 'play', 'bpm'),
                  start: (B.get ('State', 'play', 'start') - 1) * section.bpb,
                  stop:  B.get ('State', 'play', 'stop')        * section.bpb,
                  lines: ['State', 'play', 'lines']
               });
            }],
            ['change', ['State', 'play'], function (x) {

               var config  = V.getConfig (), value = B.get ('State', 'play', x.path [2]), section;

               if (teishi.eq (B.get ('State', 'play'), {})) {
                  if (config.piece !== undefined) section = B.get ('Data', config.piece, 'sections', config.section);
                  if (! section) {
                     V.setConfig ('piece',   undefined);
                     V.setConfig ('section', undefined);
                     section = B.get ('Data', 0, 'sections', 0);
                     if (! section) return;
                  }
                  return B.do ('set', ['State', 'play'], {
                     piece:   config.piece   || 0,
                     section: config.section || 0,
                     bpm:     section.bpm,
                     start:   1,
                     stop:    section.length / section.bpb,
                     lines:   dale.keys (section.notes)
                  });
               }

               section = B.get ('Data', B.get ('State', 'play', 'piece'), 'sections', B.get ('State', 'play', 'section'));

               if (x.path [2] === 'piece' || x.path [2] === 'section') {
                  V.setConfig (x.path [2], value);
                  if (x.path [2] === 'section' && B.get ('State', 'play', 'piece') === 0) V.setConfig ('piece', 0);
                  return B.do ('set', ['State', 'play'], {
                     piece:   B.get ('State', 'play', 'piece'),
                     section: B.get ('State', 'play', 'section'),
                     bpm:     section.bpm,
                     start:   1,
                     stop:    section.length / section.bpb,
                     lines:   dale.keys (section.notes)
                  });
               }

               if (x.path [2] === 'bpm') {
                  if (type (value) !== 'integer' || value < 1) B.do ('set', ['State', 'play', 'bpm'], section.bpm);
               }
               if (x.path [2] === 'start') {
                  if (type (value) !== 'integer' || value < 1 || value > section.length / section.bpb || value > B.get ('State', 'play', 'stop')) B.do ('set', ['State', 'play', 'start'], 1);
               }

               if (x.path [2] === 'stop') {
                  if (type (value) !== 'integer' || value < 1 || value > section.length / section.bpb || value < B.get ('State', 'play', 'start')) B.do ('set', ['State', 'play', 'stop'], section.length / section.bpb);
               }
            }],
            ['toggle', 'line', function (x, line) {
               var lines = B.get ('State', 'play', 'lines');
               if (lines.indexOf (line) === -1) B.do ('add', ['State', 'play', 'lines'], line);
               else                             B.do ('rem', ['State', 'play', 'lines'], dale.stopNot (lines, undefined, function (l, k) {
                  if (l === line) return k;
               }));
            }],
            ['delete', 'piece', function () {
               if (! confirm ('Are you sure you want to delete the current piece?')) return;
               var current = dale.fil (JSON.parse (localStorage.getItem ('vnote_music')), undefined, function (v, k) {
                  if (k !== B.get ('State', 'play', 'piece')) return v;
               });
               State.play = undefined;
               localStorage.setItem ('vnote_music', JSON.stringify (current));
               V.loadData ();
            }],
            ['import', 'piece', function (x) {
               var url = prompt ('Please enter the URL where the piece can be found', 'https://cdn.rawgit.com/fpereiro/vnote/16d1269372ad32995325c315cf184b4c1aaf4b68/music/Bach-WTC_846.json');
               c.ajax ('get', url, {}, '', function (error, data) {
                  if (error) return alert ('There was an error importing the piece.');
                  if (type (data) !== 'object') return alert ('The piece you are trying to import has an invalid format');
                  var current = teishi.p (localStorage.getItem ('vnote_music')) || [];
                  current.push (data.body);
                  localStorage.setItem ('vnote_music', JSON.stringify (current));
                  State.play = undefined;
                  V.loadData ();
                  alert ('Piece imported successfully.');
               });
            }],
         ], ondraw: function () {
            if (! B.get ('State', 'play')) B.do ('set', ['State', 'play'], {});
         }}, function (x, State) {
            return [
               ['style', [
                  ['ul', {
                     margin: 0,
                     'border-bottom': 'solid 3px transparent',
                  }],
                  ['li.label', {width: State.config.width * 0.5, color: 'black'}],
                  ['li', {
                     float: 'left',
                     'list-style-type': 'none',
                     color: 'white',
                     'font-weight': 'bold',
                     'text-align': 'left',
                     'box-sizing': 'border-box',
                     'border-left': 'solid 2px white'
                  }],
                  ['body', {
                     'background-size': (State.config.width / 2) + 'px ' + (State.config.width / 2) + 'px',
                     'background-image': 'linear-gradient(to right, #888888 1px, transparent 1px)',
                     'font-family': 'mono'
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

               (function () {
                  var play = State.play || {};
                  return [
                     play.piece === undefined ? ['h3', [
                        'No music yet! ',
                        ['a', B.ev ({href: '#'}, ['onclick', 'import', 'piece']), 'Import a piece'],
                        ' to get started.',
                     ]] : V.draw (play.piece, play.section),
                     ['div', {class: 'select'}, [
                        ['h4', ['a', {href: 'https://fpereiro.github.io/vnote/'}, 'Project home']],
                        ['select', B.ev ([
                           ['onchange', 'set', ['State', 'play', 'section'], 0],
                           ['onchange', 'setint', ['State', 'play', 'piece']],
                           ['onchange', 'set', ['State', 'playing'], false]
                        ]), dale.do (Data, function (piece, k) {
                           return ['option', {selected: play.piece === k, value: k}, piece.piece.title];
                        })],
                        ['select', B.ev ([
                           ['onchange', 'setint', ['State', 'play', 'section']],
                           ['onchange', 'set', ['State', 'playing'], false]
                        ]), dale.do (B.get ('Data', play.piece, 'sections'), function (section, k) {
                           return ['option', {selected: play.section === k, value: k}, section.name];
                        })],
                        ['br'],
                        ['button', B.ev (['onclick', 'set', ['State', 'playing'], ! State.playing]), State.playing ? 'stop' : 'play'],
                        ['br'],
                        ['br'],
                        ['li', {class: 'label'}, 'Start'],
                        ['input', B.ev ({readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'start', value: play.start}, ['onchange', 'setint', ['State', 'play', 'start']])],
                        ['br'],
                        ['li', {class: 'label'}, 'Stop'],
                        ['input', B.ev ({readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'stop',  value: play.stop},  ['onchange', 'setint', ['State', 'play', 'stop']])],
                        ['br'],
                        ['li', {class: 'label'}, 'BPM'],
                        ['input', B.ev ({readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'bpm',   value: play.bpm},   ['onchange', 'setint', ['State', 'play', 'bpm']])],
                        ['br'],
                        (function () {
                           if (! play.lines) return;
                           var lines = dale.keys (B.get ('Data', play.piece, 'sections', play.section, 'notes'));
                           return dale.do (lines, function (line) {
                              return [['label', line], ['input', B.ev ({type: 'checkbox', checked: play.lines.indexOf (line) !== -1}, ['onclick', 'toggle', 'line', line])]];
                           });
                        }) (),
                        ['div', [
                           ['br'],
                           ['br'],
                           ['button', B.ev (['onclick', 'import', 'piece']), 'Import new piece'],
                           ['button', B.ev (['onclick', 'delete', 'piece']), 'Delete entire piece'],
                        ]],
                     ]],
                  ];
               }) (),
            ];
         });
      });
   }

   // *** LOAD DATA ***

   V.loadData = function () {
      B.do ('set', 'Data', dale.do (teishi.p (localStorage.vnote_music) || [], function (v) {
         dale.do (v.sections, function (section) {
            section.notes = V.parse (section.notes);
            var n = section.notes [dale.keys (section.notes) [0]];
            n = n [n.length - 1];
            section.length = n [3].t + n [1];
         });
         return v;
      }));
      window.Data = B.get ('Data');
   }

   V.loadData ();

   // *** CONFIG ***

   B.do ('set', ['State', 'instrument'], Synth.createInstrument ('piano'));
   Synth.setSampleRate (20000);
   Synth.setVolume (0.40);

   var config = teishi.p (localStorage.vnote_config) || {};

   B.do ('set', ['State', 'config', 'barsperline'], config.barsperline || 2);
   B.do ('set', ['State', 'config', 'width'],       config.width       || 100);

   V.getConfig = function () {
      return teishi.p (localStorage.vnote_config) || {};
   }

   V.setConfig = function (key, value) {
      var obj = V.getConfig ();
      obj [key] = value;
      localStorage.setItem ('vnote_config', JSON.stringify (obj));
   }

   B.mount ('body', view ());

}) ();
