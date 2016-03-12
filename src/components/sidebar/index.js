import React from 'react';

/* Libraries */
const moment = require('moment');
const classNames = require('classnames');

/* Components */
const NoteStore = require('../../stores/NoteStore');

class SidebarComponent extends React.Component {

  constructor() {
    super();
    this.state = {notes: [], searchText: '', notesMain:[]};
  }

  componentDidMount() {
    this.refreshNotes();
    NoteStore.on("LIST_CHANGED_EVENT", this.refreshNotes.bind(this));
    NoteStore.on("SELECTION_CHANGED_EVENT", this.onNoteSelectedChanged.bind(this));
  }

  // componentDidUpdate() {
  //   if (this.state.searchText !== this.state.searchText) {
  //     this.onSearch();
  //   }

  // }

  refreshNotes() {
    NoteStore.fetchNotes().then(function(notes) {

      if( notes.length == 0 || this.state.activeItem !== undefined) {
        this.setState({notes: notes, notesMain: notes});
      }
      else {
        this.setState({notes, activeItem: notes[0]._id});
        this.props.onSelectItem(notes[0]);
      }

      if( this.state.searchText ) {
        this.onSearch(this.state.searchText);
      }

    }.bind(this));
  }

  render() {
    return (
      <div>
        <div id="masthead">
          <span className="title">SlickNotes</span>
          <div className="search-container">
            <input ref="search" className="quick-search" type="text" placeholder="Quick search" onChange={this.onChangeSearchText.bind(this)}/>
            <i className="fa fa-search"></i>
          </div>
          <div className="spacer" style={{flex: 1}}></div>
          <div className="button add-button" onClick={this.createNewNote.bind(this)}>
            <i className="fa fa-plus-circle"></i>
          </div>
        </div>
        <div className="list">
          {this.state.notes.map(function(item, index) {
            return (<div className={classNames('list-item', { active: this.state.activeItem == item._id })} key={item._id} onClick={function(){this.onSelectItem(index)}.bind(this)}>
              <div className="title">{item.title}</div>
              <div className="date">Last modified: {moment(item.updatedAt).fromNow()}</div>
            </div>);
          }.bind(this))}
        </div>
      </div>
    );
  }

  onNoteSelectedChanged() {
    if( this.state.activeItem != NoteStore.selectedNote._id ) {
      this.setState({activeItem: NoteStore.selectedNote._id});
    }
  }

  onSelectItem(index) {
    var item = this.state.notes[index];
    this.setState({activeItem: item._id});
    this.props.onSelectItem(item);
  }

  onSearch(searchText) {
    var self = this;
    var allNotes = NoteStore.getAllNotes();
    console.log(allNotes.length);
    self.setState({searchText: searchText});
    if (searchText.length == 0) {
      this.setState({notes: allNotes});
    }
    else {
      var notes = allNotes.filter(function ( obj ) {
        return obj.title.toLowerCase().indexOf(searchText.toLowerCase()) >= 0;
      });

      this.setState({notes});
    }

  }

  onChangeSearchText() {
    // console.log(this.refs.search.value);
    // this.setState({searchText: this.refs.search.value});
    this.onSearch(this.refs.search.value);
  }

  createNewNote() {

    var dateFormat = require('dateformat');
    var now = new Date();

    var date = dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss");
    NoteStore.create({'title': 'New note - ' + date}).then(function(note) {
      NoteStore.select(note);
    }.bind(this));
  }

}

SidebarComponent.defaultProps = {
};

export default SidebarComponent;
