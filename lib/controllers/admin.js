'use strict';

/**
 * Controller for all admin actions and views
 */
const Course = require('../models/course');
const User = require('../models/user');
const AuthAttempt = require('../models/authattempt');
const Embed = require('../models/embed');
const Thinky = require('../util/thinky');
const Errors = Thinky.Errors;
const _ = require('lodash');
const MODELS = [
  {
    model: Course,
    path: '/courses',
    displayName: 'Kurse'
  }, {
    model: User,
    path: '/users',
    displayName: 'Benutzer'
  }, {
    model: Embed,
    path: '/embeds',
    displayName: 'Embeds'
  }, {
    model: AuthAttempt,
    path: '/authattempts',
    displayName: 'Login-Versuche'
  }
];

const BASE_CONTEXT = {
  models: MODELS
};

module.exports = {
  dashboard: function (request, reply) {
    // get all models
    const context = {
      models: MODELS,
      user: request.pre.user
    };

    reply.view('admin/dashboard', context);
  },
  list: function (request, reply) {

  },
  users: function (request, reply) {
    User.orderBy({index: 'email'}).run()
    .then(users => {
      const context = {
        models: MODELS,
        users: users,
        user: request.pre.user
      };

      reply.view('admin/users', context);
    })
    .error(err => {
      const context = {
        models: MODELS,
        errorMessage: 'Unbekannter Datenbankfehler.',
        users: []
      };

      reply.view('admin/users', context);
    });
  },
  user: function (request, reply) {
    const id = request.params.id;

    // fetch user and render view
    User.get(id).run()
    .then(user => {
      reply.view('admin/user', {
        models: MODELS,
        userData: JSON.stringify(user, null, '\t'),
        id: user.id,
        username: user.username,
        user: request.pre.user
      });
    })
    .error(Errors.DocumentNotFound, err => {
      reply.view('admin/user', {
        models: MODELS,
        errorMessage: 'Es existiert kein Nutzer mit dieser ID.',
        userData: '',
        user: request.pre.user
      });
    })
    .error(err => {
      console.error('admin.user', err);
      reply.view('admin/user', {
        models: MODELS,
        errorMessage: 'Datenbankfehler.',
        userData: '',
        user: request.pre.user
      });
    });
  },
  deleteUser: function (request, reply) {
    const modelId = request.params.id;

    // check if model exists
    User.get(modelId).run()
    .then(user => {
      if (request.auth.credentials.id === modelId) {
        return reply.view('admin/user', {
          models: MODELS,
          errorMessage: 'Sie sind derzeit mit diesem Benutzer angemeldet und können diesen nicht löschen.',
          userData: user,
          user: request.pre.user
        });
      }

      // we are ready to delete
      return user.delete();
    })
    .then(() => {
      return User.orderBy({index: 'email'}).run();
    })
    .then(users => {
      const context = {
        models: MODELS,
        users: users,
        successMessage: 'Benutzer wurde gelöscht.',
        user: request.pre.user
      };

      return reply.view('admin/users', context);
    })
    .error(err => {
      reply.view('admin/user', {
        models: MODELS,
        errorMessage: 'Es existiert kein Benutzer mit dieser ID.',
        userData: '',
        user: request.pre.user
      });
    });

    // check if user tries to delete his own user

    // then delete and return success messgae

    // should we invalidate the session for this user

  },
  saveUser: function (request, reply) {
    const modelData = JSON.parse(request.payload.modelData);
    const model = new User(modelData);

    try {
      model.validate();
    } catch (err) {
      return reply.view('admin/user', {
        errorMessage: 'Ungültige Benutzerdaten: ' + err,
        models: MODELS,
        userData: JSON.stringify(model, null, '\t'),
        id: model.id,
        username: model.username,
        user: request.pre.user
      });
    }

    // ID must not be changed
    if (model.id !== request.params.id) {
      return reply.view('admin/user', {
        errorMessage: 'Die ID eines Benutzer kann nicht geändert werden!',
        models: MODELS,
        userData: JSON.stringify(model, null, '\t'),
        id: model.id,
        username: model.username,
        user: request.pre.user
      });
    }

    // Save
    User.get(model.id).run()
    .then(user => {
      return user.merge(model).save();
    })
    .then(() => {
      return reply.view('admin/user', {
        successMessage: 'Gespeichert',
        models: MODELS,
        userData: JSON.stringify(model, null, '\t'),
        id: model.id,
        username: model.username,
        user: request.pre.user
      });
    })
    .error(err => {
      console.error(err);
      return reply.view('admin/user', {
        errorMessage: 'Unbekannter Fehler beim speichern.',
        models: MODELS,
        userData: JSON.stringify(model, null, '\t'),
        id: model.id,
        username: model.username,
        user: request.pre.user
      });
    });
  },
  authattempts: function (request, reply) {
    AuthAttempt.orderBy({index: 'time'}).run()
    .then(attempts => {
      const context = {
        models: MODELS,
        attempts: attempts,
        user: request.pre.user
      };

      reply.view('admin/authattempts', context);
    })
    .error(err => {
      const context = {
        models: MODELS,
        errorMessage: 'Unbekannter Datenbankfehler.',
        attempts: [],
        user: request.pre.user
      };

      reply.view('admin/authattempts', context);
    });
  },
  courses: function (request, reply) {
    Course.orderBy({index: 'slug'}).run()
    .then(courses => {
      const context = {
        models: MODELS,
        courses: courses,
        user: request.pre.user
      };

      reply.view('admin/courses', context);
    })
    .error(err => {
      const context = {
        models: MODELS,
        errorMessage: 'Unbekannter Datenbankfehler.',
        courses: [],
        user: request.pre.user
      };

      reply.view('admin/courses', context);
    });
  },
  course: function (request, reply) {
    const id = request.params.id;

    // fetch user and render view
    Course.get(id).run()
    .then(course => {
      reply.view('admin/course', {
        models: MODELS,
        course: JSON.stringify(course, null, '\t'),
        id: course.id,
        title: course.title,
        user: request.pre.user
      });
    })
    .error(Errors.DocumentNotFound, err => {
      reply.view('admin/course', {
        models: MODELS,
        errorMessage: 'Es existiert kein Nutzer mit dieser ID.',
        course: '',
        user: request.pre.user
      });
    })
    .error(err => {
      console.error('admin.course', err);
      reply.view('admin/course', {
        models: MODELS,
        errorMessage: 'Datenbankfehler.',
        course: '',
        user: request.pre.user
      });
    });
  },
  embeds: function (request, reply) {
    Embed.orderBy({index: 'id'}).run()
    .then(embeds => {
      const context = {
        models: MODELS,
        embeds: embeds,
        user: request.pre.user
      };

      reply.view('admin/embeds', context);
    })
    .error(err => {
      const context = {
        models: MODELS,
        errorMessage: 'Unbekannter Datenbankfehler.',
        embeds: [],
        user: request.pre.user
      };

      reply.view('admin/embeds', context);
    });
  },
  embed: function (request, reply) {
    const id = request.params.id;

    // fetch user and render view
    Embed.get(id).run()
    .then(embed => {
      reply.view('admin/embed', {
        models: MODELS,
        embed: JSON.stringify(embed, null, '\t'),
        id: embed.id,
        title: embed.title,
        user: request.pre.user
      });
    })
    .error(Errors.DocumentNotFound, err => {
      reply.view('admin/embed', {
        models: MODELS,
        errorMessage: 'Es existiert kein Nutzer mit dieser ID.',
        embed: '',
        user: request.pre.user
      });
    })
    .error(err => {
      console.error('admin.embed', err);
      reply.view('admin/embed', {
        models: MODELS,
        errorMessage: 'Datenbankfehler.',
        embed: '',
        user: request.pre.user
      });
    });
  }
};