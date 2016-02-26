/* global process */
var Promise = require('bluebird');

// setup args
require('yargs').usage('webboxcli <cmd> [args]')
  .command('list <model>', 'list database entries for <model>', { },
  function (argv) {
    list(argv.model);
  })
  .example('list User', 'list all users')
  .command('addUser <username> <email> <password>', 'adds/updates a user to the database', {}, function (argv) {
    addUser(argv.username, argv.email, argv.password);
  })
  .command('removeUser <id>', 'removes the user with <id>', {}, function (argv) {
    removeUser(argv.id);
  })
  .command('addCourse <slug> <userid>', 'adds dummy course', {}, function (argv) {
    addCourse(argv.slug, argv.userid);
  })
  .command('removeCourse <id>', 'removes the course with <id>', {}, function (argv) {
    removeCourse(argv.id);
  })
  .help('help')
  .argv;


function list (model) {
  if (model === "User") {
    var User = require('../lib/models/user');

    User.orderBy({index: 'username'}).run().then(function (users) {
      for (var u of users) {
        console.log(u.username, u.email, u.roles, u.id, u.password);
      }
      process.exit();
    });
  } else if (model === "Course") {
    var Course = require('../lib/models/course');

    Course.orderBy({index: 'name'}).run().then(function (courses) {
      for (var c of courses) {
        console.log(c.name, c.title, c.id);
      }
      process.exit();
    });
  }
}

/**
 * Adds a new user if not already existing
 */
function addUser (username, email, password) {
  var User = require('../lib/models/user');
  User.findByEmailorUsername(username, email)
  .then((user) => {
    console.log('A user with this username/email already exists.', user.id);
    process.exit(1);
  })
  .error((err) => {
    // user does not exist already, proceed
    // encrypt password
    return User.encryptPassword(password);
  })
  .then((hash) => {
    console.info('Trying to save encrypted password:', username, hash);
    // create a new user with default role
    var newUser = new User({
      username: username,
      email: email,
      password: hash,
      roles: ['user']
    });
    return newUser.save();
  })
  .then((user) => {
    console.log('Saved User: ', user.username, user.id);
  })
  .error((err) => {
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });
}

function removeUser (id) {
  var User = require('../lib/models/user');

  User.get(id).run()
  .then((user) => {
    return user.delete();
  })
  .then(() => {
    console.log('Removed user with id: ', id);
  })
  .error((err) => {
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });;
}

function addCourse (slug, userid) {
  const DUMMY_DOCUMENT = `# Markdown - eine einfache Sprache

hier noch etwas Text. Und anschließend einen Beispielcode
\`\`\`python
print('All your base are belong to us!')
\`\`\`
`;
  var Course = require('../lib/models/course');

  // ToDo: check if there is an existing course with this id

  var c = Course({
    title: 'Einführung in ' + slug,
    slug: slug,
    _creator: userid,
    chapters: [{
      document: DUMMY_DOCUMENT,
      title: 'Einstieg',
      isIndex: true,
      titleSlug: 'einstieg',
      history: []
    }]
  });

  c.save()
  .then(() => {
    console.log('Created dummy course');
  })
  .error((err) => {
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });
}

function removeCourse (id) {
  var Course = require('../lib/models/course');

  Course.get(id).run()
  .then((course) => {
    return course.delete();
  })
  .then(() => {
    console.log('Removed course with id: ', id);
  })
  .error((err) => {
    console.log(err);
  })
  .finally(() => {
    process.exit();
  });;
}
