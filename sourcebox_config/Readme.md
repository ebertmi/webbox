# Sourcebox Config
This folder contains files for configuring and setting up our main sourcebox application container template.

## Matplotlib
By using the `common\models\languages.js `env` setting we can specify a custom matplotlib backend. The backend can be
set using the `MPLBACKEND` env variable, e. g. `'module://backend_sb'`. The specified module must be available on
the `PYTHONPATH` (e.g. `'/home/user/PythonTest'`). For displaying the data, we need to configure an additional stream,
 used for transfering the image data.

**Configuration example:**
```
python3: {
  exec: ['python3', './main.py'],
  displayName: 'Python 3 (Sourcebox)',
  env: {
    PYTHONPATH: '/home/user/PythonTest',
    MPLBACKEND: 'module://backend_sb'
  },
  streams: 1,
  streamsObjectMode: [false] /* set the mode for the additional streams */
}
```

## Turtle
The client-server Turtle support requires the use of a custom turtle implementation (see turtle.py:WebCommunication).

TODO
**Not working currenlty**