import React from 'react';
import {Time} from '../Time';
import { Link } from 'react-router';
import JSONTree from 'react-json-tree';

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
export function RecyclebinTableRow (props) {
  const userDetailPath = `/admin/user/${props.data.userId}`;

  return (
    <tr>
      <td>{props.data.model}</td>
      <td><Link to={userDetailPath}><code>{props.data.userId}</code></Link></td>
      <td><JSONTree hideRoot={true} data={ props.data.data } theme={theme} invertTheme={true}/></td>
      <td>
        <Time value={props.data.timeStamp} locale="de" relative={true}/>
      </td>
    </tr>
  );
}