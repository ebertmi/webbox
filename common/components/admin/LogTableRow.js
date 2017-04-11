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

const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  /*base00: '#272822',*/
  base00: 'transparent', /* use the background of the current row*/
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633'
};

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
      <td><JSONTree hideRoot={true} data={ props.data.eventData } theme={theme} invertTheme={true} /></td>
      <td>
        <Time value={props.data.timeStamp} locale="de" relative={true}/>
      </td>
    </tr>
  );
}