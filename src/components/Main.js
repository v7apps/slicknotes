require('normalize.css');
require('styles/App.scss');

eRequire('electron').webFrame.setZoomLevelLimits(1, 1);

import React from 'react';

var CodeMirror = require('codemirror');

/** Base setup */
require('codemirror/mode/gfm/gfm');
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
require('codemirror/theme/neo.css');
// require('codemirror/theme/mdn-like.css');
// require('codemirror/theme/elegant.css');

require('styles/editor-light.scss');

let math = require('mathjs');
let moment = require('moment');
let classNames = require('classnames');

let SplitPane = require('./SplitPane/SplitPane');

// let db = new loki('loki.json');

class AppComponent extends React.Component {

  constructor() {
    super();

    var notes = [
        {id: 1, title: "01 - Getting Started", date: new Date(), text: "01 - Getting Started"},
        {id: 2, title: "02 - Getting Started", date: new Date(), text: "02 - Getting Started"},
        {id: 3, title: "03 - Getting Started", date: new Date(), text: "03 - Getting Started"},
        {id: 4, title: "04 - Getting Started", date: new Date(), text: "04 - Getting Started"}
      ];

    this.state = {notes, activeItem: 0};
  }

  render() {
        // [extract-gfm]

    return (
      <SplitPane split="vertical" minSize="100" defaultSize="250" maxSize="500" className="index">
        <div className="sidebar">
          <div className="list">
            {this.state.notes.map(function(item, index) {
              return (<div className={classNames('list-item', { active: this.state.activeItem == index })} key={item.id} onClick={function(){this.onSelectItem(index)}.bind(this)}>
                <div className="title">{item.title}</div>
                <div className="date">{moment(item.date).fromNow()}</div>
              </div>);
            }.bind(this))}
          </div>

        </div>
        <div className="editor">
          <div className="note-title">
            <input ref="noteTitle" className="note-title-input" placeholder="Untitled Note" onChange={this.onTextChange.bind(this)} />
          </div>
          <div ref="noteEditor" className="note-editor">
          </div>
        </div>
      </SplitPane>
    );
  }

  componentDidMount() {
    this.document = CodeMirror(this.refs.noteEditor, {
      mode: {
        name: "gfm",
        highlightFormatting: true
      },
      lineWrapping: true,
      keyMap: "sublime",
      theme: 'neo',
      foldGutter: true,
      highlightSelectionMatches: true,
      styleActiveLine: true,
      extraKeys: {
        "Enter": "newlineAndIndentContinueMarkdownList",
        "Ctrl-Alt-C": this.performCalculation.bind(this)
      }
    });

    this.document.on('cursorActivity', this.refreshPreview.bind(this));
    this.document.on('change', this.onTextChange.bind(this));
  }

  onTextChange() {
    if( this.switchingDocument ) {
      this.switchingDocument = false;
      return;
    }

    var item = this.state.notes[this.state.activeItem];
    item.text = this.document.getValue();
    item.title = this.refs.noteTitle.value;

    this.setState({notes: this.state.notes});
  }

  onSelectItem(index) {
    var item = this.state.notes[index];
    this.setState({activeItem: index});
    this.switchingDocument = true;

    this.refs.noteTitle.value = item.title;
    this.document.setValue(item.text || "");

    this.document.focus();
  }

  // focusEditor() {
  //   if( !this.document.hasFocus() ) {
  //     var lastLine = this.document.lastLine();
  //     var lineLength = this.document.getLineHandle(lastLine).text.length;

  //     this.document.setCursor(lastLine, lineLength);
  //     this.document.focus();
  //   }
  // }

  refreshPreview() {
    // console.log("cursorActivity");
    // console.log(this.document.getViewport());
    this.document.eachLine(function(line) {
      // line.startsWith("#")
    }.bind(this));
  }

  performCalculation() {
    var selections = this.document.getSelections();
    var results = selections.map( function(element, index) {

      try {
        var result = math.eval(element);
        var separator = " = ";

        if ( typeof result == "function" ) {
        }
        else if ( result.type == "ResultSet" ) {
          result = result.entries[result.entries.length - 1];
          separator = "\n= ";
        }

        return element + separator + String(result);

      } catch(e) {
        console.log(e);
        return element;
      }

    });

    this.document.replaceSelections(results);
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
