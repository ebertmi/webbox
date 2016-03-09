import React from 'react';
import { Route, IndexRoute } from 'react-router';

import AdminApp from '../containers/admin/AdminApp';
import UserOverview from '../containers/admin/UserOverview';
import CourseOverview from '../containers/admin/CourseOverview';
import LogOverview from '../containers/admin/LogOverview';

export default (
  <Route path='/admin' component={AdminApp}>
    <IndexRoute components={LogOverview} />
    <Route path='/admin/users' components={UserOverview} />
    <Route path='/admin/courses' components={CourseOverview} />
    <Route path='/admin/embeds' components={CourseOverview} />
    <Route path='/admin/authattempts' components={CourseOverview} />
  </Route>
);