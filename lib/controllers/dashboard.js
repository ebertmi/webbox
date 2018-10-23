'use strict';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import Hoek from 'hoek';
import { RouterContext, match } from 'react-router';
import dashboardStore from '../../common/store/dashboardStore';
import adminRoutes from '../../common/route/AdminRoutes';

/**
 * Clone initial states, no need to create those objects on every request
 */
import {INITIAL_DASHBOARD_STATE} from '../../common/reducers/dashboard';
import {INITIAL_EMBED_STATE} from '../../common/reducers/embed';
import {INITIAL_USER_STATE} from '../../common/reducers/user';
import {INITIAL_COURSE_STATE} from '../../common/reducers/course';
import {INITIAL_LOG_STATE} from '../../common/reducers/log';
import {INITIAL_AUTHATTEMPT_STATE} from '../../common/reducers/authattempt';
import {INITIAL_RECYCLEBIN_STATE} from '../../common/reducers/recyclebin';
import {INITIAL_MAIL_STATE} from '../../common/reducers/mail';
const DASHBOARD_STATE = Hoek.clone(INITIAL_DASHBOARD_STATE);
const EMBED_STATE = Hoek.clone(INITIAL_EMBED_STATE);
const USER_STATE = Hoek.clone(INITIAL_USER_STATE);
const COURSE_STATE = Hoek.clone(INITIAL_COURSE_STATE);
const LOG_STATE = Hoek.clone(INITIAL_LOG_STATE);
const AUTHATTEMPT_STATE = Hoek.clone(INITIAL_AUTHATTEMPT_STATE);
const RECYLCEBIN_STATE = Hoek.clone(INITIAL_RECYCLEBIN_STATE);
const MAIL_STATE = Hoek.clone(INITIAL_MAIL_STATE);

module.exports = {
  index: async function index (request, h) {
    const initialState = {
      dashboardApp: DASHBOARD_STATE,
      userOverview: USER_STATE,
      courseOverview: COURSE_STATE,
      embedOverview: EMBED_STATE,
      logOverview: LOG_STATE,
      authAttemptOverview: AUTHATTEMPT_STATE,
      recyclebinOverview: RECYLCEBIN_STATE,
      mailOverview: MAIL_STATE
    };

    const store = dashboardStore(initialState);

    // wire up routing based upon routes
    return new Promise((resolve) => {
      match({ routes: adminRoutes, location: request.path }, (err, redirectLocation, renderProps) => {
        if (err) {
          console.log('Dashboard.match', err);
          return resolve(h.code(404));
        }

        if (redirectLocation) {
          // redirect all teh things
          return resolve(h.redirect('/admin'));
        }

        // Render the component to a string
        const prerenderedHtml = ReactDOMServer.renderToString(
          <Provider store={store}>
            <div>
              <RouterContext {...renderProps} />
            </div>
          </Provider>
        );

        return resolve(h.view('react/dashboard', {
          prerenderedHtml: prerenderedHtml,
          initialState: JSON.stringify(store.getState()),
          user: request.pre.user
        }));
      });
    });
  }
};
