const tinySheet = function(containerEl, options) {
  this.containerEl = containerEl
  
  let elements = Array.from(containerEl.getElementsByTagName('input'))
  this.elements = elements
  
  let undoIndex = 0
  let patches
  if (options && options.patches) {
    let matrix = getElementsMatrix()
    applyPatches(options.patches.flat(), matrix)
    patches = options.patches
    undoIndex = patches.length
  } else {
    patches = []
  }

  this.patches = patches

  let clipTextarea = document.createElement('TEXTAREA')
  let clpStl = clipTextarea.style
  clpStl['position'] = 'absolute'
  
  clpStl['border'] = 'none'
  clpStl['color'] = 'transparent'
  clpStl['background'] = 'transparent'
  clpStl['text-shadow'] = '0 0 0 transparent'
  clpStl['width'] = '0.10em'
  clpStl['height'] = '0.10em'
  clpStl['z-index'] = -9999
  clpStl['resize'] = 'none'
  clpStl['outline'] = 'none'
  clpStl['ĺeft'] = '-99999999px'
  clipTextarea.classList.add('tnys-clip')

  function setClipElPosition(element) {
    clipTextarea.style.left = ''+(element.getBoundingClientRect().x+window.scrollX+3)+'px'
    clipTextarea.style.top = ''+(element.getBoundingClientRect().y+window.scrollY+3)+'px'
  }

  document.body.appendChild(clipTextarea)
  let enablePaste = true
  
  // TODO: best minimal value
  const keydownTimeout = 20
  const keyupTimeout = keydownTimeout + 10
  clipTextarea.addEventListener('keyup', (evt) => {
    enablePaste = true
    // clipTextarea.focus()
    clipTextarea.setSelectionRange(0, clipTextarea.value.length)

    if (evt.keyCode === 17) {
      window.setTimeout(() => {
        let focusElement = containerEl.getElementsByClassName('tnys-focus')[0]
        if (focusElement) {
          focusElement.focus({preventScroll: true})
        }
      }, keyupTimeout)
    }
  })

  clipTextarea.addEventListener('keydown', (evt) => {
    if (evt.ctrlKey && evt.key === 'v') {
      if (!enablePaste) {
        evt.preventDefault()
        return
      }
      enablePaste = false
      let focusElement = containerEl.getElementsByClassName('tnys-focus')[0]
      if (focusElement) {
        window.setTimeout(() => {
          let data = parseArrayString(evt.target.value)
          
          let sourceHeigth = data.length
          let sourceWidth = data[0].length

          let extendElements = Array.from(containerEl.getElementsByClassName('tnys-sel'))
          let extendElementsMatrix
          if (extendElements.length) {
            let extendWidth = extendElements.filter(el => el.getBoundingClientRect().y === extendElements[0].getBoundingClientRect().y).length
            extendElementsMatrix = arrayIntoChunks(extendElements, extendWidth)
          } else {
            extendElementsMatrix = [[focusElement]]
          }

          let elements = Array.from(containerEl.getElementsByTagName('input'))
          let pasteAreaElements = elements.filter(el => el.getBoundingClientRect().y >= extendElementsMatrix[0][0].getBoundingClientRect().y && el.getBoundingClientRect().x >= extendElementsMatrix[0][0].getBoundingClientRect().x)

          let pasteAreaWidth = pasteAreaElements.filter(el => el.getBoundingClientRect().y === pasteAreaElements[0].getBoundingClientRect().y).length
          let pasteAreaElementsMatrix = arrayIntoChunks(pasteAreaElements, pasteAreaWidth)
          let pasteAreaHeigth = pasteAreaElementsMatrix.length

          let extendHeigth = extendElementsMatrix.length
          let extendWidth = extendElementsMatrix[0].length

          let pasteHeigth = Math.max(Math.floor(extendHeigth/sourceHeigth) * sourceHeigth, sourceHeigth)
          let pasteWidth = Math.max(Math.floor(extendWidth/sourceWidth) * sourceWidth, sourceWidth)

          if (pasteHeigth > pasteAreaHeigth) {
            console.error('cannot paste (pasteHeigth > pasteAreaHeigth)')
            return
          }

          if (pasteWidth > pasteAreaWidth) {
            console.error('cannot paste (pasteWidth > pasteAreaWidth)')
            return
          }
          
          let pastePatches = []

          let rowColIndexObj = getRowColIndex(extendElementsMatrix[0][0])

          for (var i = 0; i < pasteHeigth; i++) {
            for (var j = 0; j < pasteWidth; j++) {
              pasteAreaElementsMatrix[i][j].value = data[i % sourceHeigth][j % sourceWidth]
              pasteAreaElementsMatrix[i][j].classList.add('tnys-sel')
              let key = `${rowColIndexObj.rowIndex+i}_${rowColIndexObj.colIndex+j}`
              pastePatches.push({ op: 'add', path: `/${key}`, value: pasteAreaElementsMatrix[i][j].value })
            }
          }
          patchesSlice()
          patches.push(pastePatches)

        }, keydownTimeout)
      }
    } else {
      if ( evt.ctrlKey && evt.key === 'c') {
        // let native copy...
      } else {
        clipTextarea.blur()
        let focusElement = containerEl.getElementsByClassName('tnys-focus')[0]
        focusElement.focus({preventScroll: true})
        // focusElement.focus()
        Object.defineProperty(evt, 'target', { value: focusElement })
        keydownEventHandler(evt)
      }
    }
  })


  function patchesSlice () {
    patches.splice(undoIndex++)
  }
  
  function getElementsMatrix() {
    let elementsArray = Array.from(elements)
    let width = elementsArray.filter(el => el.getBoundingClientRect().y === elementsArray[0].getBoundingClientRect().y).length
    let elementsMatrix = arrayIntoChunks(elementsArray, width)
    return elementsMatrix
  }
  this.getElementsMatrix = getElementsMatrix

  function getData() {
    return getElementsMatrix().map(row => row.map(cell => cell.value))
  }
  this.getData = getData


  let cellMap = {pointers: {}}
  this.setMap = () => {
    let m = getElementsMatrix()
    cellMap.pointers = {}
    for (let l = 0; l < m.length; l++) {
      for (let c = 0; c < m[l].length; c++) {
        let id = `${l}_${c}`
        m[l][c].setAttribute('tnys-id', id)
        cellMap.pointers[id] = {
          t: m[l-1] ? m[l-1][c] : undefined,
          b: m[l+1] ? m[l+1][c] : undefined,
          l: m[l] ? m[l][c-1] : undefined,
          r: m[l] ? m[l][c+1] : undefined
        }
      }
    }
  }

  function applyPatches(patches, elementsMatrix) {
    patches.forEach(op => {
      let rowAndColArr = op.path.split('/')[1].split('_').map(x => parseInt(x))
      let targetRow = elementsMatrix[rowAndColArr[0]]
      if (targetRow) {
        let targetElement = targetRow[rowAndColArr[1]]
        targetElement.value = op.value
      } else {
        console.warn(`row ${op.path} does not exists.`)
      }
    })
  }

  function setClipTextareaValue(evt, element) {
    let extendElements = Array.from(containerEl.getElementsByClassName('tnys-sel'))
    if (!extendElements.length) {
      extendElements = [element]
    }
    let extendWidth = extendElements.filter(el => el.getBoundingClientRect().y === extendElements[0].getBoundingClientRect().y).length

    let data = arrayIntoChunks(extendElements.map(el => el.value), extendWidth)
      // .map(arr => arr.join('\t'))
    let dataString = stringifyArray(data)
    clipTextarea.value = dataString
    clipTextarea.focus()
    evt.preventDefault()

  }

  function getOrtogonalElements(elementsOfinterest, originElement, direction) {
    let elementsOfinterestIds = elementsOfinterest.map(el => el.getAttribute('tnys-id'))
    let filteredElements = [cellMap.pointers[originElement.getAttribute('tnys-id')][direction]]
    while (true) {
      let last = filteredElements[filteredElements.length - 1]
      if (!last) {
        filteredElements.pop()
        // TODO: optimize this line
        filteredElements = filteredElements.filter(el => elementsOfinterestIds.includes(el.getAttribute('tnys-id')))
        break
      }
      filteredElements.push(cellMap.pointers[last.getAttribute('tnys-id')][direction])
    }
    return filteredElements
  }


  function focusWithoutScroll() {
    let focusElements = Array.from(containerEl.getElementsByClassName('tnys-focus'))
    let focusElement = focusElements[0]
    if (focusElement) {
      focusElement.blur()
      focusElement.focus({preventScroll: true})
    }
  }

  let lastTimeStamp = undefined
  function keydownEventHandler(evt) {
    // for bit spreadsheets, throttle keydown speed to improve usability
    if (lastTimeStamp && elements.length > 3000 && evt.timeStamp < (lastTimeStamp + 50)) {
      evt.preventDefault()
      return
    }
    lastTimeStamp = evt.timeStamp

    // Ctrl
    if (!evt.target.classList.contains('tnys-editing') && evt.ctrlKey && evt.key === 'y') {
      evt.preventDefault()
      let undoPointer = patches[undoIndex]
      if (undoPointer) {
        let elementsMatrix = getElementsMatrix()
        applyPatches(undoPointer, elementsMatrix)
        undoIndex++
      }
      return
    }
    
    if (!evt.target.classList.contains('tnys-editing') && evt.ctrlKey && evt.key === 'z') {
      if (undoIndex > 0) {
        let elementsMatrix = getElementsMatrix()
        let undoPointer = patches[undoIndex-1]
        undoPointer.forEach(opUndo => {
          // reach previous patches for desired cell
          let found = false
          for (let i = undoIndex - 2; i >= 0; i--) {
            if (patches[i].map(opQuery => opQuery.path).includes(opUndo.path)) {
              found = true
              // set to previous found value
              applyPatches(patches[i].filter(opQuery => opQuery.path === opUndo.path), elementsMatrix)
              break
            }
          }
          if (!found) {
            let rowAndColArr = opUndo.path.split('/')[1].split('_').map(x => parseInt(x))
            let targetElement = elementsMatrix[rowAndColArr[0]][rowAndColArr[1]]
            targetElement.value = ''
          }
        })
        undoIndex--
      }
      evt.preventDefault()
      return
    }

    if (!evt.target.classList.contains('tnys-editing') && evt.ctrlKey) {
      setClipTextareaValue(evt, evt.target)
      clipTextarea.focus()
      clipTextarea.setSelectionRange(0, clipTextarea.value.length)
    }

    const navigationKeys = [8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 46, 91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145, 173, 174, 175, 181, 182, 183, 225]

    if (!evt.ctrlKey && !evt.target.classList.contains('tnys-editing') && !navigationKeys.includes(evt.keyCode)) {
      evt.target.setAttribute('tnys-prev-value', evt.target.value)
      evt.target.value = ''
      startCellEdit(evt.target)
    }

    // Delete or Backspace
    if (!evt.target.classList.contains('tnys-editing') && (evt.keyCode === 46 || evt.keyCode === 8)) {
      let deletePatches = []
      elements.filter(el => el.classList.contains('tnys-sel') || el.classList.contains('tnys-focus')).forEach (el => {
        if (el.value !== '') {
          el.value = ''
          let rowColIndexObj = getRowColIndex(el)
          let key = `${rowColIndexObj.rowIndex}_${rowColIndexObj.colIndex}`
          deletePatches.push({ op: 'add', path: `/${key}`, value: '' })
        }
      })
      
      if (deletePatches.length) {
        patchesSlice()
        patches.push(deletePatches)
      }
    }
    // Enter
    if (evt.keyCode === 13 && evt.target.classList.contains('tnys-editing')) {
      evt.target.classList.remove('tnys-editing')
      evt.target.classList.remove('tnys-editing-hard')
    }
    // F2
    if (evt.keyCode === 113) {
      evt.target.setAttribute('tnys-prev-value', evt.target.value)
      evt.target.focus()
      if (!evt.target.classList.contains('tnys-editing')) {
        moveCursorToEnd(evt.target)
      }
      evt.target.classList.add('tnys-editing-hard')
      startCellEdit(evt.target)
    }
    // esc
    if (evt.keyCode === 27 && evt.target.classList.contains('tnys-editing')) {
      evt.target.value = evt.target.getAttribute('tnys-prev-value')
      evt.target.classList.remove('tnys-editing')
      evt.target.classList.remove('tnys-editing-hard')
      moveCursorToEnd(evt.target)
      // evt.target.blur()
    }          
    
    // Navigation
    if ([37, 38, 39, 40, 9].includes(evt.keyCode) || !evt.target.classList.contains('tnys-editing')) {
      
      
      if (evt.keyCode !== 9 && evt.target.classList.contains('tnys-editing-hard')) {
        return
      }

      // is editing and extend range
      if (evt.target.classList.contains('tnys-editing')) {
        evt.target.classList.remove('tnys-editing')
        evt.target.classList.remove('tnys-editing-hard')
      }

      let originElement = evt.target

      const focusElement = Array.from(containerEl.getElementsByClassName('tnys-focus'))[0]
      const extendToElement = Array.from(containerEl.getElementsByClassName('tnys-sel-to'))[0]
      let extendFromElement = Array.from(containerEl.getElementsByClassName('tnys-sel-from'))[0]
      let enterAndTabKeysMovableElements = Array.from(containerEl.getElementsByClassName('tnys-sel'))
      
      // set range
      let setingExtendBool = false
      // shift + arrow is seting extended range
      if ([37, 38, 39, 40].includes(evt.keyCode)) {

        if (evt.shiftKey) {
          setingExtendBool = true
          originElement = extendToElement || evt.target
          if (!extendFromElement) {
            extendFromElement = originElement
            extendFromElement.classList.add('tnys-sel-from')
          }
        } else {
          // reset extend-from
          elements.forEach(el => {
            el.classList.remove('tnys-sel-from')
          })
          enterAndTabKeysMovableElements.forEach(el => {
            el.classList.remove('tnys-sel')
            el.classList.remove('tnys-sel-to')
            el.classList.remove('tnys-sel-from')
          })
        }
      }
    
      let nextElement
      
      function jumper(originElement, filteredElements, reverse) {
        /** Used to jump cells when navigating with Ctrl pressed */
        let arr = reverse ? [...filteredElements].reverse() : filteredElements
        // go to last
        if (!arr.map(el => Boolean(el.value)).reduce((a, c) => a||c, false)) {
          nextElement = arr[arr.length -1]
        } else {
          // jump to transition
          let jumpElements = [originElement].concat(arr)
          for (let i = 1; i < jumpElements.length; i++) {
            if (!Boolean(jumpElements[i].value)) continue
            if (
              Boolean(jumpElements[i].value) !== (jumpElements[i-1] && Boolean(jumpElements[i-1].value)) ||
              Boolean(jumpElements[i].value) !== (jumpElements[i+1] && Boolean(jumpElements[i+1].value))
            ) {
              nextElement = jumpElements[i]
              break
            }
          }
        }
        focusWithoutScroll()
      }

      const hasExtendedCells = enterAndTabKeysMovableElements.length > 1

      if (evt.key === 'ArrowDown' || (evt.key === 'Enter' && !evt.shiftKey)) {
        let elementsOfinterest = (hasExtendedCells && evt.key === 'Enter' ? enterAndTabKeysMovableElements : elements)
        
        let filteredElements = getOrtogonalElements(elementsOfinterest, originElement, 'b')

        if (evt.key === 'ArrowDown' && evt.ctrlKey) {
          jumper(originElement, filteredElements, false)
        } else {
          nextElement = filteredElements[0]
        }
        
        // wrap
        if (!nextElement && evt.key === 'Enter') {
          let filteredElements = elementsOfinterest.filter(el => el.getBoundingClientRect().x > originElement.getBoundingClientRect().x)
          nextElement = filteredElements[0] ? filteredElements[0] : elementsOfinterest[0]
        }
      }
      if (evt.key === 'ArrowUp' || (evt.key === 'Enter' && evt.shiftKey)) {
        let elementsOfinterest = (hasExtendedCells && evt.key === 'Enter' ? enterAndTabKeysMovableElements : elements)

        let filteredElements = getOrtogonalElements(elementsOfinterest, originElement, 't')

        if (evt.key === 'ArrowUp' && evt.ctrlKey) {
          jumper(originElement, filteredElements, false)
        } else {
          nextElement = filteredElements[0]
        }
        // wrap
        if (!nextElement && evt.key === 'Enter') {
          let filteredElements = elementsOfinterest.filter(el => el.getBoundingClientRect().x < originElement.getBoundingClientRect().x)
          nextElement = filteredElements[0] ? filteredElements[filteredElements.length - 1] : elementsOfinterest[elementsOfinterest.length - 1]
        }
      }
      if (evt.key === 'ArrowLeft' || (evt.shiftKey && evt.key === 'Tab')) {
        let elementsOfinterest = (hasExtendedCells && evt.key === 'Tab' ? enterAndTabKeysMovableElements : elements)

        let filteredElements = getOrtogonalElements(elementsOfinterest, originElement, 'l')

        if (evt.key === 'ArrowLeft' && evt.ctrlKey) {
          jumper(originElement, filteredElements, false)
        } else {
          nextElement = filteredElements[0]
        }
        // wrap
        if (!nextElement && evt.key === 'Tab') {
          let filteredElements = elementsOfinterest.filter(el => el.getBoundingClientRect().y < originElement.getBoundingClientRect().y)
          nextElement = filteredElements[0] ? filteredElements[filteredElements.length - 1] : elementsOfinterest[elementsOfinterest.length - 1]
        }              
      }
      if (evt.key === 'ArrowRight' || (!evt.shiftKey && evt.key === 'Tab')) {
        let elementsOfinterest = (hasExtendedCells && evt.key === 'Tab' ? enterAndTabKeysMovableElements : elements)

        let filteredElements = getOrtogonalElements(elementsOfinterest, originElement, 'r')

        if (evt.key === 'ArrowRight' && evt.ctrlKey) {
          jumper(originElement, filteredElements, false)
        } else {
          nextElement = filteredElements[0]
        }
        
        // wrap
        if (!nextElement && evt.key === 'Tab') {
          let filteredElements = elementsOfinterest.filter(el => el.getBoundingClientRect().y > originElement.getBoundingClientRect().y)
          nextElement = filteredElements[0] ? filteredElements[0] : elementsOfinterest[0]
        }
      }

      // set focus if element found
      if (nextElement) {
        // avoid selecting text when shift is pressed and move up
        evt.preventDefault()
        setClipElPosition(nextElement)

        window.setTimeout(() => {
          setClipTextareaValue(evt, nextElement)
        }, keydownTimeout)

        // if seting range, keep focus on origin
        if (!setingExtendBool) {
          nextElement.focus()
        } else {
          originElement.classList.remove('tnys-sel-to')

          nextElement.classList.add('tnys-sel-to')
          
          if (extendFromElement) {
            setRangeClasses(extendFromElement, nextElement)
          }
        }
      }

      // Tab or Enter with no extend area
      if ((enterAndTabKeysMovableElements.length <= 1) && [9, 13].includes(evt.keyCode)) {
        elements.forEach(el => {
          el.classList.remove('tnys-sel')
          el.classList.remove('tnys-sel-from')
          el.classList.remove('tnys-sel-to')
        })
        nextElement.classList.add('tnys-sel-from')
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
    element.classList.add('tnys-editing')
  }

  function setRangeClasses(extendFromElement, extendToElement) {
    let xStart = Math.min(extendFromElement.getBoundingClientRect().x, extendToElement.getBoundingClientRect().x)
    let xEnd = Math.max(extendFromElement.getBoundingClientRect().x, extendToElement.getBoundingClientRect().x)
    let yStart = Math.min(extendFromElement.getBoundingClientRect().y, extendToElement.getBoundingClientRect().y)
    let yEnd = Math.max(extendFromElement.getBoundingClientRect().y, extendToElement.getBoundingClientRect().y)

    elements.forEach(el => {
      // el.classList.remove('tnys-sel-left')
      // el.classList.remove('tnys-sel-right')
      // el.classList.remove('tnys-sel-top')
      // el.classList.remove('tnys-sel-bottom')
      if (el.getBoundingClientRect().x >= xStart && el.getBoundingClientRect().x <= xEnd && el.getBoundingClientRect().y >= yStart && el.getBoundingClientRect().y <= yEnd) {
        el.classList.add('tnys-sel')
        // if (el.getBoundingClientRect().x === xStart) el.classList.add('tnys-sel-left')
        // if (el.getBoundingClientRect().x === xEnd) el.classList.add('tnys-sel-right')
        // if (el.getBoundingClientRect().y === yStart) el.classList.add('tnys-sel-top')
        // if (el.getBoundingClientRect().y === yEnd) el.classList.add('tnys-sel-bottom')
      } else {
        el.classList.remove('tnys-sel')
      }
    })
  }

  function getRowColIndex(element) {
    let targetRowElements = elements.filter(el => el.getBoundingClientRect().y === element.getBoundingClientRect().y).map(el => el.getBoundingClientRect().x)
    let targetColElements = elements.filter(el => el.getBoundingClientRect().x === element.getBoundingClientRect().x).map(el => el.getBoundingClientRect().y)

    let rowIndex = targetColElements.indexOf(element.getBoundingClientRect().y)
    let colIndex = targetRowElements.indexOf(element.getBoundingClientRect().x)

    return {rowIndex: rowIndex, colIndex: colIndex}
  }

  function evtToSerializable(evt) {
    let serializable = Object({
      targetId: evt.target.id,
      ctrlKey: evt.ctrlKey,
      key: evt.key,
      type: evt.type,
      // preventDefault: evt.preventDefault,
      keyCode: evt.keyCode,
      shiftKey: evt.shiftKey,
      which: evt.which,
      timeStamp: evt.timeStamp
    })
    return JSON.parse(JSON.stringify(serializable))
  }

  function evtUnserialize(evtObj) {
    if (evtObj.constructor === Event || evtObj.constructor === KeyboardEvent || evtObj.constructor === MouseEvent || evtObj.constructor === FocusEvent) {
      return evtObj
    }
    return Object.assign(
      {},
      evtObj,
      {preventDefault: () => {}, target: document.getElementById(evtObj.targetId)}
    )
  }
  
  // https://stackoverflow.com/questions/56293685/javascript-filter-array-with-mutation
  function mutationFilter(arr, cb) {
    for (let l = arr.length - 1; l >= 0; l -= 1) {
      if (!cb(arr[l])) arr.splice(l, 1);
    }
  }

  this.update = () => {
    mutationFilter(this.elements, (el) => el.isConnected)

    Array.from(containerEl.querySelectorAll('input:not(.tnys)')).forEach(el => {
      el.classList.add('tnys')
      attachEventListeners(el)
      // this.elements.push(el)
      if (!this.elements.includes(el)) {
        this.elements.push(el)
      }
    })
    // keep sorted left to right and top to bottom
    // make undo/redo keep working
    this.elements.sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)
    this.setMap()
  }
  this.update()
  
  function attachEventListeners(element) {
    element.addEventListener('change', (evt) => {
      if (options&&options.recordCb) {options.recordCb({evt: evtToSerializable(evt)})}
      evt = evtUnserialize(evt)

      let rowColIndexObj = getRowColIndex(evt.target)

      let key = `${rowColIndexObj.rowIndex}_${rowColIndexObj.colIndex}`
      patchesSlice()
      patches.push([{ op: 'add', path: `/${key}`, value: evt.target.value }])
    })

    // events
    element.addEventListener('keydown', keydownEventHandler)

    // focus
    element.addEventListener('focus', (evt) => {
      if (options&&options.recordCb) {options.recordCb({evt: evtToSerializable(evt)})}
      evt = evtUnserialize(evt)

      evt.target.selectionStart = evt.target.selectionEnd = evt.target.value.length;
      elements.forEach(el => {
        el.classList.remove('tnys-focus')
      })
      evt.target.classList.add('tnys-focus')
      // evt.target.classList.add('tnys-sel-from')
      


    })
    // blur
    element.addEventListener('blur', (evt) => {
      if (options&&options.recordCb) {options.recordCb({evt: evtToSerializable(evt)})}
      evt = evtUnserialize(evt)
      element.classList.remove('tnys-editing')
      element.classList.remove('tnys-editing-hard')
    })

    let isMouseDown = false
    containerEl.addEventListener('mouseup', (evt) => {
      isMouseDown = false
    })

    containerEl.addEventListener('mousedown', (evt) => {
      isMouseDown = true
    })

    element.addEventListener('mouseenter', (evt) => {
      if (options&&options.recordCb) {options.recordCb({evt: evtToSerializable(evt)})}
      evt = evtUnserialize(evt)
      if (isMouseDown) {
        elements.forEach(el => {
          el.classList.remove('tnys-sel-to')
          el.classList.remove('tnys-sel')
        })
        let extendFromElements = Array.from(containerEl.getElementsByClassName('tnys-sel-from'))
        let extendFromElement = extendFromElements[0]
        evt.target.classList.add('tnys-sel-to')
        if (extendFromElement) {
          setRangeClasses(extendFromElement, evt.target)
        }
      }
    })

    element.addEventListener('mousedown', (evt) => {
      if (options&&options.recordCb) {options.recordCb({evt: evtToSerializable(evt)})}
      evt = evtUnserialize(evt)
      
      setClipElPosition(evt.target)

      elements.forEach(el => {
        el.classList.remove('tnys-sel-to')
        el.classList.remove('tnys-sel')
      })
      
      let extendFromElements = Array.from(containerEl.getElementsByClassName('tnys-sel-from'))
      
      // set cell range
      if (evt.shiftKey) {
        if (extendFromElements.length) {
          evt.preventDefault()
          // keep extend origin
          let extendFromElement = extendFromElements[0]
          // and target iw where we whant to extend to
          evt.target.classList.add('tnys-sel-to')
          // exit possible editing mode of element          
          focusWithoutScroll()

          setRangeClasses(extendFromElement, evt.target)
        }
        return
      }
      
      // reset extend-from
      extendFromElements.forEach(el => {
        el.classList.remove('tnys-sel-from')
      })

      let lastMouseDown = evt.target.getAttribute('tnys-last-mousedown')
      if (lastMouseDown) {
        if (evt.timeStamp - parseFloat(lastMouseDown) <= 500 && !evt.target.classList.contains('tnys-editing')) {
          element.setAttribute('tnys-prev-value', element.value)
          // prevent selecting current cell text
          evt.preventDefault()
          evt.target.classList.add('tnys-editing-hard')
          startCellEdit(evt.target)
        }
      }
      evt.target.setAttribute('tnys-last-mousedown', evt.timeStamp)
      evt.target.classList.add('tnys-sel-from')
      evt.target.focus()

      // On firefox, when double click a input the cared will be pos at end
      // On Chrome we have the native behaviour
      if ((evt.mozInputSource !== undefined) && !evt.target.classList.contains('tnys-editing')) {
        evt.preventDefault()
      }

    })
  }

  // utility functions
  function arrayIntoChunks(arr, sizes) {
    return arr.reduce((a, c, i) => {
      if (!(i % sizes)) a.push([])
      a[a.length-1].push(c)
      return a
    }, [])
  }
  
  // from https://github.com/renanlecaro/importabular/blob/master/src/sheetclip.js
  function countQuotes(str) {
    return str.split('"').length - 1;
  }

  function parseArrayString (str) {
    var r, rlen, rows, arr = [], a = 0, c, clen, multiline, last;
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
          if (multiline && (countQuotes(rows[r][0]) & 1)) { //& 1 is a bitwise way of performing mod 2
            multiline = false;
            arr[a][last] = arr[a][last].substring(0, arr[a][last].length - 1).replace(/""/g, '"');
          }
        }
        else {
          if (c === clen - 1 && rows[r][c].indexOf('"') === 0 && (countQuotes(rows[r][c]) & 1)) {
            arr[a].push(rows[r][c].substring(1).replace(/""/g, '"'));
            multiline = true;
          }
          else {
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

  function stringifyArray (arr) {
    var r, rlen, c, clen, str = '', val;
    for (r = 0, rlen = arr.length; r < rlen; r += 1) {
      for (c = 0, clen = arr[r].length; c < clen; c += 1) {
        if (c > 0) {
          str += '\t';
        }
        val = arr[r][c];
        if (typeof val === 'string') {
          if (val.indexOf('\n') > -1) {
            str += '"' + val.replace(/"/g, '""') + '"';
          }
          else {
            str += val;
          }
        }
        else if (val === null || val === void 0) { //void 0 resolves to undefined
          str += '';
        }
        else {
          str += val;
        }
      }
      str += '\n';
    }
    return str;
  }
};

if (window) {
  window.tinySheet = tinySheet
}

export default tinySheet