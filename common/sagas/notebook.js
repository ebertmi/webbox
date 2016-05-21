import { takeLatest } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects';
import * as notebookTypes from '../constants/NotebookActionTypes';
import { API } from '../services';

export default function* notebookSaga () {
  // avoid multiple fetching of the same data
  yield [];
}