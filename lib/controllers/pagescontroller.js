'use strict';
/**
 * The pages controller handles are normal views without special logic.
 */
var User = require('../models/user');
var Markdown = require('../util/markdown');

module.exports = {
  index: function (request, reply) {
    var username = 'Nicht angemeldet';
    if (request.auth.isAuthenticated) {
      username = request.auth.credentials.username;
      console.info('Authenticated:', request.auth);
    }

    reply.view('index', {
      title: 'Webbox | Hapi ' + request.server.version,
      message: 'All your base are belong to use!',
      username: username
    });
  },
  course: function (request, reply) {
    const markdowntest = `# Eine Überschrift
anschließend etwas Text inkl. #12455 bzw. #list_example
\`\`\` javascript
var test = 3;
function (){
  return 0;
}
\`\`\`


## Headings geht an anchor link / permalink
Contents after an heading are encapsulated in a section element
This is create for creating slides later on

You can also write LaTeX formulas which get rendered with KaTeX
$$\\sum_{0}^{10}a^i$$

<div class="notices tip">

It is also possible to add markdown inside of html tags, if there is a blank line after the tag.
*sdfsdf*

</div>
<!-- {.notices.tip} -->
`;
    Markdown.render(markdowntest).then((rendered) => {
      reply.view('course', {
        title: 'Course Page',
        content: rendered
      });
    });
  }
};