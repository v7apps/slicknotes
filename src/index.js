import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/Main';

const remote = eRequire('electron').remote;
const Menu = remote.Menu;

var template = require("./components/application-menu");
console.log(template);
var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// Render the main component into the dom
ReactDOM.render(<App />, document.getElementById('app'));
