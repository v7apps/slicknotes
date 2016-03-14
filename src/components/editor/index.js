import React from 'react';

var CodeMirror = require('codemirror');

/** Base setup */
require('./mode/markdown');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/python/python');
require('codemirror/mode/shell/shell');
require('codemirror/mode/css/css');
require('codemirror/keymap/sublime');

/** Addons */
// require('codemirror/addon/edit/continuelist');
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

const electron = eRequire('electron');
const remote = electron.remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

const clipboard = electron.clipboard;

const $ = require("jquery");

const classNames = require('classnames');
// const SpellChecker = require('spellchecker');

import CalculatorAddon from './addons/calculator';
var autopreview = require('./addons/autopreview');
require('./addons/continuelist');

const NoteStore = require('../../stores/NoteStore');

class EditorComponent extends React.Component {

  constructor() {
    super();
    this.state = {toc: [], showToc: true};
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
            return (<div className={classNames('toc-list-item', 'toc-item-level-' + item.level, { active: this.state.selectedToc == item.line})} key={item.line} onClick={function(){this.onSelectTocItem(item)}.bind(this)}>
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

    var executeCommand = function(item) {
      switch(item.command) {
        case "copy":
          clipboard.writeText(doc.getSelection());
          break;
        case "cut":
          clipboard.writeText(doc.getSelection());
          doc.replaceSelection("");
          break;
        case "paste":
          doc.replaceSelection(clipboard.readText());
          break;
        case "calculate":
          CalculatorAddon(doc);
          break;
        default:
          doc.execCommand(item.command);
      }

      doc.focus();
    };

    var menu = new Menu.buildFromTemplate([
      {
        "label": "Undo",
        "accelerator": "CmdOrCtrl+Z",
        "command": "undo",
        click: executeCommand
      },
      {
        "label": "Redo",
        "accelerator": "CmdOrCtrl+Y",
        "command": "redo",
        click: executeCommand
      },
      {
        "type": "separator"
      },
      {
        "label": "Cut",
        "command": "cut",
        click: executeCommand
      },
      {
        "label": "Copy",
        "command": "copy",
        click: executeCommand
      },
      {
        "label": "Paste",
        "command": "paste",
        click: executeCommand
      },
      {
        "type": "separator"
      },
      {
        "label": "Select all",
        "accelerator": "CmdOrCtrl+A",
        "command": "selectAll",
        click: executeCommand
      },
      {
        "type": "separator"
      },
      {
        "label": "Calculate",
        "accelerator": "Ctrl+Alt+C",
        "command": "calculate",
        "click": executeCommand
      }
    ]);

    doc.on('contextmenu', function (c, e) {
      e.preventDefault();
      menu.popup(remote.getCurrentWindow());
    }, false);

    doc.on('scroll', this.onScroll.bind(this));

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

  refreshPreview() {

    var array = [];
    this.document.eachLine(function(line) {
      var matches = /^([\#]+) (.+)/gi.exec(line.text);
      if (matches) {
        var lineNumber = this.document.getLineNumber(line);
        var headingCoordinates = this.document.charCoords({line: lineNumber, ch: 0}, "local");

        var data = {
          text: matches[2],
          level: matches[1].length,
          line: lineNumber,
          coordinates: headingCoordinates
        };
        array.push(data);
      }
      autopreview(this.document, line);
    }.bind(this));

    this.setState({toc: array});
  }

  onScroll() {
    var viewport = this.document.getScrollInfo();

    var selectedToc = null;
    console.log(viewport);
    console.log(this.state.toc);
    this.state.toc.forEach( function(element, index) {
      if( element.coordinates.top <= viewport.top + 10 ) {
        selectedToc = element.line;
      }
    });

    if( this.state.selectedToc != selectedToc ) {
      this.setState({selectedToc});
      console.log(selectedToc);
    }
  }

  onToggleTOC () {
    this.setState({showToc: !this.state.showToc})
  }

  onSelectTocItem (item) {
    var headingCoordinates = this.document.charCoords({line: item.line, ch: 0}, "local");

    $(this.document.getScrollerElement()).animate({scrollTop: headingCoordinates.top}, 300, function() {
      this.document.setCursor(item.line, 0);
      this.document.focus();
    }.bind(this));
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
              // if (SpellChecker.isMisspelled(word)) {
              //   return "spell-error";
              // }
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
