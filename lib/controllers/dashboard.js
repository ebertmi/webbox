'use strict';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { RouterContext, match } from 'react-router';
import configureStore from '../../common/store/configureStore';
import adminRoutes from '../../common/route/adminRoutes';
import Log from '../models/log';
import Thinky from '../util/thinky';

module.exports = {
  index: function (request, reply) {
    let initialState = {
      dashboardApp: {
        logs: [],
        message: null
      },
      userOverview: {
        users: [],
        user: null,
        usersQuery: {
          page: 1,
          limit: 15
        }
      },
      courseOverview: {
        courses: [],
        course: null,
        coursesQuery: {
          page: 1,
          limit: 15
        }
      },
      embedOverview: {
        embeds: [],
        embed: null,
        embedsQuery: {
          page: 1,
          limit: 15
        }
      }
    };

    Log.orderBy({index: Thinky.r.desc('timeStamp')}).limit(15).run()
    .then(logs => {
      initialState.dashboardApp.logs = logs;
    })
    .error(err => {
      console.error('Dashboard.index', err);
      initialState.dashboardApp.message = {
        type: 'error',
        content: 'Datenbankfehler beim Abrufen der letzten Logeinträge.'
      };
    })
    .finally(() => {
      const store = configureStore(initialState);

      // wire up routing based upon routes
      match({ routes: adminRoutes, location: request.path }, (err, redirectLocation, renderProps) => {
        if (err) {
          console.log('Dashboard.match', err);
          return reply().code(500);
        }

        if (redirectLocation) {
          // redirect all teh things
          console.log('Redirect all teh things!!11ELF!', redirectLocation);
          return reply.redirect(redirectLocation);
        }

        // Render the component to a string
        const prerenderedHtml = ReactDOMServer.renderToString(
          <Provider store={store}>
            <div>
              <RouterContext {...renderProps} />
            </div>
          </Provider>
        );

        reply.view('react/dashboard', {
          prerenderedHtml: prerenderedHtml,
          initialState: JSON.stringify(store.getState()),
          user: request.pre.user
        });
      });
    });
  }
};