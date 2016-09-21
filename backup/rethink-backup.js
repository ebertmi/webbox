'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var zlib = require('zlib');
var AWS = require('aws-sdk');
var fmt = require('dateformat');
var r = require('rethinkdb');

//var client = knox.createClient({
//  key: process.env.AWS_ACCESS_KEY_ID,
//  secret: process.env.AWS_SECRET_ACCESS_KEY,
//  bucket: process.env.S3_BUCKET,
//  region: process.env.AWS_REGION
//});

/*
function withRethink(callback) {
  let opts = {host: 'rethink', port: 28015};
  r.connect(opts, function(err, conn) {
    if (err) {
      throw err;
    }
    r.expr(1).run(conn, function(err, result) {
      if (result != 1) {
        throw new Error('ping failed');
      }
      else {
        return callback();
      }
    });
  });
}
*/

function getDate() {
  return fmt(Date.now(), 'dd.mm.yy-hh:MM-TT');
}

function backup() {
  console.log('starting dump', getDate());
  let file = Date.now() + 'rethinkdb_dump.tar.gz';
  let s = spawn('rethinkdb-dump', ['--password-file', 'dbpass.txt', '-f', file]);
  s.stdout.pipe(process.stdout);
  s.stderr.pipe(process.stderr);
  s.on('close', (code) => {
    console.log('completed dump with code: ' + code, getDate());
    upload(file);
  });
}

/*
function upload_old(file) {
  console.log('starting upload', getDate());
  client.putFile(file, file, function(err, res){
    if (err) {
      console.error(err);
    }
    res.resume();
    console.log('completed upload: ', Date.now());
  }).on('progress', function(v) {
    // track upload progress if you need here:
    // console.log('progress event')
    // console.log(v)
  });
}
*/


function upload(file) {
  console.log('Try to connect to S3 with: ', process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY, process.env.AWS_REGION);

  var body = fs.createReadStream(file).pipe(zlib.createGzip());
  var s3obj = new AWS.S3({params: {Bucket: process.env.S3_BUCKET, Key: file}});
  s3obj.upload({Body: body}).
    on('httpUploadProgress', function(evt) {
      console.log(evt);
    }).
    send(function(err, data) {
      console.log(err, data);
    });
}

// 1 day = 86400 sec
const dayInSeconds = 60 * 60 * 24;
const dayInMs = 1000 * dayInSeconds;

//withRethink(() => {
//console.log('rethinkdb connection established');
//console.log('waiting to backup..');

// Now start that thing
//setInterval(backup, dayInMs);
backup();
//});