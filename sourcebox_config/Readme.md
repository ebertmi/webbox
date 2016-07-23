# Sourcebox Configuration
This folder contains files for configuring and setting up our main sourcebox application container template.

## Matplotlib
By using the `common\models\languages.js `env` setting we can specify a custom matplotlib backend. The backend can be
set using the `MPLBACKEND` env variable, e. g. `'module://backend_sb'`. The specified module must be available on
the `PYTHONPATH` (e.g. `'/usr/local/lib/sourcebox/'`). For displaying the data, we need to configure an additional stream,
 used for transferring the image data.

**Configuration example:**
```
python3: {
  exec: ['python3', './main.py'],
  displayName: 'Python 3 (Sourcebox)',
  env: {
    PYTHONPATH: '/usr/local/lib/sourcebox/',
    MPLBACKEND: 'module://backend_sb'
  },
  streams: 3,
  streamsObjectMode: [false, false, false] /* set the mode for the additional streams */
}
```

## Changing the PYTHONPATH env variable
Changes to the location requires to recompile the client modules. The current default is `/usr/local/lib/sourcebox/`.
You can put the  `turtle.py` and `backend_sb` there on your sourcebox container template.

## Turtle
The client-server Turtle support requires the use of a custom turtle implementation (see turtle.py:WebCommunication).

Server-side Turtle module is now working for basic drawing and stuff.
The only things missing are keyboard and mouse events. See `/common/turtle/turtle.js` and the out commented code for handling
those.

See latest `Turtle.py`on https://gist.github.com/waywaaard/2bc0b67867c3da4434389d31b43a5e41
