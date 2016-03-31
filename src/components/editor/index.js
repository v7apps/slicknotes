import React from 'react';

var CodeMirror = require('codemirror');

/** Base setup */
require('./mode/slick-notes');
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
const SpellChecker = remote.require('spellchecker');

import CalculatorAddon from './addons/calculator';
var autopreview = require('./addons/autopreview');
require('./addons/continuelist');

const NoteStore = require('../../stores/NoteStore');

const tidyMarkdown = require('tidy-markdown');

class EditorComponent extends React.Component {

  constructor() {
    super();
    this.state = {
      toc: [],
      showToc: true,
      lineWrapping: true,
      noSelection: true
    };

    this.openDocuments = {};
  }

  render() {

    return (
      <div className={classNames("editor", {"empty": this.state.noSelection})}>
        {this.state.noSelection && <div className="empty-message">No Note Selected</div>}
        <div style={{flexDirection: 'row'}}>
          <div className="note-title" style={{display: 'flex'}}>
            <input ref="noteTitle"
                   className="note-title-input"
                   placeholder="Untitled Note"
                   onChange={this.onTextChange.bind(this)}/>
          </div>
          <div className="title-toolbar">

            <div className="button" onClick={this.onToggleWrapping.bind(this)}>
              <i className="fa fa-align-justify"></i>
            </div>

            <div className="button">
              <i className="fa fa-eye"></i>
            </div>

            <div className="button" onClick={this.onToggleTOC.bind(this)}>
              <i className="fa fa-list"></i>
            </div>

            <div className="button" onClick={this.onDeleteNote.bind(this)}>
              <i className="fa fa-trash"></i>
            </div>

          </div>
        </div>
        <div className="note-container">
          <div ref="noteEditor" className={classNames("note-editor", {"with-toc": this.state.showToc})}>
          </div>
          <div className="toc-list">
            {
              this.state.showToc && this.state.toc.map(function (item, index) {
                return (
                  <div
                    className={classNames('toc-list-item', 'toc-item-level-' + item.level, {active: this.state.selectedToc == item.line})}
                    key={item.line} onClick={function() { this.onSelectTocItem(item)}.bind(this)}>
                    <div className="title"><a href='#'>{item.text}</a></div>

                  </div>);
              }.bind(this))
            }
          </div>
        </div>
      </div>

    );
  }

  componentDidMount() {
    NoteStore.on("SELECTION_CHANGED_EVENT", this.noteSelectedChanged.bind(this));

    var doc = CodeMirror(this.refs.noteEditor, {
      mode: "slick-notes",
      lineWrapping: this.state.lineWrapping,
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
        "Cmd-=": function () {
          var cmEditor = $(".CodeMirror");
          var oldSize = parseInt(cmEditor.css("font-size")),
            newSize = oldSize + 2;
          cmEditor.css("font-size", "" + newSize + "px");
          doc.refresh();
        },
        "Cmd--": function () {
          var cmEditor = $(".CodeMirror");
          var oldSize = parseInt(cmEditor.css("font-size")),
            newSize = oldSize - 2;
          cmEditor.css("font-size", "" + newSize + "px");
          doc.refresh();
        }
      }
    });

    doc.on('cursorActivity', this.refreshPreview.bind(this));
    doc.on('change', this.onTextChange.bind(this));

    var executeCommand = function (item) {
      switch (item.command) {
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
        case "beautify":
          //console.log(doc.getSelection());
          //doc.setValue(tidyMarkdown(doc.getValue()));
          doc.replaceSelection(tidyMarkdown(doc.getSelection()));
          break;
        case "fixSpelling":
          var curserPos = doc.getCursor();
          var token = doc.getTokenAt(curserPos);
          doc.replaceRange(item.label, {line: curserPos.line, ch: token.start}, {line: curserPos.line, ch: token.end});
          break;
        default:
          doc.execCommand(item.command);
      }

      doc.focus();
    };

    var menuTemplate = [
      {
        "label": "Undo",
        "accelerator": "CmdOrCtrl+Z",
        "command": "undo",
        click: executeCommand
      }, {
        "label": "Redo",
        "accelerator": "CmdOrCtrl+Y",
        "command": "redo",
        click: executeCommand
      }, {
        "type": "separator"
      }, {
        "label": "Cut",
        "command": "cut",
        click: executeCommand
      }, {
        "label": "Copy",
        "command": "copy",
        click: executeCommand
      }, {
        "label": "Paste",
        "command": "paste",
        click: executeCommand
      }, {
        "type": "separator"
      }, {
        "label": "Select all",
        "accelerator": "CmdOrCtrl+A",
        "command": "selectAll",
        click: executeCommand
      }, {
        "type": "separator"
      }, {
        "label": "Calculate",
        "accelerator": "Ctrl+Alt+C",
        "command": "calculate",
        "click": executeCommand
      }, {
        "label": "Beautify",
        "command": "beautify",
        "click": executeCommand
      }];
    var menu = new Menu.buildFromTemplate(menuTemplate);

