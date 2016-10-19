/*
The MIT License (MIT)

Copyright (c) 2015 Sébastien Lorber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Ported to ES6 by Michael Ebert

const backspaceCode = 8;

// See http://www.w3schools.com/html/html_form_input_types.asp
// See https://github.com/slorber/backspace-disabler/issues/1
const validInputTypes = {
  TEXT: 1, PASSWORD: 1, FILE: 1, EMAIL: 1, SEARCH: 1, DATE: 1, NUMBER: 1,
  MONTH: 1, WEEK: 1, TIME: 1, DATETIME: 1, 'DATETIME-LOCAL': 1, TEL: 1, URL: 1
};

// Disables the backspace from triggering the browser to go back one history item (which often changes pages)
export function disableBackspace(el=document) {
  addHandler(el, "keydown", disabler);
}

// Reenable the browser backs
export function enableBackspace(el=document) {
  removeHandler(el, "keydown", disabler);
}

// See http://stackoverflow.com/questions/1495219/how-can-i-prevent-the-backspace-key-from-navigating-back
function disabler(event) {
  if (event.keyCode === backspaceCode) {
    const node = event.srcElement || event.target;
    // We don't want to disable the ability to delete content in form inputs and contenteditables
    if (!isActiveFormItem(node)) {
      event.preventDefault();
    }
  }
}

// See http://stackoverflow.com/questions/12949590/how-to-detach-event-in-ie-6-7-8-9-using-javascript
function addHandler(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else if (element.attachEvent) {
    element.attachEvent("on" + type, handler);
  } else {
    element["on" + type] = handler;
  }
}

function removeHandler(element, type, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else if (element.detachEvent) {
    element.detachEvent("on" + type, handler);
  } else {
    element["on" + type] = null;
  }
}

// Returns true if the node is or is inside an active contenteditable
function isInActiveContentEditable(node) {
  while (node) {
    if (node.getAttribute &&
      node.getAttribute("contenteditable") &&
      node.getAttribute("contenteditable").toUpperCase() === "TRUE") {
      return true;
    }

    node = node.parentNode;
  }

  return false;
}

// returns true if the element is contained within a document
function connectedToTheDom(node) {
  return node.ownerDocument.contains(node);
}

function isActiveFormItem(node) {
  const tagName = node.tagName.toUpperCase();
  const isInput = (tagName === "INPUT" && node.type.toUpperCase() in validInputTypes);
  const isTextarea = (tagName === "TEXTAREA");

  if (isInput || isTextarea) {
    const isDisabled = node.readOnly || node.disabled;
    return !isDisabled && connectedToTheDom(node);  // the element may have been disconnected from the dom between the event happening and the end of the event chain, which is another case that triggers history changes
  } else if (isInActiveContentEditable(node)) {
    return connectedToTheDom(node);
  } else {
    return false;
  }
}
