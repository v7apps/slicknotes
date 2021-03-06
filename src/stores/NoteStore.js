'use strict';

import EventEmitter from 'events';

var remote = eRequire('remote')
var app = remote.require('app')

const path = require('path');
const fs = remote.require('fs');

class NoteStore extends EventEmitter {

  constructor() {
    super();

    this.appDataFolder = app.getPath("userData");
    console.log(this.appDataFolder);

    this.notesFolder = path.join(this.appDataFolder, 'notes');

    try {
      fs.accessSync(this.notesFolder, fs.R_OK | fs.W_OK);
    }
    catch(e) {
      console.log(e);
      fs.mkdirSync(this.notesFolder);
    }

    var Datastore = require('nedb');
    this.db = new Datastore({
      filename: path.join(this.appDataFolder, 'notes.db'),
      timestampData: true,
      autoload: true
    });

    // this.db.insert([{ title: "Note 5" }, { title: "Note 42" }], function (err, newDocs) {
    // });
  }

  un(event, callback) {
    this.removeListener(event, callback);
  }

  getAllNotes () {
    return this.docs == undefined ? [] : this.docs;
  }

  fetchNotes() {
    return new Promise(function (resolve, reject) {
      this.db.find({}).sort({ updatedAt: -1 }).exec(function (err, docs) {
        if(err) {
          return reject(err);
        }
        else {
          this.docs = docs;
          resolve(docs);
        }
      }.bind(this));
    }.bind(this));
  }

  searchNotes(query) {
    var regex = '/' + query + '/';
    console.log(regex);
    return new Promise(function (resolve, reject) {
      this.db.find({title: regex}).sort({ updatedAt: -1 }).exec(function (err, docs) {
        if(err) {
          console.log(err);
          return reject(err);
        }
        else {

          resolve(docs);
        }
      });
    }.bind(this));
  }

  getSelectedNote() {
    if ( this.selectedNote ) {
      return {
        note: this.selectedNote,
        contents: this.selectedNoteContents
      };
    }

    return null;
  }

  create(data) {
    var date = new Date().toString;
    return new Promise(function (resolve, reject) {
      var newNote = this.db.insert(data, function (err, newNote) {
        if(err) {
          return reject(err);
        }
        else {
          this.emit("LIST_CHANGED_EVENT");
          return resolve(newNote);
        }
      }.bind(this));
    }.bind(this));
  }

  save(note, contents) {

    return new Promise(function (resolve, reject) {
      var newNote = this.db.update({_id: note._id}, note, function (err, newNote) {
        if(err) {
          return reject(err);
        }
        else if (contents) {
          var notePath = path.join(this.notesFolder, `${note._id}.md`);
          fs.writeFile(notePath, contents, function(err) {
            if (err) throw err;

            this.emit("LIST_CHANGED_EVENT");
            resolve(newNote);

          }.bind(this));
        }
        else {
          this.emit("LIST_CHANGED_EVENT");
          resolve(newNote);
        }

      }.bind(this));
    }.bind(this));
  }

  select(note) {
    if( !note ) {
      this.selectedNote = null;
      this.selectedNoteContents = null;
      this.emit("SELECTION_CHANGED_EVENT");
      return;
    }

    var notePath = path.join(this.notesFolder, `${note._id}.md`);
    fs.readFile(notePath, 'utf8', function(err, data) {
      if(err) {
        console.warn(err);
        this.selectedNoteContents = "";
      }
      else {
        this.selectedNoteContents = data;
      }

      this.selectedNote = note;
      this.emit("SELECTION_CHANGED_EVENT");
    }.bind(this));

  }

  delete(note) {

    this.db.remove({ _id: note._id}, {}, function (err, numRemoved) {
      if (err) {
        throw err;
      }
      else {
        this.emit("LIST_CHANGED_EVENT");
        this.emit("ITEM_DELETE_EVENT");
      }
    }.bind(this));
  }

}

let single = new NoteStore();
module.exports = single;
export default single;
