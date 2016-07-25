import React from 'react';

import Icon from '../Icon';
import { Toolbar, ActionItem } from '../Toolbar';

const IS_VISIBLE_ICON_NAME = 'circle';
const IS_INVISIBLE_ICON_NAME = 'circle-o';
const IS_VISIBLE_TITLE = 'Verstecken';
const IS_INVISIBLE_TITLE = 'Anzeigen';

function renderToggleEditButton (props) {
  if (props.editing) {
    return (
      <ActionItem onClick={props.onStopEdit} title="Zur normalen Ansicht zurück">
        <Icon className="icon-control" name="eye" />
      </ActionItem>);
  } else {
    return (
      <ActionItem onClick={props.onEdit} title="Inhalt bearbeiten">
      <Icon className="icon-control" name="pencil" />
    </ActionItem>);
  }
}

export function EditButtonGroup (props) {
  const isVisibleIcon = props.isVisible ? IS_VISIBLE_ICON_NAME : IS_INVISIBLE_ICON_NAME;
  const isVisibleTitle = props.isVisible ? IS_VISIBLE_TITLE : IS_INVISIBLE_TITLE;

  if (props.isAuthor === false) {
    return null;
  }

  // else render buttons
  return (
    <div className="col-xs-12">
      <div className="editor-btns">
        <Toolbar>
          {renderToggleEditButton(props)}
          <ActionItem onClick={props.onToggleVisibility} title="Nach oben verschieben" >
            <Icon className="icon-control" name={isVisibleIcon} title={isVisibleTitle} />
          </ActionItem>
          <ActionItem onClick={props.onCellUp} title="Nach oben verschieben" >
            <Icon className="icon-control" name="arrow-circle-o-up" />
          </ActionItem>
          <ActionItem onClick={props.onCellDown} title="Nach unten verschieben" >
            <Icon className="icon-control" name="arrow-circle-o-down" />
          </ActionItem>
          <ActionItem onClick={props.onDelete} title="Löschen" >
            <Icon className="icon-control" name="times-circle-o" />
          </ActionItem>
        </Toolbar>
      </div>
    </div>
  );
}