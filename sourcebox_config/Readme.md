# Sourcebox Configuration

This folder contains files for configuring and setting up our main sourcebox application container template.

## Matplotlib

By using the `common\models\languages.js `env` setting we can specify a custom matplotlib backend. The backend can be
set using the `MPLBACKEND` env variable, e. g. `'module://backend_sb'`. The specified module must be available on
the `PYTHONPATH` (e.g. `'/usr/local/lib/sourcebox/'`). For displaying the data, we need to configure an additional stream,
 used for transferring the image data.

**Configuration example:**

```javascript
python3: {
  exec: ['python3', './main.py'],
  displayName: 'Python 3 (Sourcebox)',
  env: {
    PYTHONPATH: '/usr/local/lib/sourcebox/',
    MPLBACKEND: 'module://backend_sb',
    MPLCONFIGDIR: '/usr/local/lib/sourcebox/mplconfig'
  },
  streams: 3,
  streamsObjectMode: [false, false, false] /* set the mode for the additional streams */
}
```

## Changing the PYTHONPATH env variable

Changes to the location requires to recompile the client modules. The current default is `/usr/local/lib/sourcebox/`.
You can put the  `turtle.py` and `backend_sb.py` there on your sourcebox container template.

## Prevent font-cache regeneration for every user

Create a empty dir `/usr/local/lib/sourcebox/mplconfig` and then apply `chmod -R 0777 mplconfig` to allow every user to write on it.
Next, use `export MPLCONFIGDIR=/usr/local/lib/sourcebox/mplconfig` and then run `python3` and in the REPL `import matplotlib.pyplot`. This
generates the font-cache.
This avoids the continous regeneration of the font-cache and therefore speeds up the import of matplotlib.

## Turtle

The client-server Turtle support requires the use of a custom turtle implementation (see turtle.py:WebCommunication).

Server-side Turtle module is now working for basic drawing and stuff.
The only things missing are keyboard and mouse events. See `/common/turtle/turtle.js` and the out commented code for handling
those.

See latest `Turtle.py`on https://gist.github.com/ebertmi/2bc0b67867c3da4434389d31b43a5e41
Use something like `wget` or `curl` to download the files, e.g. `wget https://gist.githubusercontent.com/ebertmi/5b11e3e45956d82e47fbae54b9eccf93/raw/48cc344caf6199abfb0d40dab925518c3a107bb5/backend_sb.py`