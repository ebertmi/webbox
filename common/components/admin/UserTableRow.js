import React, {Component} from 'react';
import { Link } from 'react-router';
import { Time } from '../Time';

export class UserTableRow extends Component {
  renderIsCompleted () {
    const className = this.props.data.verification.isCompleted ? "fa fa-circle" : "fa fa-circle-o";
    return <i className={className}></i>;
  }

  renderIsActive () {
    const className = this.props.data.isActive ? "fa fa-circle" : "fa fa-circle-o";
    return <i className={className}></i>;
  }

  render () {
    const userDetailPath = `/admin/user/${this.props.data.id}`;

    return (
      <tr key={this.props.data.id}>
        <td>
          <Link to={userDetailPath}>{this.props.data.id}</Link>
        </td>
        <td>{this.props.data.email}</td>
        <td>{this.renderIsActive()}</td>
        <td>{this.props.data.semester}</td>
        <td>
          <Time value={this.props.data.lastLogin} locale="de" relative={true} invalidDateString="noch nie"/>
        </td>
        <td>{this.renderIsCompleted()}</td>
        <td>
          {this.props.data.roles.map((role, index) => {
            return <span key={index} className="label label-default label-roles">{role}</span>;
          })}
        </td>
      </tr>
    );
  }
}