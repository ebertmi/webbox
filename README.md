# webbox

Webbased editor powered by sourcebox (secure remote-code-execution with bidirectional streams)

## Table of Contents

* [Quick start](#quick-start)
* [Architecture in 2 Minutes](#architecture-in-2-minutes)
* [Start server](#start-server)
* [Config](#config)
* [Routing](#routes)
* [Models](#models)
* [Logs & Monitoring](#logsmonitoring)
* [Database](#rethinkdb)
* [Command-Line-Interface](#cli)
* [IDE](#ide)
* [React](#react)
* [Versioning](#versioning)
* [Deploying](#deploying)
* [Tests](#tests)
* [Developing](#developing)

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

## Architecture in 2 Minutes

The below list summarizes the items of primary importance for this project:

* Server: Webbox is basically a simple web application using an document data base (rethinkdb)
* Server: We store documents in the IPYNB standard
* Server: We store code examples as database documents (see `lib\models\codeEmbed.js`) and students' modifications in an additional document (see `lib\models\codeDocument.js`)
* Server: We use websockets to track events and trigger actions from the webbased IDE
* Client: The client code is split into 3 *applications*: *administration/dashboard*, *IDE* and *notebook and presentation*
* Client: All clients use **React** for rendering, however the underlying models are different in each case
* Dashboard: Uses React + Redux without immutable states (for now) and is partially rendered on the server (isomorphic rendering)
* IDE: Uses React + custom model that implement the `EventEmitter` interface and notify all listeners on changes.
* Notebook: Uses React + Immutable.js for state manipulation and storing
* Presentation: Uses React + Immutable.js and shares a lot of components with the notebook. Uses spectacle/spectacle for the presentation rendering

Read the following sections in order to get used to the system.

### Start server

You can start a local dev server with: `$ NODE_ENV=development node webbox.babel.js` or on windows with:

```cmd
set NODE_ENV=development
node webbox.babel.js
```

Or use the npm scripts in production mode:

```bash
npm run startwin // windows
npm run start // linux
```

A good way for running the app with auto reload ist *nodemon*. We have included a nodemon config - just run `nodemon webbox.babel.js`.
Or lastly, you can use `npm run start:dev`.

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

**RethinkDB 2.3**
RethinkDB uses now an admin account. The admin account has not password by default. So please set one.

See http://rethinkdb.com/docs/security/#securing-the-driver-port for more information about setting the password.
You need to set the password then in the rethinkdb configuration.
See https://rethinkdb.com/docs/permissions-and-accounts/ for information about creating users and setting permissions.

**WARNING** This applies to RethinkDB 2.0
Use the rethinkdb `Data Explorer` to set the `authKey` with the following command:

```javascript
r.db('rethinkdb').table('cluster_config').get('auth').update({auth_key: 'newkey'})
```

You can use the rethinkdb Python driver to **dump** and **restore** the webbox database aswell as to export tables as `csv`:

### CLI

Use the cli to add a user or list all users:

You can specify if the added user is an admin by setting the isAdmin argument to true
`node ./bin/wb.js addUser username email password isAdmin`
Example: `node ./bin/wb.js addUser foobar foo@bar.foo foobar true` which should result in

```bash
Creating a pool connected to localhost:28015
Trying to save encrypted password: foobar $2a$10$wYd78IZGAHPliuY.sVCYF.3GgwOq/6x4YSJckB4hdRW/2pF5vaqZ2
Saved User:  foobar 2f6e1442-359b-4242-a885-401cbbd6932e
```

Running the CLI on a production server requires to start it as follows: `NODE_ENV=production node ./bin/wb.js`

### IDE

The IDE is a react-based UI for programming. See:

* `client\js\embed.js`
* `common\components\ide\`
* `common\models\project.js` and related files

### React

The webbox appilcation is using a mix of server-side templating (Jade) and React for rendering the pages.

## Versioning

We are using Semantic Versioning (SemVer) *MAJOR.MINOR.PATCH*:

* *MAJOR*: Breaking changes
* *MINOR*: New features and fixes, but works with older versions
* *PATCH*: Fixes that are backward compatible

## Deploying

Steps:

1. Upload current version with compiled client files (use `npm run web:build`)
2. Install nodejs `>6` or `7` and `npm`
3. (Install `sudo apt-get npm make gcc build-essential g++ lxc lxc-dev btrfs-tools libcap-dev`) required for sourcebox and not webbox
4. Go to the `webbox`directory and run `npm install`

If node-gyp is failing try to update nodejs and then run `npm rebuild`

Then install RethinkDB:
Either visit rethinkdb site and follow the instructions there or paste this:

```bash
source /etc/lsb-release && echo "deb http://download.rethinkdb.com/apt $DISTRIB_CODENAME main" | sudo tee /etc/apt/sources.list.d/rethinkdb.list
wget -qO- https://download.rethinkdb.com/apt/pubkey.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install rethinkdb
```

Now configure rethinkdb to start on system start using https://rethinkdb.com/docs/start-on-startup/

When there is no web-interface for managing rethinkdb, the best way is using python.
Run `sudo apt-get install python3 python3-pip` and then install the python driver with `sudo pip3 install rethinkdb`

Then you can use the python3 repl and changing the settings and creating databases...

For example:

```python
import rethinkdb as r
r.connect('localhost', 28015).repl()
r.db_create('webbox').run()

# changing the admin password
r.db('rethinkdb').table('users').get('admin').update({'password': 'YOUR_SUPER_STRONG_PASSWORD'}).run()
r.db('rethinkdb').table('users').get('admin').run()
```

And after setting the password you need to connect with it the next time you start the repl

```python
import rethinkdb as r
r.connect('localhost', 28015, user="admin", password="YOUR_SUPER_STRONG_PASSWORD").repl()
```

Finally, we can start our server. In production mode you need some kind of process monitor/manager. We use `pm2` and
start it like this:

```bash
pm2 kill
sudo env NODE_ENV=production pm2 start webbox.babel.js
```

You need the pm2 kill, if you messed up with pm2 before. Otherwise it does not recognize the `NODE_ENV` in cluster mode.

## Tests

Currently, we have only example tests for the client. See `/test-client`. The client side tests are also using es6 and need to be compiled.
Run `npm run test:watch` to automatically (re)build the tests on changes. Then just open `/test-client/index.html` and you get an overview
of the passed and failed tests.

You can add tests by adding a new file under `/test-client` using following naming convention `package.module.test.js`. Any `js`-file that ends with `.test.js` will
be automatically included in the test suite.

It is also possible to just build the tests once using `npm run test:build`.

## Developing

You need to start two processes in order to get the development mode running:

1. `npm run start:dev` which starts the server in the development mode (`NODE_ENV=development`) (you need `npm install nodemon`)
2. `npm run web:watch` which automatically builds all client bundles on file changes.

You can add/configure a custom development configuration under `/config/development.json` which gets *merged* with the `/config/default.json` configuration.
But you do not need to do so. The default configuration should have some sane values...