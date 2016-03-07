require('normalize.css');
require('styles/App.scss');

const electron = eRequire('electron');
electron.webFrame.setZoomLevelLimits(1, 1);

import React from 'react';

/* Libraries */
const moment = require('moment');
const classNames = require('classnames');

/* Components */
const SplitPane = require('./SplitPane/SplitPane');
import Editor from './editor';
import Sidebar from './sidebar';

const NoteStore = require('../stores/NoteStore');

class AppComponent extends React.Component {

  constructor() {
    super();
    this.state = {
      notes: [],
      searchText: ''
    };
  }

  render() {
        // [extract-gfm]

    return (
      <div id="app-container" style={{display: "flex", flexDirection: "column"}}>
        <div id="masthead" style={{height: 44}}>
          <span className="title">SlickNotes</span>
          <input ref="search" className="quick-search" type="text" placeholder="Quick search" onChange={this.onChangeSearchText.bind(this)}/>
          <div className="spacer" style={{flex: 1}}></div>
          <div className="add-button" onClick={this.createNewNote.bind(this)}>+</div>
        </div>
        <SplitPane split="vertical" minSize="100" defaultSize="250" maxSize="500" style={{flex: 1}}>
          <Sidebar onSelectItem={this.onSelectItem.bind(this)} searchText={this.state.searchText}></Sidebar>
          <Editor note={this.state.selectedNote}></Editor>
        </SplitPane>
      </div>
    );
  }

  onSelectItem(item) {
    NoteStore.select(item);
  }

  onChangeSearchText() {

    console.log(this.refs.search.value);
    this.setState({searchText: this.refs.search.value});
  }

  createNewNote() {
    NoteStore.create({}).then(function(note) {
      NoteStore.select(note);
    }.bind(this));
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
