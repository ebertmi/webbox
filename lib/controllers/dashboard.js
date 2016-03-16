'use strict';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import Hoek from 'hoek';
import { RouterContext, match } from 'react-router';
import configureStore from '../../common/store/configureStore';
import adminRoutes from '../../common/route/adminRoutes';

/**
 * Clone initial states, no need to create those objects on every request
 */
import {INITIAL_DASHBOARD_STATE} from  '../../common/reducers/dashboard';
import {INITIAL_EMBED_STATE} from  '../../common/reducers/embed';
import {INITIAL_USER_STATE} from  '../../common/reducers/user';
import {INITIAL_COURSE_STATE} from  '../../common/reducers/course';
import {INITIAL_LOG_STATE} from  '../../common/reducers/log';
import {INITIAL_AUTHATTEMPT_STATE} from  '../../common/reducers/authattempt';
const DASHBOARD_STATE = Hoek.clone(INITIAL_DASHBOARD_STATE);
const EMBED_STATE = Hoek.clone(INITIAL_EMBED_STATE);
const USER_STATE = Hoek.clone(INITIAL_USER_STATE);
const COURSE_STATE = Hoek.clone(INITIAL_COURSE_STATE);
const LOG_STATE = Hoek.clone(INITIAL_LOG_STATE);
const AUTHATTEMPT_STATE = Hoek.clone(INITIAL_AUTHATTEMPT_STATE);

module.exports = {
  index: function (request, reply) {
    let initialState = {
      dashboardApp: DASHBOARD_STATE,
      userOverview: USER_STATE,
      courseOverview: COURSE_STATE,
      embedOverview: EMBED_STATE,
      logOverview: LOG_STATE,
      authAttemptOverview: AUTHATTEMPT_STATE
    };

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
  }
};