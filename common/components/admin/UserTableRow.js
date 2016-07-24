import React from 'react';
import { Link } from 'react-router';
import { Time } from '../Time';

function renderIsCompleted (props) {
  const className = props.data.verification.isCompleted ? "fa fa-circle" : "fa fa-circle-o";
  return <i className={className}></i>;
}

function renderIsActive (props) {
  const className = props.data.isActive ? "fa fa-circle" : "fa fa-circle-o";
  return <i className={className}></i>;
}

export function UserTableRow(props) {
  const userDetailPath = `/admin/user/${props.data.id}`;

  return (
    <tr key={props.data.id}>
      <td>
        <Link to={userDetailPath}>{props.data.id}</Link>
      </td>
      <td>{props.data.email}</td>
      <td>{renderIsActive(props)}</td>
      <td>{props.data.semester}</td>
      <td>
        <Time value={props.data.lastLogin} locale="de" relative={true} invalidDateString="noch nie"/>
      </td>
      <td>{renderIsCompleted(props)}</td>
      <td>
        {props.data.roles.map((role, index) => {
          return <span key={index} className="tag tag-default tag-roles">{role}</span>;
        })}
      </td>
    </tr>
  );

}