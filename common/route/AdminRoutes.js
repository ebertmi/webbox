import React from 'react';
import { Route, IndexRoute, Redirect } from 'react-router';

import AdminApp from '../containers/admin/AdminApp';
import UserOverview from '../containers/admin/UserOverview';
import CourseOverview from '../containers/admin/CourseOverview';
import LogOverview from '../containers/admin/LogOverview';
import EmbedOverview from '../containers/admin/EmbedOverview';
import DocumentOverview from '../containers/admin/DocumentOverview';
import AuthAttemptOverview from '../containers/admin/AuthAttemptOverview';
import RecyclebinOverview from '../containers/admin/RecyclebinOverview';
import MailOverview from '../containers/admin/MailOverview';
import User from '../components/admin/User';
import Course from '../components/admin/Course';

export default (
  <Route path='/admin' component={AdminApp}>
    <IndexRoute component={LogOverview} />
    <Route path='/admin/users' component={UserOverview} />
    <Route path='/admin/user/:id' component={User} />
    <Route path='/admin/courses' component={CourseOverview} />
    <Route path='/admin/course/:id' component={Course} />
    <Route path='/admin/embeds' component={EmbedOverview} />
    <Route path='/admin/documents' component={DocumentOverview} />
    <Route path='/admin/authattempts' component={AuthAttemptOverview} />
    <Route path='/admin/recyclebin' component={RecyclebinOverview} />
    <Route path='/admin/mail' component={MailOverview} />
    <Redirect from="*" to="" />
  </Route>
);
