/**
 * API for viewing and editing Embeds (Admin Dashboard)
 */
import CodeEmbed from '../models/codeEmbed';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;

export function getEmbeds (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let embeds;

  // ToDo: order requests .orderBy({index: Thinky.r.desc('createdAt')})
  CodeEmbed.slice(sliceStart, sliceEnd).getJoin({creator: true}).run()
  .then(res => {
    embeds = res;
    return CodeEmbed.count().execute();
  })
  .then(count => {
    response.embeds = embeds;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return reply(response);
  })
  .error(err => {
    console.error('Api.getEmbeds', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}

export function getEmbed(request, reply) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view
  CodeEmbed.get(id).run()
  .then(embed => {
    response.embed = embed;
    reply.view(response);
  })
  .error(Errors.DocumentNotFound, err => {
    console.error('Api.getEmbed', err);
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
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}