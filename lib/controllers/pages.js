/**
 * The pages controller handles are normal views without special logic.
 */

module.exports = {
  index: function index(request, h) {
    const isAuthor = request.pre.user.isAnonymous ? false : request.pre.user.scope.includes('author');

    return h.view('index', {
      user: request.pre.user,
      isAuthor: isAuthor,
      documents: request.pre.documents,
      embeds: request.pre.embeds,
      codeDocuments: request.pre.codeDocuments,
      courses: request.pre.courses,
      recentlyViewedDocuments: request.pre.recentlyViewedDocuments
    });
  },
  profile: function profile (request, h) {
    return h.view('profile', {
      user: request.pre.user
    });
  },
  imprint: function imprint (request, h) {
    return h.view('imprint', {
      user: request.pre.user
    });
  },
  privacy: function privacy(request, h) {
    return h.view('privacy', {
      user: request.pre.user
    });
  }
};
