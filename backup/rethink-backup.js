'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var zlib = require('zlib');
var AWS = require('aws-sdk');
var fmt = require('dateformat');
var r = require('rethinkdb');

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

//withRethink(() => {
//console.log('rethinkdb connection established');
//console.log('waiting to backup..');

// Now start that thing
//setInterval(backup, dayInMs);
backup();
//});