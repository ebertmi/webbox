import React from 'react';
import JSONTree from 'react-json-tree';
import {Time} from '../Time';

const tabClassNameMap = {
  error: 'tag-danger',
  warning: 'tag-warning',
  info: 'tag-info',
  success: 'tag-success'
};

function getTagClassForEventType (eventType) {
  return tabClassNameMap[eventType.toLowerCase()] || 'tag-default';
}

/**
 * Renders a log row
 */
export function LogTableRow (props) {
  const tagClassName = "tag " + getTagClassForEventType(props.data.eventType);
  return (
    <tr>
      <td>{props.data.eventName}</td>
      <td>{props.data.eventMessage}</td>
      <td>
        <span className={tagClassName}>{props.data.eventType}</span>
      </td>
      <td><JSONTree hideRoot={true} data={ props.data.eventData } /></td>
      <td>
        <Time value={props.data.timeStamp} locale="de" relative={true}/>
      </td>
    </tr>
  );
}