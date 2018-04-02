# ToDos for Monaco Editor rewrite

* [x] Use Monaco Models instead of EditSessions `monaco.editor.createModel`
* [x] Put monaco loader on base components and only render if component has been loaded, otherwise it is not possible to use the Models
* [x] Add abstraction between Models
* [x] Rewrite shared Options
* [x] Rewrite all Components that use Editor, EditSession or UndoManager
* [x] Implement Markdown Utils
* [ ] Add own resize logic to avoid 100ms interval for checking https://github.com/superRaytin/react-monaco-editor/issues/53
* [ ] Refactor displaying of errors in editor and file tab

## Use Uris instead of names?

```javascript
var vscodeUri = require("vscode-uri")
var Uri = vscodeUri.default
var t = Uri.parse("inmemory://www.trycoding.io/embed/15e23c7a-b46b-444e-8da2-ba33a08831cd?document=15e23c7a-b46b-444e-8da2-ba33a08831cd#main.py")
```