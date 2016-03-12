require('normalize.css');
require('typopro-web/web/TypoPRO-OpenSans/TypoPRO-OpenSans.css');
require('typopro-web/web/TypoPRO-WorkSans/TypoPRO-WorkSans.css');
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
      searchText: '',
      itemSelected: false
    };
  }

  render() {

    var editorArea;
    if (this.state.itemSelected) {
      editorArea = <Editor note={this.state.selectedNote}></Editor>;
    }
    else {
      editorArea = <p> No Note Selected </p>

    }
    return (
      <div id="app-container" style={{display: "flex", flexDirection: "column"}}>
        <SplitPane split="vertical" minSize="100" defaultSize="250" maxSize="500" style={{flex: 1}}>
          <Sidebar onSelectItem={this.onSelectItem.bind(this)}></Sidebar>
          {editorArea}
        </SplitPane>
      </div>
    );
  }

  componentDidMount() {


    NoteStore.on("ITEM_DELETE_EVENT", this.refreshList.bind(this));
  }

  refreshList () {

    this.setState({itemSelected: false});

  }

  onSelectItem(item) {

    this.setState({itemSelected: true});
    setInterval(1000);
    NoteStore.select(item);
  }

}

AppComponent.defaultProps = {
};

export default AppComponent;
