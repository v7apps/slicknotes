'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _react2.default.createClass({
    displayName: 'Pane',
    getInitialState: function getInitialState() {
        return {};
    },
    render: function render() {
        var split = this.props.split;
        var classes = ['Pane', split];

        var style = {
            flex: 1,
            position: 'relative',
            outline: 'none',
            overflow: 'auto',
            height: '100%'
        };
        if (this.state.size !== undefined) {
            if (split === 'vertical') {
                style.width = this.state.size;
            } else {
                style.height = this.state.size;
                style.display = 'flex';
            }
            style.flex = 'none';
        }
        var prefixed = { styles: style };

        return _react2.default.createElement(
            'div',
            { className: classes.join(' '), style: prefixed.styles },
            this.props.children
        );
    }
});
module.exports = exports['default'];