    doc.on('contextmenu', function (c, e) {
      e.preventDefault();

      var coordinates = doc.coordsChar({
        left: e.pageX,
        top: e.pageY
      }, "window");

      console.log(coordinates);

      //doc.setCursor(coordinates);

      var isOnSelection = false;
      doc.listSelections().forEach(function(sel) {

        if( isOnSelection ) { return; }

        console.log(sel);
        var startLine = sel.from().line;
        var startChar = sel.from().ch;

        var endLine = sel.to().line;
        var endChar = sel.to().ch;

        if( coordinates.line >= startLine && coordinates.line <= endLine ) {

          if( startLine == endLine ) {
            isOnSelection = coordinates.ch >= startChar && coordinates.ch <= endChar;
          }
          else {
            if( coordinates.line == startLine ) {
              isOnSelection = coordinates.ch >= startChar;
            }
            else if( coordinates.line == endLine ) {
              isOnSelection = coordinates.ch <= startChar;
            }
            else {
              isOnSelection = true;
            }
          }

        }

      });

      var menuToShow = null;
      if( !isOnSelection ) {
        var token = doc.getTokenAt(coordinates);
        console.log(token);

        doc.setSelection({line: coordinates.line, ch: token.start}, {line: coordinates.line, ch: token.end});

        if (token.type && token.type.indexOf("spell-error") >= 0) {
          //console.log("suggestions for " + token.string);
          var suggestions = SpellChecker.getCorrectionsForMisspelling(token.string);
          var suggestionMenuItems = suggestions.map(function (s) {
            return {
              label: s,
              command: "fixSpelling",
              click: executeCommand
            };
          });

          suggestionMenuItems.push({"type": "separator"});

          var menuItems = suggestionMenuItems.concat(menuTemplate);
          menuToShow = new Menu.buildFromTemplate(menuItems);
        }

      }

      menuToShow = menuToShow || menu;

      setTimeout(function() {
        menuToShow.popup(remote.getCurrentWindow());
      }, 50);

    }, false);

    //doc.on('scroll', this.onScroll.bind(this));

    this.document = doc;
  }

  componentWillUnmount() {
    //NoteStore.un("SELECTION_CHANGED_EVENT");
  }

  noteSelectedChanged(note) {

    var data = NoteStore.getSelectedNote();

    if( data ) {
      this.note = data.note;
      this.originalContent = data.contents;
      this.refs.noteTitle.value = this.note.title;

      //this.document.setValue(data.contents);
      if( ! this.openDocuments[this.note._id] ) {
        this.openDocuments[this.note._id] = CodeMirror.Doc(data.contents, "slick-notes");
      }

      this.document.swapDoc(this.openDocuments[this.note._id]);
      this.document.focus();
    }
    else {
      this.note = null;
      this.originalContent = null;
      this.refs.noteTitle.value = "";
    }

    if( this.state.noSelection && this.note ) {
      //setTimeout(function() {
      //  this.document.refresh();
      //}.bind(this), 100);
    }

    this.setState({noSelection: !this.note});
  }

  onTextChange() {

    var newContent = this.document.getValue();

    if (this.originalContent == newContent) {
      newContent = null;
    }

    if( !newContent && this.note.title == this.refs.noteTitle.value ) {
      return;
    }

    this.note.title = this.refs.noteTitle.value;
    NoteStore.save(this.note, newContent);

  }

  onDeleteNote() {
    var data = NoteStore.getSelectedNote();

    var answer = confirm('Are you sure?');

    if (answer) {
      NoteStore.delete(data.note);
      NoteStore.select();
    }

  }

  refreshPreview() {

    var array = [];
    this.document.eachLine(function (line) {
      var matches = /^([\#]+) (.+)/gi.exec(line.text);
      if (matches) {
        var lineNumber = this.document.getLineNumber(line);
        var headingCoordinates = this.document.charCoords({
          line: lineNumber,
          ch: 0
        }, "local");

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

    this.setState({
      toc: array
    });
  }

  onScroll() {
    var viewport = this.document.getScrollInfo();

    var selectedToc = null;

    this.state.toc.forEach(function (element, index) {
      if (element.coordinates.top <= viewport.top + 10) {
        selectedToc = element.line;
      }
    });

    if (this.state.selectedToc != selectedToc) {
      this.setState({
        selectedToc
      });
    }
  }

  onToggleWrapping() {
    var lineWrapping = !this.state.lineWrapping;
    this.setState({lineWrapping});
    this.document.setOption("lineWrapping", lineWrapping);
  }

  onToggleTOC() {
    this.setState({
      showToc: !this.state.showToc
    })
  }

  onSelectTocItem(item) {
    var headingCoordinates = this.document.charCoords({
      line: item.line,
      ch: 0
    }, "local");

    $(this.document.getScrollerElement()).animate({
      scrollTop: headingCoordinates.top
    }, 300, function () {
      this.document.setCursor(item.line, 0);
      this.document.focus();
    }.bind(this));
  }

}

export default EditorComponent;
