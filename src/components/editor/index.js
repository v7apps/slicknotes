import React from 'react';

var CodeMirror = require('codemirror');

/** Base setup */
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/css/css');
require('codemirror/keymap/sublime');

/** Addons */
require('codemirror/addon/edit/continuelist');
require('codemirror/addon/search/search');
require('codemirror/addon/search/match-highlighter');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/dialog/dialog.css');
// require('codemirror/addon/fold/foldcode');
// require('codemirror/addon/fold/foldgutter');
// require('codemirror/addon/fold/brace-fold');
// require('codemirror/addon/fold/markdown-fold');
// require('codemirror/addon/fold/foldgutter.css');
require('codemirror/addon/selection/active-line');

require('codemirror/lib/codemirror.css');

/** Themes */
// require('codemirror/theme/neo.css');
// require('codemirror/theme/mdn-like.css');
// require('codemirror/theme/elegant.css');

require('styles/editor-light.scss');

const $ = require("jquery");

import CalculatorAddon from './addons/calculator';
var autopreview = require('./addons/autopreview');

const NoteStore = require('../../stores/NoteStore');

class EditorComponent extends React.Component {

  constructor() {
    super();
  }

  render() {
    return (
      <div className="editor">
        <div className="note-title">
          <input ref="noteTitle" className="note-title-input" placeholder="Untitled Note" onChange={this.onTextChange.bind(this)} />
        </div>
        <div ref="noteEditor" className="note-editor">
        </div>
      </div>
    );
  }

  componentDidMount() {
    NoteStore.on("SELECTION_CHANGED_EVENT", this.noteSelectedChanged.bind(this));

    var doc = CodeMirror(this.refs.noteEditor, {
      mode: {
        name: "markdown",
        highlightFormatting: true,
        taskLists: true,
        fencedCodeBlocks: true,
        strikethrough: true
      },
      lineWrapping: true,
      keyMap: "sublime",
      theme: 'editor-light',
      foldGutter: true,
      highlightSelectionMatches: true,
      showCursorWhenSelecting: true,
      styleActiveLine: true,
      addModeClass: true,
      extraKeys: {
        "Enter": "newlineAndIndentContinueMarkdownList",
        "Ctrl-Alt-C": () => CalculatorAddon(doc),
        "Cmd-=": function() {
          console.log("AsdasD");
          var oldSize = parseInt($(".CodeMirror").css("font-size")),
          newSize = oldSize + 2;
          $(".CodeMirror").css("font-size", "" + newSize + "px");
          doc.refresh();
        },
        "Cmd--": function() {
          console.log("AsdasD");
          var oldSize = parseInt($(".CodeMirror").css("font-size")),
          newSize = oldSize - 2;
          $(".CodeMirror").css("font-size", "" + newSize + "px");
          doc.refresh();
        }
      }
    });

    doc.on('cursorActivity', this.refreshPreview.bind(this));
    doc.on('change', this.onTextChange.bind(this));

    this.document = doc;
  }

  componentWillUnmount() {
    NoteStore.un("SELECTION_CHANGED_EVENT");
  }

  noteSelectedChanged(note) {
    var data = NoteStore.getSelectedNote();

    this.note = data.note;

    this.originalContent = data.contents;

    this.refs.noteTitle.value = this.note.title;
    this.document.setValue(data.contents);

    this.document.focus();
  }

  onTextChange() {
    if( this.switchingDocument ) {
      this.switchingDocument = false;
      return;
    }

    var newContent = this.document.getValue();
    if( this.originalContent == newContent ) {
      newContent = null;
    }

    this.note.title = this.refs.noteTitle.value;
    NoteStore.save(this.note, newContent);
  }

  refreshPreview() {
    // console.log("cursorActivity");
    // console.log(this.document.getViewport());
    // this.document.eachLine(function(line) {
    //   autopreview(this.document, line);
    // }.bind(this));
  }

}

export default EditorComponent;
