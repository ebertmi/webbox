## Debugging Sourcebox server
Start the server with the following command: `sudo DEBUG=sourcebox:* nodejs index.js`
This enables the visionmedia/debug log output
Use `localstorage.debug=sourcebox:*` in the browser console and reload the page to see the RemoteStream output on the client