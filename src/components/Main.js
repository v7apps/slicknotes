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
    this.state = {};
  }

  render() {
        // [extract-gfm]

    return (
      <SplitPane split="vertical" minSize="100" defaultSize="250" maxSize="500">
        <Sidebar onSelectItem={this.onSelectItem.bind(this)}></Sidebar>
        <Editor note={this.state.selectedNote}></Editor>
      </SplitPane>
    );
  }

  onSelectItem(item) {
    this.switchingDocument = true;
    NoteStore.select(item);
  }

}

AppComponent.defaultProps = {
};

export default AppComponent;
