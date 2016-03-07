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
  }

  componentDidUpdate() {
    if (this.state.searchText !== this.props.searchText) {
      this.onSearch();
    }
    
  }

  refreshNotes() {
    NoteStore.fetchNotes().then(function(notes) {
      console.log(notes);
      // if( notes.length == 0 || this.state.activeItem >= 0) {
        this.setState({notes: notes, notesMain: notes});
      // }
      // else {
      //   this.setState({notes, activeItem: notes[0]._id});
      //   this.props.onSelectItem(notes[0]);
      // }
    }.bind(this));
  }

  render() {
    return (
      <div className="list">
        {this.state.notes.map(function(item, index) {
          return (<div className={classNames('list-item', { active: this.state.activeItem == item._id })} key={item._id} onClick={function(){this.onSelectItem(index)}.bind(this)}>
            <div className="title">{item.title}</div>
            <div className="date">Last modified: {moment(item.updatedAt).fromNow()}</div>
          </div>);
        }.bind(this))}
      </div>
    );
  }

  onSelectItem(index) {
    var item = this.state.notes[index];
    this.setState({activeItem: item._id});
    this.props.onSelectItem(item);
  }

  onSearch() {
    var self = this;
    self.setState({searchText: self.props.searchText});
    if (self.props.searchText.length == 0) {
      this.refreshNotes();
    }
    else {
      var obj = self.state.notesMain.filter(function ( obj ) {
      // console.log(obj.title.indexOf(self.props.searchText));
    return obj.title.indexOf(self.props.searchText) >= 0;
    });
    
    this.setState({notes: obj});
    }
    
    
  }

}

SidebarComponent.defaultProps = {
};

export default SidebarComponent;
