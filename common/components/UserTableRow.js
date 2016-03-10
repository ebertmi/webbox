import React, {Component} from 'react';
import { Link } from 'react-router';
import {Time} from './Time';

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
    return (
      <tr>
        <td>
          <Link to="/admin/users">{this.props.id}</Link>
        </td>
        <td>{this.props.data.email}</td>
        <td>{this.renderIsActive()}</td>
        <td>{this.props.data.semester}</td>
        <td>
          <Time value={this.props.data.lastLogin} locale="de" relative={true}/>
        </td>
        <td>{this.renderIsCompleted()}</td>
        <td>
          {this.props.data.roles.map(role => {
            return <span className="label label-default label-roles">{role}</span>;
          })}
        </td>
      </tr>
    );
  }
}