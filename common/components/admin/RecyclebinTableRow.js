import React from 'react';
import {Time} from '../Time';
import { Link } from 'react-router';
import JSONTree from 'react-json-tree';

/**
 * Renders a log row
 */
export function RecyclebinTableRow (props) {
  const userDetailPath = `/admin/user/${props.data.userId}`;

  return (
    <tr>
      <td>{props.data.model}</td>
      <td><Link to={userDetailPath}><code>{props.data.userId}</code></Link></td>
      <td><JSONTree hideRoot={true} data={ props.data.data }/></td>
      <td>
        <Time value={props.data.timeStamp} locale="de" relative={true}/>
      </td>
    </tr>
  );
}