import React from 'react';
import { Link } from 'react-router';
import { Time } from '../Time';

/**
 * Renders a course row
 */
export function EmbedTableRow (props) {
  const userDetailPath = `/admin/user/${props.data.creator.id}`;
  const embedPath = `/embed/${props.data.id}`;
  return (

    <tr key={props.data.id}>
      <td><a href={embedPath} target="blank">Zum Beispiel ({props.data.id})</a></td>
      <td>{props.data.meta.name}</td>
      <td><span className="tag tag-default">{props.data.meta.language}</span></td>
      <td><Link target="_blank" to={userDetailPath}>{props.data.creator.username} ({props.data.creator.email})</Link></td>
      <td><Time value={props.data.createdAt} locale="de" relative={true} invalidDateString="nicht angegeben" /></td>
      <td><Time value={props.data.lastUpdate} locale="de" relative={true} invalidDateString="noch nie" /></td>
      <td><span className="tag tag-default">{props.data.meta.embedType}</span></td>
      <td>{props.data.slug}</td>
    </tr>
  );
}