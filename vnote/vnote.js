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

   V.playnote = function (note, bpm, volume, mute) {
      // If silent note, ignore the note.
      if (note [0] === 0) return;

      // We add 0.5s to give it more sustain and a minimum length.
      if (type (note [0]) === 'integer') return Synth.play ({note: note [0], octave: note [2], duration: 60 / bpm * note [3].dur + 0.5}, Synth.instruments.piano, volume ? {volume: volume} : {}, mute);

      dale.do (note [0], function (n) {
         Synth.play ({note: n [0], octave: n [1], duration: 60 / bpm * note [3].dur + 0.5}, Synth.instruments.piano, volume ? {volume: volume} : {}, mute);
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
            var activeLine = B.get.apply (null, options.lines).indexOf (name) !== -1;

            if (activeLine || options.backgroundVolume) {
               if (! note [3].mute) V.playnote (note, options.bpm, activeLine ? undefined : options.backgroundVolume);

               document.getElementById (name + ':' + k).className = 'playing';
               if (k > 0) document.getElementById (name + ':' + (k - 1)).className = '';
            }

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
      if (! piece) return;

      var map0 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 'A', 11: 'B', 12: 'C'};
      var map1 = {0: 0, 1: 'D', 2: 'J', 3: 'R', 4: 'K', 5: 'M', 6: 'F', 7: 'P', 8: 'S', 9: 'B', 10: 'L', 11: 'T', 12: 'Z'};

      var cmap = {0: 'black', 1: 'red', 2: 'orange', 3: 'yellow', 4: 'green', 5: 'blue', 6: 'indigo', 7: 'violet'}

      var lines = [];

      dale.do (piece.sections [section].notes, function (noteline, name) {
         dale.do (noteline, function (note) {
            var linek = Math.floor (0.01 + note [3].t / (piece.sections [section].bpb * B.get ('State', 'config', 'barsperline')));
            if (! lines [linek]) lines [linek] = {};
            if (! lines [linek] [name]) lines [linek] [name] = [];
            lines [linek] [name].push (note);
            // Preload notes
            V.playnote (note, B.get ('State', 'play', 'bpm'), undefined, true);
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
                     }, ['onclick', 'click', 'note', note, name]), nname];
                  }),
                  dale.keys (line) [0] === name ? ['li', {class: 'label', style: 'text-align: center'}, Math.round (k * B.get ('State', 'config', 'barsperline') + linelength / piece.sections [section].bpb)] : [],
                  ['br'],
               ]];
            }),
            ['br'],
         ];
      });
   }

   var view = function () {
      return B.view (['neverredraw'], {listen: [
         ['setint', '*', function (x, value) {
            B.do ('set', x.path, parseInt (value));
         }],
         ['setfloat', '*', function (x, value) {
            B.do ('set', x.path, parseFloat (value));
         }],
         ['click', 'note', function (x, note, name) {
            if (! note) return;
            if (B.get (['State', 'delmode'])) B.do ('delete', 'note', note, name);
            else V.playnote (note, B.get ('State', 'play', 'bpm'));
         }],
         ['change', ['State', 'playing'], function (x) {
            if (! B.get ('State', 'playing')) return;
            var section = B.get ('Data', B.get ('State', 'play', 'piece'), 'sections', B.get ('State', 'play', 'section'));
            if (! section) return;
            V.play (section.notes, {
               bpm:   B.get ('State', 'play', 'bpm'),
               start: (B.get ('State', 'play', 'start') - 1) * section.bpb,
               stop:  B.get ('State', 'play', 'stop')        * section.bpb,
               lines: ['State', 'play', 'lines'],
               backgroundVolume: B.get ('State', 'play', 'backgroundVolume') || 0,
            });
         }],
         ['change', ['State', 'play'], function (x) {

            var play = B.get ('State', 'play') || {}, config = V.getConfig ();

            // If no pieces, reset.
            if (B.get ('Data').length === 0) {
               if (config.piece   !== undefined) V.setConfig ('piece', undefined);
               if (config.section !== undefined) V.setConfig ('section', undefined);
               if (dale.keys (play).length !== 0) B.do ('set', ['State', 'play'], {});
               return;
            }

            if (config.piece   !== undefined && play.piece   === undefined) return B.do ('set', ['State', 'play', 'piece'], config.piece);
            if (config.section !== undefined && play.section === undefined) {
               if (play.piece === undefined) return B.do ('set', ['State', 'play', 'piece'], 0);
               return B.do ('set', ['State', 'play', 'section'], config.section);
            }

            // If piece from state or config is missing, use the first available piece and section and overwrite the remaining info.
            if (! B.get ('Data', play.piece)) {
               if (config.piece   !== undefined) V.setConfig ('piece', undefined);
               return B.do ('set', ['State', 'play'], {
                  piece: 0,
                  section: 0
               });
            }

            // If piece changes, update config.
            if (x.path [2] === 'piece') V.setConfig (x.path [2], B.get ('State', 'play', x.path [2]));

            // If the selected section doesn\'t exist, reset to the first section. Assumption: all pieces have at least one section.
            if (! B.get ('Data', play.piece, 'sections', play.section)) {
               if (config.section !== undefined) V.setConfig ('section', undefined);
               return B.do ('set', ['State', 'play', 'section'], 0);
            }

            var section = B.get ('Data', play.piece, 'sections', play.section);

            if (! section) return alert ('There is no available section! Did you add a piece with no sections?');

            // If section changes, update config.
            if (x.path [2] === 'section') V.setConfig (x.path [2], B.get ('State', 'play', x.path [2]));

            // If only piece & section are set, initialize the other keys
            if (dale.keys (play).length === 2 || x.path [2] === 'piece' || x.path [2] === 'section') {
               return B.do ('set', ['State', 'play'], {
                  piece:   play.piece,
                  section: play.section,
                  bpm:     section.bpm,
                  start:   1,
                  stop:    section.length / section.bpb,
                  lines:   dale.keys (section.notes)
               });
            }

            var value = B.get ('State', 'play', x.path [2]);

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
            localStorage.setItem ('vnote_music', JSON.stringify (current));
            B.do ('set', ['State', 'play'], {piece: 0});
            V.loadData ();
         }],
         ['import', 'piece', function (x) {
            var url = prompt ('Please enter the URL where the piece can be found', 'https://cdn.rawgit.com/fpereiro/vnote/7fe9e7113463463b26dc2059ca502978d01eb713/music/Bach-WTC_846.json');
            c.ajax ('get', url, {}, '', function (error, data) {
               if (error) return alert ('There was an error importing the piece.');
               if (type (data) !== 'object') return alert ('The piece you are trying to import has an invalid format');
               var current = teishi.p (localStorage.getItem ('vnote_music')) || [];
               current.push (data.body);
               localStorage.setItem ('vnote_music', JSON.stringify (current));
               V.loadData ();
               B.do ('set', ['State', 'play'], {piece: 0});
               alert ('Piece imported successfully.');
            });
         }],
         ['import', 'piecefile', function (x) {
            var file = c ('#piecefile').files [0];
            if (file) {
               var reader = new FileReader ();
               reader.readAsText (file, 'UTF-8');
               reader.onload = function (e) {
                  var data = JSON.parse (e.target.result);
                  if (type (data) !== 'object') return alert ('The piece you are trying to import has an invalid format');
                  var current = teishi.p (localStorage.getItem ('vnote_music')) || [];
                  current.push (data);
                  localStorage.setItem ('vnote_music', JSON.stringify (current));
                  V.loadData ();
                  B.do ('set', ['State', 'play'], {piece: 0});
                  alert ('Piece imported successfully.');
               }
               reader.onerror = function (evt) {
                  alert ('There was an error reading the file.');
               }
            }
         }],
         ['append', 'note', function (x) {
            var note = B.get ('State', 'new', 'note');
            if (! note.inner || ! note.line || ! note.length) return;
            note.length = eval (note.length);

            var nnote;

            dale.do (note.inner, function (inote) {
               if (! inote || inote.pclass === undefined) return;
               if (inote.pclass !== 0 && ! inote.octave) return;
               if (inote.pclass === 0) delete inote.octave;
               if (note.inner.length === 1) {
                  nnote = [note.line, [inote.pclass, note.length, inote.octave]];
               }
               else {
                  if (! nnote) nnote = [note.line, [[], note.length]];
                  nnote [1] [0].push ([inote.pclass, inote.octave]);
               }
               if (inote.lig) nnote [1] [3] = {lig: true};
            });

            var music = (teishi.p (localStorage.getItem ('vnote_music')) || []);
            music [B.get ('State', 'play', 'piece')].sections [B.get ('State', 'play', 'section')].notes.push (nnote);
            localStorage.setItem ('vnote_music', JSON.stringify (music));
            V.loadData ();
         }],
         ['delete', 'note', function (x, Note, line) {
            if (! confirm ('Are you sure you want to delete the note?')) return;
            var music = (teishi.p (localStorage.getItem ('vnote_music')) || []);
            var notes = music [B.get ('State', 'play', 'piece')].sections [B.get ('State', 'play', 'section')].notes;
            var counter = 0;
            dale.do (notes, function (noteline, k) {
               if (noteline [0] !== line) return;
               dale.do (noteline, function (note, k2) {
                  if (k2 === 0) return;
                  if (counter++ === Note [3].k) noteline.splice (k2, 1)
               });
            });
            localStorage.setItem ('vnote_music', JSON.stringify (music));
            V.loadData ();
         }],
      ], ondraw: function () {
         if (! B.get ('State', 'play')) B.do ('set', ['State', 'play'], {});
      }}, function () {
         return [
            B.view (['State', 'config'], function (x, config) {
               return ['style', [
                  ['ul', {
                     'margin, padding': 0,
                     'border-bottom': 'solid 3px transparent',
                  }],
                  ['li.label', {width: config.width * 0.5, color: 'black'}],
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
                  ['body', {
                     'background-size': (config.width / 2) + 'px ' + (config.width / 2) + 'px',
                     'background-image': 'linear-gradient(to right, #888888 1px, transparent 1px)',
                     'font-family': 'mono',
                     margin: -2,
                     'margin-top, margin-bottom': 10
                  }],
                  ['.playing', {
                     'filter': 'invert(30%)'
                  }],
                  ['div.select', {
                     width: 0.2,
                     position: 'fixed',
                     'top, right': 20,
                  }, ['select', {'margin-bottom': 10}]],
               ]];
            }),
            B.view (['State', 'play'], function (x, play) {
               play = play || {};
               return [
                  play.piece === undefined ? ['h3', [
                     'No music yet! ',
                     ['a', B.ev ({href: '#'}, ['onclick', 'import', 'piece']), 'Import a piece'],
                     ' to get started.',
                  ]] : B.view (['Data'], function () {return V.draw (play.piece, play.section)})
               ];
            }),
            B.view (['State'], function (x, State) {
               var play = State.play || {};
               return ['div', {class: 'select'}, [
                  B.view (['Data'], function (x, Data) {return [
                     ['a', {href: 'https://fpereiro.github.io/vnote/'}, 'Project home'],
                     ['br'], ['br'],
                     ['select', B.ev ({style: 'width: 200px'}, [
                        ['onchange', 'setint', ['State', 'play', 'piece']],
                        ['onchange', 'set', ['State', 'playing'], false]
                     ]), dale.do (Data, function (piece, k) {
                        return ['option', {selected: play.piece === k, value: k}, piece.piece.title + ' (' + piece.piece.author + ')'];
                     })],
                     ['select', B.ev ([
                        ['onchange', 'setint', ['State', 'play', 'section']],
                        ['onchange', 'set', ['State', 'playing'], false]
                     ]), dale.do (B.get ('Data', play.piece, 'sections'), function (section, k) {
                        return ['option', {selected: play.section === k, value: k}, section.name];
                     })],
                  ]}),
                  ['button', B.ev (['onclick', 'set', ['State', 'playing'], ! State.playing]), State.playing ? 'stop' : 'play'],
                  ['br'],
                  ['br'],
                  ['li', {style: 'color: black'}, 'start/stop/bpm/backvolume'],
                  ['br'],
                  ['input', B.ev ({class: 'play', readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'start', value: play.start}, ['onchange', 'setint', ['State', 'play', 'start']])],
                  ['input', B.ev ({class: 'play', readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'stop',  value: play.stop},  ['onchange', 'setint', ['State', 'play', 'stop']])],
                  ['input', B.ev ({class: 'play', readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'bpm',   value: play.bpm},   ['onchange', 'setint', ['State', 'play', 'bpm']])],
                  ['input', B.ev ({class: 'play', readonly: (State.playing || play.piece === undefined) ? 1 : undefined, placeholder: 'backgroundVolume',   value: play.backgroundVolume},   ['onchange', 'setfloat', ['State', 'play', 'backgroundVolume']])],
                  ['br'],
                  ['br'],
                  B.view (['Data'], function (x, Data) {
                     if (! play.lines) return;
                     var lines = dale.keys (B.get ('Data', play.piece, 'sections', play.section, 'notes'));
                     return dale.do (lines, function (line) {
                        return [['label', line], ['input', B.ev ({type: 'checkbox', checked: play.lines.indexOf (line) !== -1}, ['onclick', 'toggle', 'line', line])]];
                     });
                  }),
                  ['div', [
                     ['br'],
                     ['button', B.ev ({style: 'float: left; margin-right: 5px'}, ['onclick', 'import', 'piece']), 'Import from link'],
                     ['a', {style: 'float: left', href: 'https://github.com/fpereiro/vnote/tree/master/music', target: '_blank'}, 'Get links'],
                     ['br'],
                     ['br'],
                     ['input', B.ev ({value: 'Import from file', id: 'piecefile', type: 'file'}, ['onchange', 'import', 'piecefile'])],
                     ['br'],
                     ['br'],
                     ['button', B.ev (['onclick', 'delete', 'piece']), 'Delete entire piece'],
                     ['br'],
                     ['br'],
                     B.view (['Data'], function () {
                        return ['a', {style: 'font-size: 0.9em', href: V.exportPiece (play.piece), download: B.get ('Data', play.piece, 'piece', 'title') + '.json'}, 'Export current piece'];
                     }),
                     B.view (['State', 'new', 'note'], function (x, note) {
                        note = note || {};
                        return [
                           ['h4', 'Enter a new note'],
                           ['input', B.ev ({placeholder: 'line name', value: note.line}, ['onchange', 'set', ['State', 'new', 'note', 'line']])],
                           ['select', B.ev (['onchange', 'setint', ['State', 'new', 'note', 'inner', 0, 'pclass']]), dale.do (dale.times (14, -1), function (k) {
                              if (k === -1) return ['option', 'Pitch class'];
                              return ['option', {value: k}, k < 10 ? k : {10: 'A', 11: 'B', 12: 'C'} [k]];
                           })],
                           ['input', B.ev ({placeholder: 'length', value: note.length}, ['onchange', 'set', ['State', 'new', 'note', 'length']])],
                           ['select', B.ev (['onchange', 'setint', ['State', 'new', 'note', 'inner', 0, 'octave']]), dale.do (dale.times (8, 0), function (k) {
                              if (k === 0) return ['option', 'Octave'];
                              return ['option', {selected: note.octave === k, value: k}, k < 10 ? k : {10: 'A', 11: 'B', 12: 'C'} [k]];
                           })],
                           ['br'],
                           ['label', 'Lig'],
                           ['input', B.ev ({type: 'checkbox', checked: note.lig}, ['onclick', 'set', ['State', 'new', 'note', 'lig'], ! note.lig])],
                           ['br'],
                           B.view (['State', 'delmode'], function (x, delmode) {return [
                              ['label', 'Delete notes'],
                              ['input', B.ev ({type: 'checkbox', checked: delmode}, ['onclick', 'set', ['State', 'delmode'], ! delmode])]
                           ]}),
                           ['button', B.ev (['onclick', 'append', 'note']), 'Add note'],
                           ['br'],
                           ['br'],
                        ];
                     }),
                  ]],
               ]];
            }),
         ];
      });
   }

   // *** LOAD DATA ***

   V.loadData = function () {
      B.do ('set', 'Data', dale.do (teishi.p (localStorage.vnote_music) || [], function (v) {
         dale.do (v.sections, function (section) {
            section.notes = V.parse (section.notes);
            var n = section.notes [dale.keys (section.notes) [0]];
            n = n [n.length - 1];
            section.length = Math.round (n [3].t + n [1]);
         });
         return v;
      }));
      window.Data = B.get ('Data');
   }

   V.loadData ();

   // *** CONFIG ***

   var config = teishi.p (localStorage.vnote_config) || {};

   B.do ('set', ['State', 'config', 'barsperline'], config.barsperline || window.innerWidth < 1300 ? 1 : 2);
   B.do ('set', ['State', 'config', 'width'],       config.width       || window.innerWidth < 800 ? 50 : 100);

   V.getConfig = function () {
      return teishi.p (localStorage.vnote_config) || {};
   }

   V.setConfig = function (key, value) {
      var obj = V.getConfig ();
      obj [key] = value;
      localStorage.setItem ('vnote_config', JSON.stringify (obj));
   }

   V.exportPiece = function (piece) {
      var pieces = teishi.p (localStorage.getItem ('vnote_music')) || [];
      piece = pieces [piece];
      if (! piece) return;

      var bars = [];

      dale.do (piece.sections, function (section, k) {

         var bars = [];

         dale.do (V.parse (section.notes), function (noteline, name) {

            dale.do (noteline, function (note, k2) {

               k2 = Math.floor (0.01 + note [3].t / piece.sections [k].bpb);
               if (! bars [k2]) bars [k2] = {};
               if (! bars [k2] [name]) bars [k2] [name] = [];
               note [1] = Math.round (note [1] * 1000) / 1000;
               if (note [3].lig) note [3] = {lig: true};
               else note = note.slice (0, note [2] ? 3 : 2);
               bars [k2] [name].push (note);
            });
         });

         section.notes = [];
         dale.do (bars, function (bar) {
            dale.do (bar, function (v, k2) {
               section.notes.push ([k2].concat (v));
            });
         });
      });

      return 'data:text/json;charset=utf-8,' + encodeURIComponent (JSON.stringify (piece));
   }

   B.mount ('body', view ());

}) ();
