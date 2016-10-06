/**
 * API for viewing and editing Embeds (Admin Dashboard)
 */
import Document from '../models/document';
import Thinky from '../util/thinky';
const Errors = Thinky.Errors;

export function getDocuments (request, reply) {
  const page = request.query.page;
  const limit = request.query.limit;
  const response = {};
  const sliceStart = (page -1) * limit;
  const sliceEnd = sliceStart + limit;
  let documents;

  // .orderBy({index: Thinky.r.desc('createdAt')})
  Document.slice(sliceStart, sliceEnd).getJoin({creator: true}).run()
  .then(res => {
    documents = res;
    return Document.count().execute();
  })
  .then(count => {
    response.documents = documents;
    response.count = count;

    // calculate the maximum pages, at least 1
    response.pages = Math.ceil(count / limit);

    return reply(response);
  })
  .error(err => {
    console.error('Api.getDocuments', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}

export function getDocument(request, reply) {
  const id = request.params.id;
  const response = { };

  // fetch user and render view
  Document.get(id).run()
  .then(document => {
    response.document = document;
    reply.view(response);
  })
  .error(Errors.DocumentNotFound, err => {
    console.error('Api.getDocument', err);
    response.error = {
      message: 'No document found for this ID.',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es existiert kein Dokument unter dieser ID.'
    };

    reply(response);
  })
  .error(err => {
    console.error('Api.getDocument', err);
    response.error = {
      message: 'Unknown Error',
      type: 'Database',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    reply(response);
  });
}