/*
*   Abricotine - Markdown Editor
*   Copyright (c) 2015 Thomas Brouard
*   Licensed under GNU-GPLv3 <http://www.gnu.org/licenses/gpl.html>
*/

// Autopreview for CodeMirror

var path = require("path");
    // isUrl = require("is-url"),
    // parsePath = require("parse-filepath");
var $ = require("jquery");

function autopreview (cm, line) {

    function lineIsSelected (lineNumber) {
        // FIXME: doesnt work in case of multiple selection
        var cursor = {
            begin: doc.getCursor("from"),
            end: doc.getCursor("to")
        };
        return !(cursor.begin.line > lineNumber || cursor.end.line < lineNumber);
    }

    function replaceInLine (line, typeConfig) {
        var lineNumber,
            regex = typeConfig.regex,
            match,
            from,
            to,
            element,
            markOptions = typeConfig.marker,
            textMarker;
        if (typeof line === 'number') {
            lineNumber = line;
            line = doc.getLineHandle(line);
        } else {
            lineNumber = doc.getLineNumber(line);
        }
        if (lineIsSelected(lineNumber)){ return; }
        while ((match = regex.exec(line.text)) !== null) {
            from = {
                line: lineNumber,
                ch: match.index
            };
            to = {
                line: lineNumber,
                ch: from.ch + match[0].length
            };
            if (doc.findMarks(from, to).length > 0) {
                continue;
            }
            element = typeConfig.createElement(match);
            if (!element) {
                continue;
            }
            markOptions.replacedWith = element;
            textMarker = doc.markText(from, to, markOptions);
            if (typeConfig.callback && typeof typeConfig.callback === "function" && textMarker && element) {
                typeConfig.callback(textMarker, element);
            }
        }
    }

    var doc = cm.doc,
        config = {
            image: {
                regex: /!\[(["'-a-zA-Z0-9@:%._\+~#=\.\/! ]*)\]\(([\(\)\[\]-a-zA-Z0-9@:%_\+~#=\.\/ ]+\.(jpg|jpeg|png|gif|svg))(\s("|')([-a-zA-Z0-9@:%_\+~#=\.\/! ]*)("|')\s?)?\)/gi,
                createElement: function (match) {
                    function getImageUrl (href) {
                        return href;
                        // if (isUrl(href)) {
                        //     return href;
                        // }
                        // var parsedPath = parsePath(href);
                        // if (parsedPath.isAbsolute) {
                        //     return parsedPath.absolute;
                        // } else {
                        //     return path.join(process.cwd(), href);
                        // }
                    }
                    var alt = match[1] || '',
                        url = getImageUrl(match[2]),
                        title = match[6],
                        $element = $("<img class='autopreview-image'>").attr("src", url).attr("alt", alt);
                    if (title) {
                        $element.attr("title", title);
                    }
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: false,
                    handleMouseEvents: true,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    var onclickFunc = function() {
                        var pos = textMarker.find().to;
                        textMarker.clear();
                        cm.doc.setCursor(pos);
                        cm.focus();
                    };
                    textMarker.on("beforeCursorEnter", function () {
                        if (!doc.somethingSelected()) { // Fix blink on selection
                            textMarker.clear();
                        }
                    });
                    element.addEventListener("load", function() {
                        textMarker.changed();
                    }, false);
                    element.onerror = function() {
                        $(element).replaceWith("<span class='autopreview-image image-error'></span>");
                        element.onclick = onclickFunc;
                        textMarker.changed();
                    };
                    element.onclick = onclickFunc;
                }
            },
            anchor: {
                regex: /\[(["'-a-zA-Z0-9@:%._\+~#=\.\/! ]*)\]\(([\(\)\[\]-a-zA-Z0-9@:%_\+~#=\.\/ ]+)(\s("|')([-a-zA-Z0-9@:%_\+~#=\.\/! ]*)("|')\s?)?\)/gi,
                createElement: function (match) {
                    var alt = match[1] || '',
                        url = match[2],
                        title = match[6],
                        $element = $(`<a>${alt}</a>`).attr("href", url);
                    if (title) {
                        $element.attr("title", title);
                    }
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: false,
                    handleMouseEvents: true,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    var onclickFunc = function() {
                      console.log("click");
                        console.log(element);
                        var pos = textMarker.find().to;
                        textMarker.clear();
                        cm.doc.setCursor(pos);
                        cm.focus();
                    };
                    textMarker.on("beforeCursorEnter", function () {
                        if (!doc.somethingSelected()) { // Fix blink on selection
                            textMarker.clear();
                        }
                    });
                    element.addEventListener("load", function() {
                        textMarker.changed();
                    }, false);
                    element.onclick = onclickFunc;
                }
            },
            todolist: {
                regex: /^(\*|-|\+)\s+\[(\s*|x)?\]\s+/g,
                createElement: function (match) {
                    var isChecked = match[2] === "x",
                        checkedClass = isChecked ? " checked" : "",
                        $element = $("<span class='autopreview-todolist todolist" + checkedClass +"'></span>");
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: true,
                    handleMouseEvents: false,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    var $element = $(element);
                    $element.click( function () {
                        var pos = textMarker.find(),
                            isChecked = $(this).hasClass("checked"),
                            newText = isChecked ? "* [] " : "* [x] ";
                        doc.replaceRange(newText, pos.from, pos.to);
                        $(this).toggleClass("checked");
                    });
                }
            },
            math: {
                regex: /\${2}[^$]+\${2}/gi,
                createElement: function (match) {
                    var $element = $("<span class='math autopreview-math'>" + match[0] + "</span>");
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: false,
                    handleMouseEvents: true,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    var onMathLoaded = function () {
                        textMarker.changed();
                    };
                    window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, element], [onMathLoaded, undefined]);
                    textMarker.on("beforeCursorEnter", function () {
                        if (!doc.somethingSelected()) { // Fix blink on selection
                            textMarker.clear();
                        }
                    });
                }
            },
            header: {
                regex: /^([\#]+) (.+)/gi,
                createElement: function (match) {
                    // <span><span class="cm-m-markdown cm-header cm-header-1">h1</span></span>
                    // var $element = $("<span style=\"background-color: 'yellow'\" class='math autopreview-math'>" + match[1] + "</span>");
                    // var $element = $("<span style=\"background-color: 'yellow'\" class='math autopreview-math'>" + match[1] + "</span>");
                    var $element = $('<span><span class="cm-m-markdown cm-header cm-header-' + match[1].length + '">' + match[2] + '</span></span>');
                    return $element.get(0);
                },
                marker: {
                    clearOnEnter: false,
                    handleMouseEvents: true,
                    inclusiveLeft: true,
                    inclusiveRight: true
                },
                callback: function (textMarker, element) {
                    textMarker.on("beforeCursorEnter", function () {
                        if (!doc.somethingSelected()) { // Fix blink on selection
                            textMarker.clear();
                        }
                    });
                }
            }
        };

    var types = ["image", "atodolist", "math", "header", "anchor"];

    types.forEach( function(element, index) {
      if( config[element] ) {
        replaceInLine(line, config[element]);
      }
    });
}

module.exports = autopreview;
