"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function tinySheet(containerEl, options) {
  var _this = this;

  this.containerEl = containerEl;
  var elements = Array.from(containerEl.getElementsByTagName('input'));
  this.elements = elements;
  var undoIndex = 0;
  var patches;

  if (options && options.patches) {
    var matrix = getElementsMatrix();
    applyPatches(options.patches.flat(), matrix);
    patches = options.patches;
    undoIndex = patches.length;
  } else {
    patches = [];
  }

  this.patches = patches;
  var clipTextarea = document.createElement('TEXTAREA');
  var clpStl = clipTextarea.style;
  clpStl['position'] = 'absolute';
  clpStl['border'] = 'none';
  clpStl['color'] = 'transparent';
  clpStl['background'] = 'transparent';
  clpStl['text-shadow'] = '0 0 0 transparent';
  clpStl['width'] = '0.10em';
  clpStl['height'] = '0.10em';
  clpStl['z-index'] = -9999;
  clpStl['resize'] = 'none';
  clpStl['outline'] = 'none';
  clpStl['ĺeft'] = '-99999999px';
  clipTextarea.classList.add('tnys-clip');

  function setClipElPosition(element) {
    clipTextarea.style.left = '' + (element.getBoundingClientRect().x + window.scrollX + 3) + 'px';
    clipTextarea.style.top = '' + (element.getBoundingClientRect().y + window.scrollY + 3) + 'px';
  }

  document.body.appendChild(clipTextarea);
  var enablePaste = true; // TODO: best minimal value

  var keydownTimeout = 20;
  var keyupTimeout = keydownTimeout + 10;
  clipTextarea.addEventListener('keyup', function (evt) {
    enablePaste = true; // clipTextarea.focus()

    clipTextarea.setSelectionRange(0, clipTextarea.value.length);

    if (evt.keyCode === 17) {
      window.setTimeout(function () {
        var focusElement = containerEl.getElementsByClassName('tnys-focus')[0];

        if (focusElement) {
          focusElement.focus({
            preventScroll: true
          });
        }
      }, keyupTimeout);
    }
  });
  clipTextarea.addEventListener('keydown', function (evt) {
    if (evt.ctrlKey && evt.key === 'v') {
      if (!enablePaste) {
        evt.preventDefault();
        return;
      }

      enablePaste = false;
      var focusElement = containerEl.getElementsByClassName('tnys-focus')[0];

      if (focusElement) {
        window.setTimeout(function () {
          var data = parseArrayString(evt.target.value);
          var sourceHeigth = data.length;
          var sourceWidth = data[0].length;
          var extendElements = Array.from(containerEl.getElementsByClassName('tnys-sel'));
          var extendElementsMatrix;

          if (extendElements.length) {
            var _extendWidth = extendElements.filter(function (el) {
              return el.getBoundingClientRect().y === extendElements[0].getBoundingClientRect().y;
            }).length;
            extendElementsMatrix = arrayIntoChunks(extendElements, _extendWidth);
          } else {
            extendElementsMatrix = [[focusElement]];
          }

          var elements = Array.from(containerEl.getElementsByTagName('input'));
          var pasteAreaElements = elements.filter(function (el) {
            return el.getBoundingClientRect().y >= extendElementsMatrix[0][0].getBoundingClientRect().y && el.getBoundingClientRect().x >= extendElementsMatrix[0][0].getBoundingClientRect().x;
          });
          var pasteAreaWidth = pasteAreaElements.filter(function (el) {
            return el.getBoundingClientRect().y === pasteAreaElements[0].getBoundingClientRect().y;
          }).length;
          var pasteAreaElementsMatrix = arrayIntoChunks(pasteAreaElements, pasteAreaWidth);
          var pasteAreaHeigth = pasteAreaElementsMatrix.length;
          var extendHeigth = extendElementsMatrix.length;
          var extendWidth = extendElementsMatrix[0].length;
          var pasteHeigth = Math.max(Math.floor(extendHeigth / sourceHeigth) * sourceHeigth, sourceHeigth);
          var pasteWidth = Math.max(Math.floor(extendWidth / sourceWidth) * sourceWidth, sourceWidth);

          if (pasteHeigth > pasteAreaHeigth) {
            console.error('cannot paste (pasteHeigth > pasteAreaHeigth)');
            return;
          }

          if (pasteWidth > pasteAreaWidth) {
            console.error('cannot paste (pasteWidth > pasteAreaWidth)');
            return;
          }

          var pastePatches = [];
          var rowColIndexObj = getRowColIndex(extendElementsMatrix[0][0]);

          for (var i = 0; i < pasteHeigth; i++) {
            for (var j = 0; j < pasteWidth; j++) {
              pasteAreaElementsMatrix[i][j].value = data[i % sourceHeigth][j % sourceWidth];
              pasteAreaElementsMatrix[i][j].classList.add('tnys-sel');
              var key = "".concat(rowColIndexObj.rowIndex + i, "_").concat(rowColIndexObj.colIndex + j);
              pastePatches.push({
                op: 'add',
                path: "/".concat(key),
                value: pasteAreaElementsMatrix[i][j].value
              });
            }
          }

          patchesSlice();
          patches.push(pastePatches);
        }, keydownTimeout);
      }
    } else {
      if (evt.ctrlKey && evt.key === 'c') {// let native copy...
      } else {
        clipTextarea.blur();
        var _focusElement = containerEl.getElementsByClassName('tnys-focus')[0];

        _focusElement.focus({
          preventScroll: true
        }); // focusElement.focus()


        Object.defineProperty(evt, 'target', {
          value: _focusElement
        });
        keydownEventHandler(evt);
      }
    }
  });

  function patchesSlice() {
    patches.splice(undoIndex++);
  }

  function getElementsMatrix() {
    var elementsArray = Array.from(elements);
    var width = elementsArray.filter(function (el) {
      return el.getBoundingClientRect().y === elementsArray[0].getBoundingClientRect().y;
    }).length;
    var elementsMatrix = arrayIntoChunks(elementsArray, width);
    return elementsMatrix;
  }

  this.getElementsMatrix = getElementsMatrix;

  function getData() {
    return getElementsMatrix().map(function (row) {
      return row.map(function (cell) {
        return cell.value;
      });
    });
  }

  this.getData = getData;
  var cellMap = {
    pointers: {}
  };

  this.setMap = function () {
    var m = getElementsMatrix();
    cellMap.pointers = {};

    for (var l = 0; l < m.length; l++) {
      for (var c = 0; c < m[l].length; c++) {
        var id = "".concat(l, "_").concat(c);
        m[l][c].setAttribute('tnys-id', id);
        cellMap.pointers[id] = {
          t: m[l - 1] ? m[l - 1][c] : undefined,
          b: m[l + 1] ? m[l + 1][c] : undefined,
          l: m[l] ? m[l][c - 1] : undefined,
          r: m[l] ? m[l][c + 1] : undefined
        };
      }
    }
  };

  function applyPatches(patches, elementsMatrix) {
    patches.forEach(function (op) {
      var rowAndColArr = op.path.split('/')[1].split('_').map(function (x) {
        return parseInt(x);
      });
      var targetRow = elementsMatrix[rowAndColArr[0]];

      if (targetRow) {
        var targetElement = targetRow[rowAndColArr[1]];
        targetElement.value = op.value;
      } else {
        console.warn("row ".concat(op.path, " does not exists."));
      }
    });
  }

  function setClipTextareaValue(evt, element) {
    var extendElements = Array.from(containerEl.getElementsByClassName('tnys-sel'));

    if (!extendElements.length) {
      extendElements = [element];
    }

    var extendWidth = extendElements.filter(function (el) {
      return el.getBoundingClientRect().y === extendElements[0].getBoundingClientRect().y;
    }).length;
    var data = arrayIntoChunks(extendElements.map(function (el) {
      return el.value;
    }), extendWidth); // .map(arr => arr.join('\t'))

    var dataString = stringifyArray(data);
    clipTextarea.value = dataString;
    clipTextarea.focus();
    evt.preventDefault();
  }

  function getOrtogonalElements(elementsOfinterest, originElement, direction) {
    var elementsOfinterestIds = elementsOfinterest.map(function (el) {
      return el.getAttribute('tnys-id');
    });
    var filteredElements = [cellMap.pointers[originElement.getAttribute('tnys-id')][direction]];

    while (true) {
      var last = filteredElements[filteredElements.length - 1];

      if (!last) {
        filteredElements.pop(); // TODO: optimize this line

        filteredElements = filteredElements.filter(function (el) {
          return elementsOfinterestIds.includes(el.getAttribute('tnys-id'));
        });
        break;
      }

      filteredElements.push(cellMap.pointers[last.getAttribute('tnys-id')][direction]);
    }

    return filteredElements;
  }

  function focusWithoutScroll() {
    var focusElements = Array.from(containerEl.getElementsByClassName('tnys-focus'));
    var focusElement = focusElements[0];

    if (focusElement) {
      focusElement.blur();
      focusElement.focus({
        preventScroll: true
      });
    }
  }

  var lastTimeStamp = undefined;

  function keydownEventHandler(evt) {
    // for bit spreadsheets, throttle keydown speed to improve usability
    if (lastTimeStamp && elements.length > 3000 && evt.timeStamp < lastTimeStamp + 50) {
      evt.preventDefault();
      return;
    }

    lastTimeStamp = evt.timeStamp; // Ctrl

    if (!evt.target.classList.contains('tnys-editing') && evt.ctrlKey && evt.key === 'y') {
      evt.preventDefault();
      var undoPointer = patches[undoIndex];

      if (undoPointer) {
        var elementsMatrix = getElementsMatrix();
        applyPatches(undoPointer, elementsMatrix);
        undoIndex++;
      }

      return;
    }

    if (!evt.target.classList.contains('tnys-editing') && evt.ctrlKey && evt.key === 'z') {
      if (undoIndex > 0) {
        var _elementsMatrix = getElementsMatrix();

        var _undoPointer = patches[undoIndex - 1];

        _undoPointer.forEach(function (opUndo) {
          // reach previous patches for desired cell
          var found = false;

          for (var i = undoIndex - 2; i >= 0; i--) {
            if (patches[i].map(function (opQuery) {
              return opQuery.path;
            }).includes(opUndo.path)) {
              found = true; // set to previous found value

              applyPatches(patches[i].filter(function (opQuery) {
                return opQuery.path === opUndo.path;
              }), _elementsMatrix);
              break;
            }
          }

          if (!found) {
            var rowAndColArr = opUndo.path.split('/')[1].split('_').map(function (x) {
              return parseInt(x);
            });
            var targetElement = _elementsMatrix[rowAndColArr[0]][rowAndColArr[1]];
            targetElement.value = '';
          }
        });

        undoIndex--;
      }

      evt.preventDefault();
      return;
    }

    if (!evt.target.classList.contains('tnys-editing') && evt.ctrlKey) {
      setClipTextareaValue(evt, evt.target);
      clipTextarea.focus();
      clipTextarea.setSelectionRange(0, clipTextarea.value.length);
    }

    var navigationKeys = [8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 46, 91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145, 173, 174, 175, 181, 182, 183, 225];

    if (!evt.ctrlKey && !evt.target.classList.contains('tnys-editing') && !navigationKeys.includes(evt.keyCode)) {
      evt.target.setAttribute('tnys-prev-value', evt.target.value);
      evt.target.value = '';
      startCellEdit(evt.target);
    } // Delete or Backspace


    if (!evt.target.classList.contains('tnys-editing') && (evt.keyCode === 46 || evt.keyCode === 8)) {
      var deletePatches = [];
      elements.filter(function (el) {
        return el.classList.contains('tnys-sel') || el.classList.contains('tnys-focus');
      }).forEach(function (el) {
        if (el.value !== '') {
          el.value = '';
          var rowColIndexObj = getRowColIndex(el);
          var key = "".concat(rowColIndexObj.rowIndex, "_").concat(rowColIndexObj.colIndex);
          deletePatches.push({
            op: 'add',
            path: "/".concat(key),
            value: ''
          });
        }
      });

      if (deletePatches.length) {
        patchesSlice();
        patches.push(deletePatches);
      }
    } // Enter


    if (evt.keyCode === 13 && evt.target.classList.contains('tnys-editing')) {
      evt.target.classList.remove('tnys-editing');
      evt.target.classList.remove('tnys-editing-hard');
    } // F2


    if (evt.keyCode === 113) {
      evt.target.setAttribute('tnys-prev-value', evt.target.value);
      evt.target.focus();

      if (!evt.target.classList.contains('tnys-editing')) {
        moveCursorToEnd(evt.target);
      }

      evt.target.classList.add('tnys-editing-hard');
      startCellEdit(evt.target);
    } // esc


    if (evt.keyCode === 27 && evt.target.classList.contains('tnys-editing')) {
      evt.target.value = evt.target.getAttribute('tnys-prev-value');
      evt.target.classList.remove('tnys-editing');
      evt.target.classList.remove('tnys-editing-hard');
      moveCursorToEnd(evt.target); // evt.target.blur()
    } // Navigation


    if ([37, 38, 39, 40, 9].includes(evt.keyCode) || !evt.target.classList.contains('tnys-editing')) {
      var jumper = function jumper(originElement, filteredElements, reverse) {
        /** Used to jump cells when navigating with Ctrl pressed */
        var arr = reverse ? _toConsumableArray(filteredElements).reverse() : filteredElements; // go to last

        if (!arr.map(function (el) {
          return Boolean(el.value);
        }).reduce(function (a, c) {
          return a || c;
        }, false)) {
          nextElement = arr[arr.length - 1];
        } else {
          // jump to transition
          var jumpElements = [originElement].concat(arr);

          for (var i = 1; i < jumpElements.length; i++) {
            if (!Boolean(jumpElements[i].value)) continue;

            if (Boolean(jumpElements[i].value) !== (jumpElements[i - 1] && Boolean(jumpElements[i - 1].value)) || Boolean(jumpElements[i].value) !== (jumpElements[i + 1] && Boolean(jumpElements[i + 1].value))) {
              nextElement = jumpElements[i];
              break;
            }
          }
        }

        focusWithoutScroll();
      };

      if (evt.keyCode !== 9 && evt.target.classList.contains('tnys-editing-hard')) {
        return;
      } // is editing and extend range


      if (evt.target.classList.contains('tnys-editing')) {
        evt.target.classList.remove('tnys-editing');
        evt.target.classList.remove('tnys-editing-hard');
      }

      var originElement = evt.target;
      var focusElement = Array.from(containerEl.getElementsByClassName('tnys-focus'))[0];
      var extendToElement = Array.from(containerEl.getElementsByClassName('tnys-sel-to'))[0];
      var extendFromElement = Array.from(containerEl.getElementsByClassName('tnys-sel-from'))[0];
      var enterAndTabKeysMovableElements = Array.from(containerEl.getElementsByClassName('tnys-sel')); // set range

      var setingExtendBool = false; // shift + arrow is seting extended range

      if ([37, 38, 39, 40].includes(evt.keyCode)) {
        if (evt.shiftKey) {
          setingExtendBool = true;
          originElement = extendToElement || evt.target;

          if (!extendFromElement) {
            extendFromElement = originElement;
            extendFromElement.classList.add('tnys-sel-from');
          }
        } else {
          // reset extend-from
          elements.forEach(function (el) {
            el.classList.remove('tnys-sel-from');
          });
          enterAndTabKeysMovableElements.forEach(function (el) {
            el.classList.remove('tnys-sel');
            el.classList.remove('tnys-sel-to');
            el.classList.remove('tnys-sel-from');
          });
        }
      }

      var nextElement;
      var hasExtendedCells = enterAndTabKeysMovableElements.length > 1;

      if (evt.key === 'ArrowDown' || evt.key === 'Enter' && !evt.shiftKey) {
        var elementsOfinterest = hasExtendedCells && evt.key === 'Enter' ? enterAndTabKeysMovableElements : elements;
        var filteredElements = getOrtogonalElements(elementsOfinterest, originElement, 'b');

        if (evt.key === 'ArrowDown' && evt.ctrlKey) {
          jumper(originElement, filteredElements, false);
        } else {
          nextElement = filteredElements[0];
        } // wrap


        if (!nextElement && evt.key === 'Enter') {
          var _filteredElements = elementsOfinterest.filter(function (el) {
            return el.getBoundingClientRect().x > originElement.getBoundingClientRect().x;
          });

          nextElement = _filteredElements[0] ? _filteredElements[0] : elementsOfinterest[0];
        }
      }

      if (evt.key === 'ArrowUp' || evt.key === 'Enter' && evt.shiftKey) {
        var _elementsOfinterest = hasExtendedCells && evt.key === 'Enter' ? enterAndTabKeysMovableElements : elements;

        var _filteredElements2 = getOrtogonalElements(_elementsOfinterest, originElement, 't');

        if (evt.key === 'ArrowUp' && evt.ctrlKey) {
          jumper(originElement, _filteredElements2, false);
        } else {
          nextElement = _filteredElements2[0];
        } // wrap


        if (!nextElement && evt.key === 'Enter') {
          var _filteredElements3 = _elementsOfinterest.filter(function (el) {
            return el.getBoundingClientRect().x < originElement.getBoundingClientRect().x;
          });

          nextElement = _filteredElements3[0] ? _filteredElements3[_filteredElements3.length - 1] : _elementsOfinterest[_elementsOfinterest.length - 1];
        }
      }

      if (evt.key === 'ArrowLeft' || evt.shiftKey && evt.key === 'Tab') {
        var _elementsOfinterest2 = hasExtendedCells && evt.key === 'Tab' ? enterAndTabKeysMovableElements : elements;

        var _filteredElements4 = getOrtogonalElements(_elementsOfinterest2, originElement, 'l');

        if (evt.key === 'ArrowLeft' && evt.ctrlKey) {
          jumper(originElement, _filteredElements4, false);
        } else {
          nextElement = _filteredElements4[0];
        } // wrap


        if (!nextElement && evt.key === 'Tab') {
          var _filteredElements5 = _elementsOfinterest2.filter(function (el) {
            return el.getBoundingClientRect().y < originElement.getBoundingClientRect().y;
          });

          nextElement = _filteredElements5[0] ? _filteredElements5[_filteredElements5.length - 1] : _elementsOfinterest2[_elementsOfinterest2.length - 1];
        }
      }

      if (evt.key === 'ArrowRight' || !evt.shiftKey && evt.key === 'Tab') {
        var _elementsOfinterest3 = hasExtendedCells && evt.key === 'Tab' ? enterAndTabKeysMovableElements : elements;

        var _filteredElements6 = getOrtogonalElements(_elementsOfinterest3, originElement, 'r');

        if (evt.key === 'ArrowRight' && evt.ctrlKey) {
          jumper(originElement, _filteredElements6, false);
        } else {
          nextElement = _filteredElements6[0];
        } // wrap


        if (!nextElement && evt.key === 'Tab') {
          var _filteredElements7 = _elementsOfinterest3.filter(function (el) {
            return el.getBoundingClientRect().y > originElement.getBoundingClientRect().y;
          });

          nextElement = _filteredElements7[0] ? _filteredElements7[0] : _elementsOfinterest3[0];
        }
      } // set focus if element found


      if (nextElement) {
        // avoid selecting text when shift is pressed and move up
        evt.preventDefault();
        setClipElPosition(nextElement);
        window.setTimeout(function () {
          setClipTextareaValue(evt, nextElement);
        }, keydownTimeout); // if seting range, keep focus on origin

        if (!setingExtendBool) {
          nextElement.focus();
        } else {
          originElement.classList.remove('tnys-sel-to');
          nextElement.classList.add('tnys-sel-to');

          if (extendFromElement) {
            setRangeClasses(extendFromElement, nextElement);
          }
        }
      } // Tab or Enter with no extend area


      if (enterAndTabKeysMovableElements.length <= 1 && [9, 13].includes(evt.keyCode)) {
        elements.forEach(function (el) {
          el.classList.remove('tnys-sel');
          el.classList.remove('tnys-sel-from');
          el.classList.remove('tnys-sel-to');
        });
        nextElement.classList.add('tnys-sel-from');
      }
    }
  }

  function moveCursorToEnd(element) {
    // https://davidwalsh.name/caret-end
    if (typeof element.selectionStart == 'number') {
      element.selectionStart = element.selectionEnd = element.value.length;
    } else if (typeof element.createTextRange != 'undefined') {
      element.focus();
      var range = element.createTextRange();
      range.collapse(false);
      range.select();
    }
  }

  function startCellEdit(element) {
    element.classList.add('tnys-editing');
  }

  function setRangeClasses(extendFromElement, extendToElement) {
    var xStart = Math.min(extendFromElement.getBoundingClientRect().x, extendToElement.getBoundingClientRect().x);
    var xEnd = Math.max(extendFromElement.getBoundingClientRect().x, extendToElement.getBoundingClientRect().x);
    var yStart = Math.min(extendFromElement.getBoundingClientRect().y, extendToElement.getBoundingClientRect().y);
    var yEnd = Math.max(extendFromElement.getBoundingClientRect().y, extendToElement.getBoundingClientRect().y);
    elements.forEach(function (el) {
      // el.classList.remove('tnys-sel-left')
      // el.classList.remove('tnys-sel-right')
      // el.classList.remove('tnys-sel-top')
      // el.classList.remove('tnys-sel-bottom')
      if (el.getBoundingClientRect().x >= xStart && el.getBoundingClientRect().x <= xEnd && el.getBoundingClientRect().y >= yStart && el.getBoundingClientRect().y <= yEnd) {
        el.classList.add('tnys-sel'); // if (el.getBoundingClientRect().x === xStart) el.classList.add('tnys-sel-left')
        // if (el.getBoundingClientRect().x === xEnd) el.classList.add('tnys-sel-right')
        // if (el.getBoundingClientRect().y === yStart) el.classList.add('tnys-sel-top')
        // if (el.getBoundingClientRect().y === yEnd) el.classList.add('tnys-sel-bottom')
      } else {
        el.classList.remove('tnys-sel');
      }
    });
  }

  function getRowColIndex(element) {
    var targetRowElements = elements.filter(function (el) {
      return el.getBoundingClientRect().y === element.getBoundingClientRect().y;
    }).map(function (el) {
      return el.getBoundingClientRect().x;
    });
    var targetColElements = elements.filter(function (el) {
      return el.getBoundingClientRect().x === element.getBoundingClientRect().x;
    }).map(function (el) {
      return el.getBoundingClientRect().y;
    });
    var rowIndex = targetColElements.indexOf(element.getBoundingClientRect().y);
    var colIndex = targetRowElements.indexOf(element.getBoundingClientRect().x);
    return {
      rowIndex: rowIndex,
      colIndex: colIndex
    };
  }

  function evtToSerializable(evt) {
    var serializable = Object({
      targetId: evt.target.id,
      ctrlKey: evt.ctrlKey,
      key: evt.key,
      type: evt.type,
      // preventDefault: evt.preventDefault,
      keyCode: evt.keyCode,
      shiftKey: evt.shiftKey,
      which: evt.which,
      timeStamp: evt.timeStamp
    });
    return JSON.parse(JSON.stringify(serializable));
  }

  function evtUnserialize(evtObj) {
    if (evtObj.constructor === Event || evtObj.constructor === KeyboardEvent || evtObj.constructor === MouseEvent || evtObj.constructor === FocusEvent) {
      return evtObj;
    }

    return Object.assign({}, evtObj, {
      preventDefault: function preventDefault() {},
      target: document.getElementById(evtObj.targetId)
    });
  } // https://stackoverflow.com/questions/56293685/javascript-filter-array-with-mutation


  function mutationFilter(arr, cb) {
    for (var l = arr.length - 1; l >= 0; l -= 1) {
      if (!cb(arr[l])) arr.splice(l, 1);
    }
  }

  this.update = function () {
    mutationFilter(_this.elements, function (el) {
      return el.isConnected;
    });
    Array.from(containerEl.querySelectorAll('input:not(.tnys)')).forEach(function (el) {
      el.classList.add('tnys');
      attachEventListeners(el); // this.elements.push(el)

      if (!_this.elements.includes(el)) {
        _this.elements.push(el);
      }
    }); // keep sorted left to right and top to bottom
    // make undo/redo keep working

    _this.elements.sort(function (a, b) {
      return a.getBoundingClientRect().y - b.getBoundingClientRect().y;
    });

    _this.setMap();
  };

  this.update();

  function attachEventListeners(element) {
    element.addEventListener('change', function (evt) {
      if (options && options.recordCb) {
        options.recordCb({
          evt: evtToSerializable(evt)
        });
      }

      evt = evtUnserialize(evt);
      var rowColIndexObj = getRowColIndex(evt.target);
      var key = "".concat(rowColIndexObj.rowIndex, "_").concat(rowColIndexObj.colIndex);
      patchesSlice();
      patches.push([{
        op: 'add',
        path: "/".concat(key),
        value: evt.target.value
      }]);
    }); // events

    element.addEventListener('keydown', keydownEventHandler); // focus

    element.addEventListener('focus', function (evt) {
      if (options && options.recordCb) {
        options.recordCb({
          evt: evtToSerializable(evt)
        });
      }

      evt = evtUnserialize(evt);
      evt.target.selectionStart = evt.target.selectionEnd = evt.target.value.length;
      elements.forEach(function (el) {
        el.classList.remove('tnys-focus');
      });
      evt.target.classList.add('tnys-focus'); // evt.target.classList.add('tnys-sel-from')
    }); // blur

    element.addEventListener('blur', function (evt) {
      if (options && options.recordCb) {
        options.recordCb({
          evt: evtToSerializable(evt)
        });
      }

      evt = evtUnserialize(evt);
      element.classList.remove('tnys-editing');
      element.classList.remove('tnys-editing-hard');
    });
    var isMouseDown = false;
    containerEl.addEventListener('mouseup', function (evt) {
      isMouseDown = false;
    });
    containerEl.addEventListener('mousedown', function (evt) {
      isMouseDown = true;
    });
    element.addEventListener('mouseenter', function (evt) {
      if (options && options.recordCb) {
        options.recordCb({
          evt: evtToSerializable(evt)
        });
      }

      evt = evtUnserialize(evt);

      if (isMouseDown) {
        elements.forEach(function (el) {
          el.classList.remove('tnys-sel-to');
          el.classList.remove('tnys-sel');
        });
        var extendFromElements = Array.from(containerEl.getElementsByClassName('tnys-sel-from'));
        var extendFromElement = extendFromElements[0];
        evt.target.classList.add('tnys-sel-to');

        if (extendFromElement) {
          setRangeClasses(extendFromElement, evt.target);
        }
      }
    });
    element.addEventListener('mousedown', function (evt) {
      if (options && options.recordCb) {
        options.recordCb({
          evt: evtToSerializable(evt)
        });
      }

      evt = evtUnserialize(evt);
      setClipElPosition(evt.target);
      elements.forEach(function (el) {
        el.classList.remove('tnys-sel-to');
        el.classList.remove('tnys-sel');
      });
      var extendFromElements = Array.from(containerEl.getElementsByClassName('tnys-sel-from')); // set cell range

      if (evt.shiftKey) {
        if (extendFromElements.length) {
          evt.preventDefault(); // keep extend origin

          var extendFromElement = extendFromElements[0]; // and target iw where we whant to extend to

          evt.target.classList.add('tnys-sel-to'); // exit possible editing mode of element          

          focusWithoutScroll();
          setRangeClasses(extendFromElement, evt.target);
        }

        return;
      } // reset extend-from


      extendFromElements.forEach(function (el) {
        el.classList.remove('tnys-sel-from');
      });
      var lastMouseDown = evt.target.getAttribute('tnys-last-mousedown');

      if (lastMouseDown) {
        if (evt.timeStamp - parseFloat(lastMouseDown) <= 500 && !evt.target.classList.contains('tnys-editing')) {
          element.setAttribute('tnys-prev-value', element.value); // prevent selecting current cell text

          evt.preventDefault();
          evt.target.classList.add('tnys-editing-hard');
          startCellEdit(evt.target);
        }
      }

      evt.target.setAttribute('tnys-last-mousedown', evt.timeStamp);
      evt.target.classList.add('tnys-sel-from');
      evt.target.focus(); // On firefox, when double click a input the cared will be pos at end
      // On Chrome we have the native behaviour

      if (evt.mozInputSource !== undefined && !evt.target.classList.contains('tnys-editing')) {
        evt.preventDefault();
      }
    });
  } // utility functions


  function arrayIntoChunks(arr, sizes) {
    return arr.reduce(function (a, c, i) {
      if (!(i % sizes)) a.push([]);
      a[a.length - 1].push(c);
      return a;
    }, []);
  } // from https://github.com/renanlecaro/importabular/blob/master/src/sheetclip.js


  function countQuotes(str) {
    return str.split('"').length - 1;
  }

  function parseArrayString(str) {
    var r,
        rlen,
        rows,
        arr = [],
        a = 0,
        c,
        clen,
        multiline,
        last;
    rows = str.split('\n');

    if (rows.length > 1 && rows[rows.length - 1] === '') {
      rows.pop();
    }

    for (r = 0, rlen = rows.length; r < rlen; r += 1) {
      rows[r] = rows[r].split('\t');

      for (c = 0, clen = rows[r].length; c < clen; c += 1) {
        if (!arr[a]) {
          arr[a] = [];
        }

        if (multiline && c === 0) {
          last = arr[a].length - 1;
          arr[a][last] = arr[a][last] + '\n' + rows[r][0];

          if (multiline && countQuotes(rows[r][0]) & 1) {
            //& 1 is a bitwise way of performing mod 2
            multiline = false;
            arr[a][last] = arr[a][last].substring(0, arr[a][last].length - 1).replace(/""/g, '"');
          }
        } else {
          if (c === clen - 1 && rows[r][c].indexOf('"') === 0 && countQuotes(rows[r][c]) & 1) {
            arr[a].push(rows[r][c].substring(1).replace(/""/g, '"'));
            multiline = true;
          } else {
            arr[a].push(rows[r][c].replace(/""/g, '"'));
            multiline = false;
          }
        }
      }

      if (!multiline) {
        a += 1;
      }
    }

    return arr;
  }

  function stringifyArray(arr) {
    var r,
        rlen,
        c,
        clen,
        str = '',
        val;

    for (r = 0, rlen = arr.length; r < rlen; r += 1) {
      for (c = 0, clen = arr[r].length; c < clen; c += 1) {
        if (c > 0) {
          str += '\t';
        }

        val = arr[r][c];

        if (typeof val === 'string') {
          if (val.indexOf('\n') > -1) {
            str += '"' + val.replace(/"/g, '""') + '"';
          } else {
            str += val;
          }
        } else if (val === null || val === void 0) {
          //void 0 resolves to undefined
          str += '';
        } else {
          str += val;
        }
      }

      str += '\n';
    }

    return str;
  }
}

;