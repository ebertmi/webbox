import React from 'react';
import {Time} from '../Time';

/**
 * Renders a log row
 */
export function AuthAttemptTableRow (props) {
  return (
    <tr>
      <td>{props.data.username}</td>
      <td>{props.data.ip}</td>
      <td>{props.data.id}</td>
      <td>
        <Time value={props.data.time} locale="de" relative={true}/>
      </td>
    </tr>
  );
}