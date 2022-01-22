# Tiny sheet

Tiny excel-like spreadsheet web component.

![tiny.gif](tiny.gif "Demo")

## Usage

Install with

    npm install tiny-sheet-js

then import with:

```javascript
import tinySheet from 'tiny-sheet-js'
let tnys = new tinySheet(container)
```

Or download `tinySheet.min.js` from dist folder.


### Minimal working example:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
  <script type="text/javascript" src="tinySheet.min.js"></script>
  <style type="text/css">
    .tnys:not(.tnys-editing) {
      cursor:cell;
    }
    .tnys-sel {
      background-color: #e2e9e9;
    }
    .tnys-focus:not(.tnys-editing) {
      color: transparent;text-shadow: 0 0 0 black;
    }
    .tnys-focus {
      border: 1px solid black;
      background-color: #ffffff;
    }
    .tnys-editing {
      border: 1px solid black;
    }
    input {
      border: 1px solid #bbb;
    }
    input:focus {
      outline: none;
    }
  </style>
</head>
<body>
  <table>
    <tr>
      <td><input></td>
      <td><input></td>
      <td><input></td>
      <td><input></td>
    </tr>
    <tr>
      <td><input></td>
      <td><input></td>
      <td><input></td>
      <td><input></td>
    </tr>
    <tr>
      <td><input></td>
      <td><input></td>
      <td><input></td>
      <td><input></td>
    </tr>
    <tr>
      <td><input></td>
      <td><input></td>
      <td><input></td>
      <td><input></td>
    </tr>
  </table>
  <script type="text/javascript">
    let tnys = new tinySheet(document.getElementsByTagName('table')[0])
  </script>
</body>
</html>
```


### More complete [demo and usage](https://arturaugusto.github.io/tiny-sheet/)

## Features

* Lightweight (~5kb gziped)
* Copy and Paste from and to applications like Excel
* Works on mobile
* Undo and Redo
* Save and restore state (will be able to undo changes from previous session)
* Multi-select with mouse
* Multi-select with shift + arrow keys
* Skip navigation using Ctrl key
* Paste to area bigger than original repeating the data
* Tab/Enter navigation over selected region
* Can (must) be used with your generated dom


## Similar projects

importabular https://lecaro.me/importabular/  
BomTable https://lebonnet.github.io/  


## License
MIT
