"""
This backend overrides the pyplot show method for rendering mpl figures. It
tries to send the figure as an PNG-Image over the file descriptor 3 to a
listener.
The data is sent as binary in the following format:
STARTIMAGE IMAGEDATA ENDIMAGE
"""

from __future__ import (absolute_import, division, print_function,
                        unicode_literals)

from matplotlib.externals import six

import matplotlib
from matplotlib.backends.backend_agg import new_figure_manager, FigureCanvasAgg
from matplotlib._pylab_helpers import Gcf
from matplotlib.backend_bases import RendererBase, GraphicsContextBase,\
     FigureManagerBase, FigureCanvasBase
from matplotlib.figure import Figure
from matplotlib.transforms import Bbox
import io
import os
import sys


########################################################################
#
# The following functions and classes are for pylab and implement
# window/figure managers, etc...
#
########################################################################

def show():
    for manager in Gcf.get_all_fig_managers():
        # try to set the transparency for saved images
        try:
            manager.canvas.figure.patch.set_alpha(0)
        except e:
            pass

        canvas = FigureCanvasAgg(manager.canvas.figure)


        # now the filedescriptor 3 must exist
        try:
            fd = os.fdopen(3, 'wb')
            fd.write(b'STARTIMGAGE')
            fd.flush()
            #canvas.print_png(fd, transparent=True)
            canvas.print_jpg(fd, quality=95)
            fd.flush()
            fd.write(b'ENDIMAGE')
            fd.flush()
            fd.close()
        except e:
            print('An error occured while sending the image to your browser.')


########################################################################
#
# Now just provide the standard names that backend.__init__ is expecting
#
########################################################################

FigureCanvas = FigureCanvasAgg