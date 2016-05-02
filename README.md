# webbox
Webbased editor powered by sourcebox (secure remote-code-execution with bidirectional streams)

## Table of Contents
* [Quick start](#quick-start)
* [Start server](#start-server)
* [Config](#config)
* [Routing](#routes)
* [Models](#models)
* [Logs & Monitoring](#logsmonitoring)
* [Database](#rethinkdb)
* [Command-Line-Interface](#cli)
* [IDE](#ide)
* [React](#react)

## Quick start
Follow those steps to get webbox running on your system:
1. Clone the repository locally
2. Install node
3. `npm install`  to download all dependencies, the `sourcebox` modules may require to be an collaborator on the repos (they are private)
4. Install  rethinkdb/rethinkdb (there is also a windows beta)
5. Configure and start rethinkdb (See rethinkdb below)
6. Add `config/development.json` which allows to overwrite config settings. For example, requires the *Forgot Password* function a valid *SendGrid* account.
7. Use the *CLI*  to add an user. (See CLI)

You can find further details below.

### Start server
You can start a local dev server with: `$ NODE_ENV=development node webbox.js` or on windows with:
```cmd
set NODE_ENV=development
node webbox.babel.js
```
A good way for running the app with auto reload ist *nodemon*. We have included a nodemon config - just run `nodemon webbox.babel.js`.
Or lastly, you can use `npm run`.


### Config
The project uses the `config` module and a default config. For config overrides just add a `production.json` or a `development.json` and specify
the node environment. The config module automatically replaces the default config values with the custom ones.

Additionally, `./config/webbox.config.js` exposes the config object.

### Routes
Define routes in `conf/routes.js`. Each route points to a controller/handler which is placed
in `controllers/...`.

### Templates
Currently, *webbox* is configured to use the jade templating engine. All views reside in `./views` and need to have
the `.jade` file extension. All templates are compiled after server start. The default config prevents
the caching of templates.

To render a view, just use `reply('viewname', {})` and pass an optional context object.

### Models
All models are defined using the `thinky` ORM. `thinky` is pretty lightweight and exposes
`thinky.r` the rethinkdb driver. Just have a look at `./models`. `thinky` is based on Promises
and requires to `.run()` a query. The `run()` method returns a chainable promise.

### Logs/Monitoring
Currently, good is used to log any events. You can find the logs under `logs` and on the console.


### rethinkdb
In order to use webbox you need to install [rethinkdb](https://www.rethinkdb.com/).

Use the rethinkdb `Data Explorer` to set the `authKey` with the following command:
```javascript
r.db('rethinkdb').table('cluster_config').get('auth').update({auth_key: 'newkey'})
```

### CLI
Use the cli to add a user or list all users:

You can specify if the added user is an admin by setting the isAdmin argument to true
`node ./bin/cli.js addUser username email password isAdmin`
Example: `node ./bin/cli.js addUser foobar foo@bar.foo foobar true` which should result in
```bash
Creating a pool connected to localhost:28015
Trying to save encrypted password: foobar $2a$10$wYd78IZGAHPliuY.sVCYF.3GgwOq/6x4YSJckB4hdRW/2pF5vaqZ2
Saved User:  foobar 2f6e1442-359b-4242-a885-401cbbd6932e
```

### IDE
The IDE is a react-based UI for programming. See:
* `client\js\embed.js`
* `common\components\ide\`
* `common\models\project.js` and related files


### React
The webbox appilcation is using a mix of server-side templating (Jade) and React for rendering the pages.