import React from 'react';

/* Libraries */
const moment = require('moment');
const classNames = require('classnames');

/* Components */
const NoteStore = require('../../stores/NoteStore');

class SidebarComponent extends React.Component {

  constructor() {
    super();
    this.state = {notes: []};
  }

  componentDidMount() {
    NoteStore.fetchNotes().then(function(notes) {
      console.log(notes);
      if( notes.length > 0 ) {
        this.setState({notes, activeItem: notes[0]._id});
        this.props.onSelectItem(notes[0]);
      }
      else {
        this.setState({notes});
      }
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

}

SidebarComponent.defaultProps = {
};

export default SidebarComponent;
