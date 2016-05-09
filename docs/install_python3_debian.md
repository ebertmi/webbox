# How to install Python3 and some basic libs on debian
## Python3
You can get Python3 from the dist packages:
`apt-get install python3` and running scripts with `python3 script.py`

Though, *pip* is not installed by default, so you have to do:
`apt-get install python3-pip`  and running pip with `pip3 command args`

## Numpy
NumPy is easy to install with pip `pip3 install numpy`. All dependencies should be automatically installed  by the numpy install script.

## Matplotlib
Mpl requires some more work. You can either use the distro version (older) or install it with pip.
Pip installation requires a couple of dependencies:
`apt-get install apt-get install libpng-dev pkg-config libfreetype6-dev`

Then with pip install:
`pip3 install python-dateutil nose cycler pyparsing pytz`

And then finally:
`pip3 install matplotlib` (takes the latest on pypi)