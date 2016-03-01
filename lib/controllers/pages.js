'use strict';
/**
 * The pages controller handles are normal views without special logic.
 */
var User = require('../models/user');
var Markdown = require('../util/markdown');
var Boom = require('boom');
var _ = require('lodash');

module.exports = {
  index: function (request, reply) {
    reply.view('index', {
      title: 'Webbox | Hapi ' + request.server.version,
      user: request.pre.user
    });
  },
  course: function (request, reply) {
    const markdowntest = `# Eine Überschrift
anschließend etwas Text inkl. #12455 bzw. #list_example
\`\`\` javascript
var test = 3;
function (){
  return 0;
}
\`\`\`


## Headings geht an anchor link / permalink
Contents after an heading are encapsulated in a section element
This is create for creating slides later on

You can also write LaTeX formulas which get rendered with KaTeX
$$\\sum_{0}^{10}a^i$$

<div class="notices tip">

It is also possible to add markdown inside of html tags, if there is a blank line after the tag.
*sdfsdf*

</div>
<!-- {.notices.tip} -->

## NumPy Arrays
In NumPy sind sogenannte homogene und multidimensionale Arrays die wichtigste Datenstruktur. Mit einem
Array kann man, genauso wie bei Listen, Tabellen bzw. Matrizen darstellen - nur sind diese deutlich
effizienter. Schauen wir uns dazu ein Beispiel an:

$$x =
\\begin{pmatrix}
1 \\quad& 2 \\quad& 3  \\\\
4 \\quad& 5 \\quad& 6  \\\\
7 \\quad& 8 \\quad& 9
\\end{pmatrix}$$

\`\`\`python
import numpy as np
# neues Array erzeugen, wir uebergeben eine Liste
x = np.array([[1,2,3],[4,5,6],[7,8,9]])
print(x)

print(x.shape) # Form des Arrays
print(x.ndim) # Anzahl der Dimensionen
print(x.size) # Groeße bzw. Anzahl der Elemente
print(x.dtype) # Datentyp der Elemente
\`\`\`

### Eigenschaften
Das Array aus unserem Beispiel hat 2 Dimensionen. Die Anzahl der Dimensionen wird auch öfters als *Rank*
bezeichnet.
Die Eigenschaft \`array.shape\` beschreibt die Anzahl der Elemente in jeder Dimension. Bei
zwei Dimensionen, z. B. die Anzahl der Zeilen und Spalten.

### Warum sind NumPy Arrays so schnell?
Die Arrays sind im Vergleich zu Listen deutlich schneller, da ihre Größe und der Datentyp unveränderlich ist. Somit
muss kein neuer Speicherplatz angefordert (allokiert) werden und alle Elemente sind direkt hintereinander im Speicher
abgelegt.

[NumPyArray vs Lists](https://elearn.evelinprojekt.de/static/epy/images/presentation/numpy_array_vs_list.png)
<!-- {.img-fluid} -->

Und anschließend noch mehr Text.
`;
    Markdown.render(markdowntest)
    .then((rendered) => {
      reply.view('course', {
        title: 'Course Page',
        content: rendered
      });
    })
    .error((err) => {
      Boom.badData(err.toString());
    });
  },
  imprint: function (request, reply) {
    reply.view('imprint');
  },
  privacy: function (request, reply) {
    reply.view('privacy');
  }
};