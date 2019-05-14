/*
This script converts music from the kern format to the tnote format.

It still requires manual intervention and cleanup. Its purpose is to take existing digitized kern pieces to produce pieces in tnote format.

The input variables to the script are hardcoded in the script itself. They are DATA (the kern file), LINENAMES (the line names, in the order you want them printed) and MAP (which specifies how the columns in the kern file match to the lines in the tnote output).

Output is printed to the console. It can be caught by using the ">", like: node kerntnote > somepiece.txt

http://www.humdrum.org/guide/ch02/
http://www.humdrum.org/guide/ch06/
http://www.humdrum.org/rep/kern/
*/

var dale   = require ('dale');
var teishi = require ('teishi');
var fs     = require ('fs');

var type = teishi.t, clog = console.log;

/*
// BACH WTC 1 - PRELUDE 1
// http://www.musedata.org/cgi-bin/mddata?composer=bach&edition=bg&genre=keybd/wtc-i&work=0846&format=pdf&movement=01
var DATA      = fs.readFileSync ('kern/wtc1p01.krn', 'utf8');
var LINENAMES = ['rh', 'lh1', 'lh2'];
var MAP       = [[1, ['rh', 'lh1', 'lh2']]];
*/

/*
// BACH WTC 1 - FUGUE 1
// http://www.musedata.org/cgi-bin/mddata?composer=bach&edition=bg&genre=keybd/wtc-i&work=0846&format=pdf&movement=02
var DATA      = fs.readFileSync ('kern/wtc1f01.krn', 'utf8');
var LINENAMES = ['rh1', 'rh2', 'lh1', 'lh2'];
var MAP       = [[1, ['lh2', 'lh1', 'rh2', 'rh1']]];
*/

// BACH WTC 2 - PRELUDE 18
// http://www.musedata.org/cgi-bin/mddata?composer=bach&edition=bg&genre=keybd/wtc-ii&work=0887&format=pdf&movement=01
var DATA      = fs.readFileSync ('kern/wtc2p18.krn', 'utf8');
var LINENAMES = ['rh1', 'rh2', 'lh1', 'lh2'];
var MAP       = [
   [1, ['rh1', 'lh1', 'rh2', 'lh2']],
   [5, ['rh1', 'rh2', 'lh1', 'lh2']],
];

