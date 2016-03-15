import React from 'react';
import { Link } from 'react-router';
import { Time } from '../Time';

/**
 * Renders a course row
 */
export function CourseTableRow (props) {
  const courseDetailPath = `/admin/course/${props.data.id}`;
  const creatorDetailPath = `/admin/user/${props.data._creatorId}`;
  const courseViewPath = `/course/${props.data.slug}`;

  return (
    <tr key={props.data.id}>
      <td>
        <Link to={courseDetailPath}>{props.data.title}</Link>
      </td>
      <td>{props.data.id}</td>
      <td>{props.data.description}</td>
      <td>
        <Link to={creatorDetailPath}>{props.data._creatorId}</Link>
      </td>
      <td>
        <Time value={props.data.createdAt} locale="de" relative={true}/>
      </td>
      <td>
        <Time value={props.data.lastUpdate} locale="de" relative={true}/>
      </td>
      <td>
        <a href={courseViewPath} target="blank">Zum Kurs</a>
      </td>
    </tr>
  );
}