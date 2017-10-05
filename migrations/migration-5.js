/**
 * Updates all embeds from creator -> creators m-n relationships
 */

// recentDocuments
var CodeEmbed = require('../lib/models/codeEmbed');
var Thinky = require('../lib/util/thinky');

function run() {
  console.info('Updating embeds with creators relationships');

  CodeEmbed.getJoin({creators: true}).pluck({id: true, _creatorId: true, creators: ['id', 'email']}).execute().then(embeds => {
    for (var embed of embeds) {
      if (embed.creators.length === 0) {

        console.log("trying to save");
        embed.addRelation('creators', {id: embed._creatorId});
      } else {
        console.log("embed already includes id", embed.creators);
      }
    }

    console.info('Finished migration.');

    //process.exit();
  }).error(err => {
    console.error(err);
    process.exit();
  });

  return;
}

run();