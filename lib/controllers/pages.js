import jwt from 'jsonwebtoken';
const Config = require('../../config/webbox.config');
import CodeEmbed from '../models/codeEmbed';
/**
 * The pages controller handles are normal views without special logic.
 */

module.exports = {
  index: function (request, reply) {
    reply.view('index', {
      user: request.pre.user
    });
  },
  imprint: function (request, reply) {
    reply.view('imprint', {
      user: request.pre.user
    });
  },
  privacy: function (request, reply) {
    reply.view('privacy', {
      user: request.pre.user
    });
  },
  embed: function (request, reply) {
    // ToDo: just a quick test
    const secret = 'ItsASecretToEverybody!';

    let authToken = jwt.sign({
      username: request.pre.user.username
    }, secret);

    let meta = CodeEmbed.getDefaultMeta('PythonTest');
    let ce = new CodeEmbed({
      meta: meta,
      code: {
        'main.py': 'import os\n\nprint(os.environ.get(\'PYTHONPATH\'))\nprint(os.environ.get(\'MPLBACKEND\'))\n\nt = 3\ng = 9.81\n\nh = 0.5 * g * t**2\n\nprint(\"h(t) = %d\" % h)\n\nimport matplotlib.pyplot as pp\nimport numpy as np\n\nt = np.linspace(0, 10, 10)  # make a list of values from 0 to 10\nh = 0.5 * g * t**2 # calculate h for each value in t (h is also a list)\n\n# plot h and t\npp.plot(h, t, \"--ro\", linewidth=3, markersize=6, dash_capstyle=\"projecting\", markerfacecolor=\"b\");\npp.title(\"Free Fall\")\npp.xlabel(\"t in seconds\")\npp.ylabel(\"h in meters\")\npp.show()',
        'data.txt': 'test\ntest2\ntest3\n',
        'backend_sb.py': '#http:\/\/stackoverflow.com\/a\/32988875\/1602537\n\"\"\"\nTrinket backend to override plt.show() with plt.savefig().\n\"\"\"\n\nfrom __future__ import (absolute_import, division, print_function,\n                        unicode_literals)\n\nfrom matplotlib.externals import six\n\nimport matplotlib\nfrom matplotlib.backends.backend_agg import new_figure_manager, FigureCanvasAgg\nfrom matplotlib._pylab_helpers import Gcf\nfrom matplotlib.backend_bases import RendererBase, GraphicsContextBase,\\\n     FigureManagerBase, FigureCanvasBase\nfrom matplotlib.figure import Figure\nfrom matplotlib.transforms import Bbox\nimport io\nimport os\nimport sys\n\n\n########################################################################\n#\n# The following functions and classes are for pylab and implement\n# window\/figure managers, etc...\n#\n########################################################################\n\ndef show():\n    for manager in Gcf.get_all_fig_managers():\n        output = io.BytesIO()\n        canvas = FigureCanvasAgg(manager.canvas.figure)\n        canvas.print_png(output)\n        bytestr = output.getvalue()\n\n        # now the filedescriptor 3 must exist\n        try:\n            fd = os.fdopen(3, \'wb\')\n            fd.write(bytestr)\n            fd.close()\n        except e:\n            print(\'An error occured while sending the image to your browser.\')\n            \n\n########################################################################\n#\n# Now just provide the standard names that backend.__init__ is expecting\n#\n########################################################################\n\nFigureCanvas = FigureCanvasAgg'
      }
    });

    let INITIAL_DATA = ce;
    let USER_DATA = {
      username: request.pre.user.username
    };

    reply.view('embed', {
      authToken,
      server: Config.sourcebox.url,
      INITIAL_DATA: JSON.stringify(INITIAL_DATA),
      USER_DATA: JSON.stringify(USER_DATA)
    });
  }
};