var getnote = function (where, s, prelig) {
   var S = s;
   if (! s.match (/^(\d|\[)/)) return;
   var lig = s [0] === '[' || prelig;
   s = s.replace (/^\[/, '');
   var duration = s.match (/^\d+/) [0];
   s = s.replace (duration, '');
   duration = parseFloat (4 / duration);

   var dots = s.match (/\.+/);
   if (dots) {
      var oduration = duration;
      dale.do (dale.times (dots [0].length, 2, 2), function (k) {
         duration += oduration / k;
      });
      s = s.replace (dots, '');
   }
   duration = Math.round (duration * 1000) / 1000;

   var fermata, ligclo;

   var notes = dale.do (s.split (' '), function (v, k) {
      v = v.replace (/^\d+/, '');
      var pitch = v.match (/[a-gA-Gr]+/) [0];
      v = v.replace (pitch, '');
      var accid = v.match (/[#\-n]+/) || '';
      if (accid) accid = accid [0];
      v = v.replace (accid, '');
      v = v.replace (/[tx_]+/g, '');
      ligclo = ligclo || v [v.length - 1] === ']';
      v = v.replace (/]/, '');
      fermata = fermata || v [0] === ';';
      v = v.replace (/[;\/\\LJkpy)]/g, '');

      if (v.length > 0) clog ('WARNING: unexpected elements in note', where, '"' + v + '"', 'original:', S);

      var octave;
      if (pitch === 'r') octave = '', pitch = 0;
      else {
         if (pitch.match (/[A-G]/)) octave = 4 - pitch.length;
         if (pitch.match (/[a-g]/)) octave = 3 + pitch.length;
         pitch = {a: 10, b: 12, c: 1, d: 3, e: 5, f: 6, g: 8} [pitch.toLowerCase () [0]];

         dale.do (accid.split (''), function (a) {
            if (a === '-') pitch--;
            if (a === '#') pitch++;
         });
         if (pitch > 12) {
            octave = octave + 1;
            pitch  = pitch % 12;
         }
         if (pitch < 1) {
            octave = octave - 1;
            pitch  = 12 - Math.abs (pitch);
         }
      }
      return [octave, pitch];
   }).sort (function (a, b) {
      if (a [0] !== b [0]) return a [0] - b [0];
      return a [1] - b [1];
   });

   var printpitch = function (pitch) {
      return pitch < 10 ? pitch + '' : {10: 'A', 11: 'B', 12: 'C'} [pitch];
   }

   var output = (notes [0] [0] + '') + printpitch (notes [0] [1]);
   dale.do (notes, function (v, k) {
      if (k === 0) return;
      if (v [0] === notes [k - 1] [0] || v [1] < notes [k - 1] [1]) return output += printpitch (v [1]);
      output += dale.do (dale.times (Math.max (v [0] - notes [k - 1] [0] + (v [1] < notes [k - 1] [1] ? -1 : 0), 0)), function () {}).join ('+') + printpitch (v [1]);
   });

   if (type (duration) === 'integer') {
      if (duration !== 1) output += '*' + duration;
   }
   else {
      output += {'0.5': '/2', '0.75': '*3/4', '0.25': '/4', '0.125': '/8', '1.5': '*3/2', '3.5': '*7/2'} [duration + ''];
   }
   if (! ligclo && lig) output += 'L';
   if (fermata)         output += 'F';

   return output;
}

var bars = [], start, end;

dale.do (DATA.split ('\n'), function (line) {
   if (line.match (/^=\d/)) {
      bars.push ([]);
      if (line.match (/^=1/)) return start = true;
      return;
   }
   if (line.match (/^==/)) return end = true;
   if (start && ! end) bars [bars.length - 1].push (line.split ('\t'));
});

var output = '', ligatures = dale.obj (LINENAMES, function (v) {return [v, false]});

process.on ('exit', function () {
   clog (output);
});

dale.do (bars, function (bar, barnumber) {

   var notes = dale.obj (LINENAMES, function (linename) {
      return [linename, []];
   });

   var map = dale.stopNot (MAP, undefined, function (step, k) {
      if (! MAP [k + 1] || MAP [k + 1] [0] > (barnumber + 1)) return step [1];
   });

   dale.do (bar, function (line) {
      var split, merge;

      var seen = {};

      dale.do (line, function (note, index) {
         if (note.match (/\^/) && index) {
            map.splice (index, 0, map [index - 1]);
         }
         if (note.match ('v')) {
            if (! merge) merge = true;
            else map.splice (index - 1, 1);
         }
         note = getnote ((barnumber + 1) + ':' + map [index], note, ligatures [map [index]]);
         if (note) {
            // only push one note per line
            if (seen [map [index]]) return clog ('skipping note', barnumber + 1, map [index], note);
            seen [map [index]] = true;
            notes [map [index]].push (note);
            ligatures [map [index]] = !! note.match ('L');
         }
      });
   });

   // *** PRETTY PRINTING ***

   var baroutput = {}, makeSpace = function (n) {
      return dale.acc (dale.times (n), '', function (a, b) {return a + ' '});
   }

   dale.do (LINENAMES, function (linename) {
      // Ignore lines that are all rest.
      if (notes [linename].length === 0 || notes [linename].length === 1 && notes [linename] [0].match (/^0/)) return delete notes [linename]

      // Set up initial part of lines (bar number & name).
      var initialSpace = makeSpace ((bars.length + '').length - ((barnumber + 1) + '').length);
      baroutput [linename] = initialSpace + (barnumber + 1) + ' ' + linename + ' ';

      // We make sure all bars start with the same amount of spaces, without regard of the length of the line name.
      var longestName = Math.max.apply (Math, dale.do (LINENAMES, function (v) {return v.length}));
      baroutput [linename] += makeSpace (longestName - linename.length);
   });

   // We initialize the offsets, which is the total duration of the notes already printed each line so far within the bar.
   var offsets = dale.obj (notes, function (note, linename) {
      return [linename, 0];
   });

   // Print next set of notes (the notes starting at the earliest time).
   var next = function () {

      // We get the minimum offset
      var min = Math.min.apply (Math, dale.do (offsets, function (offset) {return offset}));

      var toPrint = [], longestPrintableLine = Math.max.apply (Math, dale.fil (baroutput, undefined, function (line, linename) {
         // If there's further notes in the line and the line's offset is lower or equal than the minimum, we need to print this line now.
         if (notes [linename] [0] && offsets [linename] === min) {
            toPrint.push (linename);
            return line.length;
         }
      }));

      if (toPrint.length === 0) return clog ('WARNING: excess notes on bar', barnumber + 1, notes);

      dale.do (toPrint, function (linename) {
         if (! notes [linename] [0]) return;

         var note = notes [linename].shift ();

         // We append the note to the baroutput, minding the rule that notes that start at the same time should start at the same offset.
         baroutput [linename] += makeSpace (1 + Math.max (0, longestPrintableLine - baroutput [linename].length)) + note;

         // We calculate the note's length and then update the offset.
         var dur = note.replace ('L', '').split (/[*\/]/);
         if (dur.length === 1)       dur = 1;
         else if (dur.length === 3)  dur = parseFloat (dur [1]) / parseFloat (dur [2]);
         else if (note.match (/\*/)) dur = parseFloat (dur [1]);
         else                        dur = 1 / parseFloat (dur [1]);
         offsets [linename] += dur;
      });

      dale.do (baroutput, function (line, linename) {
         // For each linename we haven't printed this time
         if (toPrint.indexOf (linename) !== -1) return;
         var max = 0;
         // If a printable line ended up with offsets smaller than the ones we have now, add space.
         dale.do (toPrint, function (plinename) {
            if (offsets [plinename] < offsets [linename]) max = Math.max (max, baroutput [plinename].length);
         });
         baroutput [linename] += makeSpace (Math.max (0, max - baroutput [linename].length));
      });

      if (dale.stop (notes, true, function (v, k) {
         return v.length > 0;
      })) return next ();
   }

   next ();

   dale.do (LINENAMES, function (linename) {
      if (baroutput [linename]) output += '\n' + baroutput [linename];
   });

   output += '\n';

});

clog (output);
