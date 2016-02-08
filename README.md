# webbox
Webbased editor powered by sourcebox

## Start server
You can start a local dev server with: `$ NODE_ENV=development node webbox.js` or on windows with: 
```cmd
set NODE_ENV=development
node webbox.js
```

Or lastly, you can use `npm run`.


## Config
The project uses the `config` module and a default config. For config overrides just add a `production.json` or a `development.json` and specify
the node environment. The config module automatically replaces the default config values with the custom ones.

Additionally, `./config/webbox.config.js` exposes the config object.

## Logs/Monitoring
Currently, good is used to log any events. You can find the logs under `logs` and on the console.

