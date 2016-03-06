# webbox
Webbased editor powered by sourcebox

## Start server
You can start a local dev server with: `$ NODE_ENV=development node webbox.js` or on windows with:
```cmd
set NODE_ENV=development
node webbox.js
```

Or lastly, you can use `npm run`.

## PM2
A good way for starting, reloading and stopping the app with watch support is using pm2. The `good` logger
works pretty good with pm2. Use `pm2 logs` to view the logs with updates.

## Config
The project uses the `config` module and a default config. For config overrides just add a `production.json` or a `development.json` and specify
the node environment. The config module automatically replaces the default config values with the custom ones.

Additionally, `./config/webbox.config.js` exposes the config object.

### Routes
All routes are defined in `conf/routes.js`. Each route points to a controller/handler which should be placed
in `controllers/...`.

## Templates
Currently, *webbox* is configured to use the jade templating engine. All views reside in `./views` and need to have
the `.jade` file extension. All templates are compiled after server start. The default config prevents
the caching of templates.

To render a view, just use `reply('viewname', {})` and pass an optional context object.

## Models
All models are defined using the `thinky` ORM. `thinky` is pretty lightweight and exposes
`thinky.r` the rethinkdb driver. Just have a look at `./models`. `thinky` is based on Promises
and requires to `.run()` a query. The `run()` method returns a chainable promise.

## Logs/Monitoring
Currently, good is used to log any events. You can find the logs under `logs` and on the console.


# Install
In order to use webbox you need to install [rethinkdb](https://www.rethinkdb.com/).

Use the rethinkdb `Data Explorer` to set the `authKey` with the following command:
```javascript
r.db('rethinkdb').table('cluster_config').get('auth').update({auth_key: 'newkey'})
```

# CLI
Use the cli to add a user or list all users:
`node cli.js addUser username email password`