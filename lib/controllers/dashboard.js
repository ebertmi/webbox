'use strict';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { RouterContext, match } from 'react-router';
import configureStore from '../../common/store/configureStore';
import adminRoutes from '../../common/route/adminRoutes';

module.exports = {
  index: function (request, reply) {
    let initialState = {
      dashboardApp: {
        logs: [],
        message: {}
      }
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