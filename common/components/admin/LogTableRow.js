import React from 'react';
import {Time} from '../Time';

const labelClassNameMap = {
  error: 'label-danger',
  warning: 'label-warning',
  info: 'label-info',
  success: 'label-success'
};

function getLabelClassForEventType (eventType) {
  return labelClassNameMap[eventType.toLowerCase()] || 'label-default';
}

/**
 * Renders a log row
 */
export function LogTableRow (props) {
  const labelClassName = "label " + getLabelClassForEventType(props.data.eventType);
  return (
    <tr>
      <td>{props.data.eventName}</td>
      <td>{props.data.eventMessage}</td>
      <td>
        <span className={labelClassName}>{props.data.eventType}</span>
      </td>
      <td>{JSON.stringify(props.data.eventData, null, 4)}</td>
      <td>
        <Time value={props.data.timeStamp} locale="de" relative={true}/>
      </td>
      <td>{props.data.id}</td>
    </tr>
  );
}