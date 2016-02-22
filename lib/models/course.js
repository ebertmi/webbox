var slug = require('slug');
var thinky = require('../util/thinky');
var type = thinky.type;

var Course = thinky.createModel('Course', {
   id: type.string().required(),
   title: type.string().required(),
   source: type.string().default(''),
   createdAt: type.date().allowNull(),
   chapters: [{
       document: type.string().required(),
       title: type.string().optional(),
       isIndex: type.boolean().default(false),
       source: type.string().optional(),
       slug: type.string(),
       lastUpdate: type.date().default(Date.now()),
       history: [{
           document: type.string(),
           createdAt: type.date()
       }]
   }]
   
});

Course.define('getIndex', function () {
    var indexChapter;
    for (var c in this.chapters) {
        if (c.isIndex === true) {
            indexChapter = c;
            break;
        }
    }
    
    return indexChapter;
    
});

Course.define('createSlug', function (title) {
    return slug(title, {
            lower: true,
            remove: slug.defaults.modes['pretty'].remove
        });
});

// Course.defineStatic(key, fn);

module.exports = Course;