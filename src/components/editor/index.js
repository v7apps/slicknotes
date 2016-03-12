import React from 'react';

var CodeMirror = require('codemirror');

/** Base setup */
require('./mode/markdown');
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
require('codemirror/addon/mode/overlay');
// require('codemirror/addon/scroll/simplescrollbars');
// require('codemirror/addon/scroll/simplescrollbars.css');

require('codemirror/lib/codemirror.css');
require('font-awesome/css/font-awesome.min.css');

/** Themes */
// require('codemirror/theme/neo.css');
// require('codemirror/theme/mdn-like.css');
// require('codemirror/theme/elegant.css');

require('styles/editor-light.scss');


const $ = require("jquery");

const classNames = require('classnames');

import CalculatorAddon from './addons/calculator';
var autopreview = require('./addons/autopreview');

const NoteStore = require('../../stores/NoteStore');

class EditorComponent extends React.Component {

  constructor() {
    super();
    this.state = {toc: []};
  }

  render() {

    return (
      <div className="editor">
        <div style={{flexDirection:'row'}}>
          <div className="note-title" style={{display:'flex'}}>
            <input ref="noteTitle" className="note-title-input" placeholder="Untitled Note" onChange={this.onTextChange.bind(this)} />
          </div>
          <div className="title-toolbar">
            <div className="button" onClick={this.onDeleteNote.bind(this)}>
              <i className="fa fa-trash"></i>
            </div>
            <div className="button" onClick={this.onToggleTOC.bind(this)}>
              <i className="fa fa-list"></i>
            </div>
          </div>
        </div>
        <div style={{ flexDirection:'row', display:'flex'}}>

        <div ref="noteEditor" className={classNames("note-editor", {"with-toc": this.state.showToc})}></div>
        <div className="toc-list">
          {this.state.showToc && this.state.toc.map(function(item, index) {
            return (<div className={classNames('toc-list-item', 'toc-item-level-' + item.level, { active: this.state.activeItem == item})} key={item.number} onClick={function(){this.onSelectTocItem(item)}.bind(this)}>
              <div className="title"><a href='#'> {item.text}</a></div>
            </div>);
          }.bind(this))}
        </div>

      </div>
      </div>
    );
  }

  componentDidMount() {
    NoteStore.on("SELECTION_CHANGED_EVENT", this.noteSelectedChanged.bind(this));
    this.initSpellcheck();

    var doc = CodeMirror(this.refs.noteEditor, {
      mode: {
        name: "spell-checker"
      },
      lineWrapping: true,
      keyMap: "sublime",
      theme: 'editor-light',
      foldGutter: true,
      highlightSelectionMatches: true,
      showCursorWhenSelecting: true,
      styleActiveLine: true,
      addModeClass: true,
      // scrollbarStyle: 'simple',
      extraKeys: {
        "Enter": "newlineAndIndentContinueMarkdownList",
        "Ctrl-Alt-C": () => CalculatorAddon(doc),
        "Cmd-=": function() {
          var oldSize = parseInt($(".CodeMirror").css("font-size")),
          newSize = oldSize + 2;
          $(".CodeMirror").css("font-size", "" + newSize + "px");
          doc.refresh();
        },
        "Cmd--": function() {
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
    //NoteStore.un("SELECTION_CHANGED_EVENT");
  }

  noteSelectedChanged(note) {
    this.switchingDocument = true;
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

  parseToc (array) {
    var obj = array.filter(function ( obj ) {
      return obj.startsWith("#### ");
    });
    
    this.setState({toc: obj});
    
  }

  refreshPreview() {
    
    var array = [];
    this.document.eachLine(function(line) {
      
      if (line.text.match(/^([\#]+) (.+)/gi)) {
        var data = {"text": line.text, number: this.document.getLineNumber(line)};
        array.push(data);
      }
      autopreview(this.document, line);
    }.bind(this));
    this.setState({toc: array});
    
  }

  onDeleteNote () {
    var data = NoteStore.getSelectedNote();
    
    var answer = confirm('Are you sure?');

    if (answer) {

        NoteStore.delete(data.note);
        NoteStore.removeSelectedNote();

        this.document.setValue('');
        this.document.focus();
        this.refs.noteTitle.value = '';
        this.note = null;
        this.originalContent = null;
        this.refreshPreview();

    }

  }

  onSelectTocItem (item) {

    this.document.scrollIntoView(item.number, 0);
    // this.document.setCursor(item.number, 0);
  }

  initSpellcheck () {
    CodeMirror.defineMode("spell-checker", function (config, parserConfig) {
      console.log('define mode');
        var wordDelimiters = "!\"#$%&()*+,-./:;<=>?@[\\]^_`{|}~ \t",
            overlay = {
            token: function(stream, state) {
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
                return "spell-error";
              }
              return null;
            }
          },
        mode = CodeMirror.getMode(config, {
          name: "markdown",
          highlightFormatting: true,
          taskLists: true,
          fencedCodeBlocks: true,
          strikethrough: true
        });
        return CodeMirror.overlayMode(mode, overlay, true);
    });
}

}

export default EditorComponent;
