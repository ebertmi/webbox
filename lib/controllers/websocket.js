/**
 * Course Controller
 *
 * Handles viewing and editing courses
 */
'use strict';
import JWT from 'jsonwebtoken';
import UUID from 'uuid';
import Config from '../../config/webbox.config';


export function* onEvent (request, reply) {
  console.log(request.payload, request.auth);
  reply();
}

export function* onAction (request, reply) {
  console.log(request.payload, request.auth);
  reply();
}