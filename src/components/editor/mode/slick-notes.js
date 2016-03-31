var CodeMirror = require('codemirror');

require("./markdown");
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/python/python');
require('codemirror/mode/shell/shell');
require('codemirror/mode/css/css');

const electron = eRequire('electron');
const remote = electron.remote;
const SpellChecker = remote.require('spellchecker');

CodeMirror.defineMode("markdown-tables", function (config, parserConfig) {
  var tableHeader = /(\S.*\|.*)+/;
  //var tableDelimiter = /\|?:-+:\|?:-+:\|?:-+:\|?\r?\n?/;
  //var tableContents = /[|]?(\s+[A-Za-z0-9 -_*#@$%:;?!.,\/\\]+\s+)[|]?[|]?(\s+[A-Za-z0-9 -_*#@$%:;?!.,\/\\]+\s+)[|]?[|]?(\s+[A-Za-z0-9 -_*#@$%:;?!.,\/\\]+\s+)[|]?\r?\n?/;

  var overlay = {
    startState: function() {return {tableState: null};},
    token: function (stream, state) {

      var match = stream.match(tableHeader, true);
      if( match ) {
        //console.log(match);
        state.tableState = "start";
        return "line-table line-table-begin";
      }
      else {
        stream.skipToEnd();
      }

      return null;
    }
  };

  //var mode = "";

  var mode = CodeMirror.getMode(config, {
    name: "markdown",
    highlightFormatting: true,
    taskLists: true,
    fencedCodeBlocks: true,
    strikethrough: true
  });

  return CodeMirror.overlayMode(mode, overlay, true);
});

CodeMirror.defineMode("slick-notes", function (config, parserConfig) {
  var wordDelimiters = "!\"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ \t",
    overlay = {
      token: function (stream, state) {
        var ch = stream.peek(),
          word = "";

        if (wordDelimiters.includes(ch)) {
          stream.next();
          return null;
        }
        while ((ch = stream.peek()) != null && !wordDelimiters.includes(ch)) {
          word += ch;
          stream.next();
        }
        word = word.replace(/[’ʼ]/g, "'");
        if (SpellChecker.isMisspelled(word)) {
          //console.log(word);
          return "spell-error";
        }
        return null;
      }
    },
    mode = CodeMirror.getMode(config, "markdown-tables");

  //mode = CodeMirror.getMode(config, {
  //  name: "markdown",
  //  highlightFormatting: true,
  //  taskLists: true,
  //  fencedCodeBlocks: true,
  //  strikethrough: true
  //});

  return CodeMirror.overlayMode(mode, overlay, true);
});
