import React from 'react';

import Icon from '../Icon';

export function EditButtonGroup (props) {
  const editIcon = <Icon className="icon-control" onClick={props.onEdit} name="pencil" title="Inhalt bearbeiten" />;
  const stopEditIcon = <Icon className="icon-control" onClick={props.onStopEdit} name="eye" title="Zur normalen Ansicht zurück" />;
  const iconBtn = props.editing ? stopEditIcon : editIcon;

  return (
    <div className="editor-btns">
      {iconBtn}
      <Icon className="icon-control" onClick={props.onCellUp} name="arrow-circle-o-up" title="Nach oben verschieben" />
      <Icon className="icon-control" onClick={props.onCellDown} name="arrow-circle-o-down" title="Nach unten verschieben" />
      <Icon className="icon-control" onClick={props.onDelete} name="times-circle-o" title="Löschen" />
    </div>
  );
}