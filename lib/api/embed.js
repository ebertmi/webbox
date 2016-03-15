'use strict';

import Embed from '../models/embed';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;

export function getEmbeds (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;

  Embed.orderBy({index: 'createdAt'}).slice(sliceStart, sliceEnd).run()
  .then(embeds => {
    response.embeds = embeds;
    reply(response);
  })
  .error(err => {
    console.error('Api.getEmbeds', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    reply(response);
  });
}

export function getEmbed(request, reply) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view
  Embed.get(id).run()
  .then(embed => {
    response.embed = embed;
    reply.view(response);
  })
  .error(Errors.DocumentNotFound, err => {
    console.error('Api.getCourses', err);
    response.error = {
      message: 'No embed found for this ID.',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es existiert kein Embed unter dieser ID.'
    };

    reply(response);
  })
  .error(err => {
    console.error('Api.getEmbed', err);
    response.error = {
      message: 'Unbekannter Datenbankfehler.',
      type: 'Database'
    };

    reply(response);
  });
}