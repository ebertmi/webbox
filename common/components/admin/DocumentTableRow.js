import React from 'react';
import { Link } from 'react-router';
import { Time } from '../Time';

import get from 'lodash/get';

function getLanguageStringFromDocument(document) {
  const language_name = get(document.metadata, 'language_info.name', 'Sprache nicht definiert');
  const language_version = get(document.metadata, 'language_info.version', '');

  return `${language_name} ${language_version}`;
}

/**
 * Renders a course row
 */
export function DocumentTableRow (props) {
  const userDetailPath = `/admin/user/${props.data.creator.id}`;
  const documentPath = `/d/${props.data.id}`;
  const languageString = getLanguageStringFromDocument(props.data);

  return (
    <tr key={props.data.id}>
      <td><a href={documentPath} target="blank">Zum Dokument ({props.data.id})</a></td>
      <td>{props.data.metadata.title}</td>
      <td><span className="tag tag-success">{languageString}</span></td>
      <td><Link target="_blank" to={userDetailPath}>{props.data.creator.username} ({props.data.creator.email})</Link></td>
      <td><Time value={props.data.createdAt} locale="de" relative={true} invalidDateString="nicht angegeben" /></td>
      <td><Time value={props.data.metadata.lastUpdated} locale="de" relative={true} invalidDateString="noch nie" /></td>
      <td><span className="tag tag-default">{props.data.embedType}</span></td>
      <td>{props.data.slug}</td>
    </tr>
  );
}