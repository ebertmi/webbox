/**
 * The pages controller handles are normal views without special logic.
 */

module.exports = {
  index: function (request, reply) {
    let isAuthor = request.pre.user.isAnonymous ? false : request.pre.user.scope.includes('author');

    reply.view('index', {
      user: request.pre.user,
      isAuthor: isAuthor,
      documents: request.pre.documents,
      embeds: request.pre.embeds,
      codeDocuments: request.pre.codeDocuments,
      courses: request.pre.courses,
      recentlyViewedDocuments: request.pre.recentlyViewedDocuments
    });
  },
  profile: function (request, reply) {
    console.log(request.pre.user);
    reply.view('profile', {
      user: request.pre.user
    });
  },
  imprint: function (request, reply) {
    reply.view('imprint', {
      user: request.pre.user
    });
  },
  privacy: function (request, reply) {
    reply.view('privacy', {
      user: request.pre.user
    });
  }
};
