import React from 'react';
import { Route, IndexRoute } from 'react-router';

import AdminApp from '../containers/admin/AdminApp';
import UserOverview from '../containers/admin/UserOverview';
import CourseOverview from '../containers/admin/CourseOverview';
import LogOverview from '../containers/admin/LogOverview';
import EmbedOverview from '../containers/admin/EmbedOverview';
import User from '../components/admin/User';

export default (
  <Route path='/admin' component={AdminApp}>
    <IndexRoute component={LogOverview} />
    <Route path='/admin/users' component={UserOverview} />
    <Route path='/admin/user/:id' component={User} />
    <Route path='/admin/courses' component={CourseOverview} />
    <Route path='/admin/embeds' component={EmbedOverview} />
    <Route path='/admin/authattempts' component={CourseOverview} />
  </Route>
);