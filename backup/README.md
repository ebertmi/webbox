# Backup and Restore

The following scripts and commands help in doing basic backup of the rethinkdb and the media directory.
Consider reading the rethinkdb documentation about data migration: [Docs](https://www.rethinkdb.com/docs/migration/)

## Dump the current database

```bash
rethinkdb dump -e webbox -f webbox_dump.tar.gz -p
```

## Restore a database dump

This requires the python driver to be installed and the `-p` option prompts for the admin user password to access the database.

```bash
rethinkdb restore 01.03.17-07.58rethinkdb_dump.tar.gz -p --force
```

## Backup-Scripts

`rethink-backup.js` is a script that backups the rethinkdb dump every 6 hours to an amazon S3. The script uses a couple of deps - install them with `npm install aws-sdk alter dateformat`.

The script expects a couple of amazon env variables to be set. Use a shell script to set them and then launch the backup script:

```bash
#!/bin/bash
export AWS_ACCESS_KEY_ID=;
export AWS_SECRET_ACCESS_KEY=+aBs3Zy58KRq+AL1rFxp;
export S3_BUCKET=trycoding.io-backup
export AWS_REGION="eu-central-1"

/usr/bin/node rethink-backup.js

```

## Backup the media

The webbox server stores all images and other media data currently in the `/media` directoy. You can use zip those files and restore them by unzipping. All media resources are found by uuids.

```bash
zip -r media.backup.zip ./media
```

## Export a single table as csv (or json)

```bash
python -m rethinkdb export -e webbox.User --format csv --fields id,lastLogin,createdAt -p -d ./dbexport
```