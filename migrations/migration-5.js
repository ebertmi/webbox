/**
 * Updates all embeds from creator -> creators m-n relationships
 */

// recentDocuments
var CodeEmbed = require('../lib/models/codeEmbed');
var Thinky = require('../lib/util/thinky');
import Promise from 'bluebird';

function run() {
  console.info('Updating embeds with creators relationships');

  CodeEmbed.getJoin({creators: true}).pluck({id: true, _creatorId: true, creators: ['id', 'email']}).execute().then(embeds => {
    console.info('Starting to migrate ' + embeds.length + ' embeds');
    return Promise.map(embeds, embed => {
      console.info('Migrating embed', embed.id);
      if (embed.creators.length === 0) {
        return CodeEmbed.get(embed.id).run().then(embedObj => {
          return embedObj.addRelation('creators', {id: embed._creatorId});
        });
      } else {
        console.log('embed already includes id', embed.creators);
        return null;
      }
    }).then(() => {
      console.info('Finished migration.');
    })
      .error(err => {
        console.error(err);
        process.exit();
      });


  }).error(err => {
    console.error(err);
    process.exit();
  });

  return;
}

run();