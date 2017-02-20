'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var zlib = require('zlib');
var AWS = require('aws-sdk');
var fmt = require('dateformat');
var later = require('later');

function getDate() {
  return fmt(Date.now(), 'dd.mm.yy-hh:MM-TT');
}

function backup() {
  console.log('starting dump', getDate());
  let file = fmt(Date.now(), 'dd.mm.yy-hh.MM') + 'rethinkdb_dump.tar.gz';
  let s = spawn('rethinkdb-dump', ['--password-file', 'dbpass.txt', '-f', file]);
  s.stdout.pipe(process.stdout);
  s.stderr.pipe(process.stderr);
  s.on('close', (code) => {
    console.log('completed dump with code: ' + code, getDate());
    upload(file);
  });
}

function upload(file) {
  console.log('Try to connect to S3: ');

  var body = fs.createReadStream(file).pipe(zlib.createGzip());
  var s3obj = new AWS.S3({ params: { Bucket: process.env.S3_BUCKET, Key: file } });
  s3obj.upload({ Body: body }).
    on('httpUploadProgress', function (evt) {
      if (evt && evt.part && evt.key) {
        console.log('Uploading ... part:%s file:%s', evt.part+"", evt.key);
      }
    }).
    send(function (err, data) {
      if (err != null) {
        console.error('Error during upload', err);
      } else {
        console.info('Upload completed', data);
      }
    });
}

// Schedule the backup for every 12 hours
var sched = later.parse.recur().every(12).hour();
later.setInterval(backup, sched);
backup();
