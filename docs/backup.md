## RethinkDB Backup Guide

### General Information
You can find a general rethinkDB backup guide here: https://www.rethinkdb.com/docs/backup/

### Create Backup - Dump to file
On the running server just use the following command: `rethinkdb dump -p -f testdb.dump`
This will prompt you to input your admin password.

### Current process
See `/backup/*` for the script. You need to add a cronjob on your machine in order to run the script periodically.
The script uses the `--password-file dbpass.txt` switch and therefore requires you to put your credentials inside the
the file.

Example bash script for the cron job:
```bash
#!/bin/bash

export AWS_ACCESS_KEY_ID=YOURKEY;
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET;
export S3_BUCKET=YOUR_BUCKET
export AWS_REGION=YOUR_REGION

node rethink-backup.js
```