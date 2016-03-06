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
      autoload: true
    });

    // this.db.insert([{ title: "Note 5" }, { title: "Note 42" }], function (err, newDocs) {
    // });
  }

  un(event, callback) {
    this.removeListener(event, callback);
  }

  fetchNotes() {
    return new Promise(function (resolve, reject) {
      this.db.find({}, function (err, docs) {
        if(err) {
          return reject(err);
        }
        else {
          resolve(docs);
        }
      });
    }.bind(this));
  }

  getSelectedNote() {
    return {
      note: this.selectedNote,
      contents: this.selectedNoteContents
    };
  }

  create() {
    return new Promise(function (resolve, reject) {
      var newNote = this.db.insert({}, function (err, newNote) {
        if(err) {
          return reject(err);
        }
        else {
          this.emit("LIST_CHANGED_EVENT");
          return resolve(docs);
        }
      });
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

            console.log('It\'s saved!');
            this.emit("LIST_CHANGED_EVENT");
            resolve(newNote);

          }.bind(this));
        }
        else {
          resolve(newNote);
        }

      }.bind(this));
    }.bind(this));
  }

  select(note) {
    var notePath = path.join(this.notesFolder, `${note._id}.md`)
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

}

let single = new NoteStore();
module.exports = single;
export default single;
