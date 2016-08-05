import { Writable } from 'stream';
import { EventEmitter } from 'events';

/**
 * Consumes turtle stream messages and converts the bytestream to a string and then parses the json.
 * After successfully parsing a json message the turtle.onStreamMessage method is called with the json data.
 */
export class TurtleMessageConsumer extends Writable {
  constructor(turtle, options) {
    super(options);

    this.turtle = turtle;
    this.previousChunks = [];
    this.incompleteMsg = '';
  }

  /**
   * Transforms a chunk of json msgs to json and applies the it
   * on the turtle canvas. Takes care of incomplete messages at
   * the end of a chunk.
   *
   * @param {any} str
   */
  transformChunk (str) {
    var newStr = str;

    // Append the incompleteMsgs from last the last chunk to the new one
    if (this.incompleteMsg !== '') {
      newStr = this.incompleteMsg.concat(str);
      this.incompleteMsg = ''; // Reset incompleteMsgs
    }

    // Now split the msgs by \n\r see turtle.py sendPickle
    let msgs = newStr.split('\n\r');
    var length = msgs.length;

    // Check if chunk contains an incomplete message at the end
    if (str.endsWith('\n\r') === false) {
      this.incompleteMsg = msgs[length - 1];
      length = length - 1; // Ignore last incomplete message in processing
    }

    // Iterate over all msgs and try to parse and apply them
    for (let i = 0; i < length; i++) {
      if (msgs[i].length === 0 || (msgs[i].length === 1 && msgs[i].charCodeAt(0) === 13)) {
        // Skip those empty lines
      } else {
        try {
          let chunkJson = JSON.parse(msgs[i]);
          this.turtle.onStreamMessage(chunkJson);
        } catch (e) {
          if (e instanceof SyntaxError) {
            // We might recover from those
            console.warn(`Invalid json message:`);
          } else {
            // Those can lead to some serious problems.
            // How can we access the std.out to output our error here
            // ToDo: add stdout access and print error
            console.error(e);
            this.emit('error', e);
          }
        }
      }
    }
  }

  _write (chunk, encoding, callback) {
    let chunkStr = chunk.toString();

    // Pass Chunk to our transform method
    this.transformChunk(chunkStr);

    callback();
  }
}

const ANCHOR_LUT = {
  'sw': 'left',
  's': 'center',
  'se': 'right'
};

/**
 * Turtle Class for rendering and communicating with the canvas
 */
export class Turtle extends EventEmitter {
  constructor(streams, project) {
    super();
    this.project = project;
    this.canvas; // jQuery object
    this.items = [];

    this.turtleStream = streams.turtle;

    // The MessageConsumer parses the JSON messages and applies them
    const turtleMessageConsumer = new TurtleMessageConsumer(this);
    turtleMessageConsumer.on('error', e => {
      console.warn('TurtleMessageConsumer:', e);
      if (streams.stdout) {
        streams.stdout.write('Unser Server ist etwas aus dem Tritt gekommen. Bitte starte das Beispiel erneut.');
      }
    });

    // Now pipe the incoming messages to our consumer/transformer
    this.turtleStream.pipe(turtleMessageConsumer, { end: true });

    this.debugChars = [];

    this.canvasClickHandler = this.canvasClickHandler.bind(this);
    this.canvasReleaseHandler = this.canvasReleaseHandler.bind(this);
  }

  // ToDo: handle different events, may require changes in turtle.py
  // https://docs.python.org/3.1/library/turtle.html#turtle.onclick
  // https://docs.python.org/3.1/library/turtle.html#turtle.onkey
  // http://openbookproject.net/thinkcs/python/english3e/events.html

  getMouseEventData(e) {
    let dx;
    let dy;
    let xpos;
    let ypos;
    let eventX;
    let eventY;

    if (e.eventPhase !== 2) {
      return;
    }

    e.stopPropagation();
    dx = this.canvas.width / 2;
    dy = this.canvas.height / 2;

    if (e.offsetX == undefined) {
      xpos = e.pageX - this.canvas.offsetLeft;
      ypos = e.pageY - this.canvas.offsetTop;
    } else {
      xpos = e.offsetX;
      ypos = e.offsetY;
    }

    eventX = xpos - dx;
    eventY = ypos - dy;

    // Turtle uses Left, Middle, Right => 1, 2, 3
    // Browsers use 0, 1, 2, 3, 4...
    let button = e.button != null ? e.button : 0;
    button += 1; // Add 1 to match turtle num

    return {
      eventX,
      eventY,
      button
    };
  }

  canvasReleaseHandler(e) {
    let eventData = this.getMouseEventData(e);

    this.turtleStream.write(JSON.stringify({
      'cmd': 'canvasevent',
      'type': `<Button${eventData.button}-ButtonRelease>`,
      'x': eventData.eventX,
      'y': eventData.eventY
    }));
    this.turtleStream.write('\n');
  }

  canvasClickHandler(e) {
    let eventData = this.getMouseEventData(e);

    this.turtleStream.write(JSON.stringify({
      'cmd': 'canvasevent',
      'type': `<Button-${eventData.button}>`,
      'x': eventData.eventX,
      'y': eventData.eventY
    }));
    this.turtleStream.write('\n');
  }

  canvasDragHandler(e) {
    // ToDo:
    // Add handler in mouseclick

    // Remove handler in mouserelease

    // always remove in addCanvasClickHandler
  }

  // ToDo: add click, release and key handlers
  addCanvasClickHandler() {
    this.canvas.removeEventListener('mousedown', this.canvasClickHandler);
    this.canvas.addEventListener('mousedown', this.canvasClickHandler);

    this.canvas.removeEventListener('mouseup', this.canvasReleaseHandler);
    this.canvas.addEventListener('mouseup', this.canvasReleaseHandler);
  }

  /**
   * Create or get a canvas
   */
  getOrCreateCanvas () {
    if (this.canvas == null) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 800;
      this.canvas.height = 600;

      // add a new tab with the turtle canvas
      let index = this.project.addTab('turtle', {item: this});
      this.tab = this.project.tabs[index]; // Get Tab Reference
      this.addCanvasClickHandler();
    }

    return this.canvas;
  }

  onStreamMessage (msg) {
    switch (msg.cmd) {
      case 'turtle':
        this.handleTurtleCommand(msg);
        break;
      case 'turtlebatch':
        this.handleTurtleBatchCommand(msg);
        break;
      case 'debug':
        // ignore (ToDo)
        //this.debugChars.push(msg.char);
        //console.info(this.debugChars.join(''));
        break;
      default:
        console.info('Received unhandled turtle msg', msg.cmd);
    }
  }

  handleTurtleCommand (msg) {
    if (msg.action in this) {
      let result = this[msg.action].apply(this, msg.args);
      this.turtleStream.write(JSON.stringify({cmd: 'result', 'result': result}) + '\n');
    } else {
      this.turtleStream.write(JSON.stringify({cmd: 'exception', exception: 'AttributeError', message: msg.action}) + '\n');
    }

  }

  handleTurtleBatchCommand (msg) {
    for (let i = 0; i < msg.batch.length; i++) {
      let cmd = msg.batch[i];
      this[cmd[0]].apply(this, cmd[1]);
    }
  }

  update() {
    var i, k, canvas, ctx, dx, dy, item, c, length;
    canvas = this.getOrCreateCanvas();
    ctx = canvas.getContext('2d');

    // clear canvas for redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    length = this.items.length;

    dx = canvas.width / 2;
    dy = canvas.height / 2;
    for (i = 0; i < length; i += 1) {
      item = this.items[i];
      c = item.coords;
      switch (item.type) {
        case 'line':
          ctx.beginPath();
          ctx.moveTo(c[0] + dx, c[1] + dy);
          for (k = 2; k < c.length; k += 2) {
            ctx.lineTo(c[k] + dx, c[k + 1] + dy);
          }

          // add some logic to handle pencolor and fillcolor
          if (item.fill && item.fill !== "") {
            ctx.strokeStyle = item.fill;
            ctx.fillStyle = item.fill;
          } else if (item.outline && item.outline !== "") {
            ctx.strokeStyle = item.outline;
          } else if (this.fill) {
            ctx.strokeStyle = this.fill;
          }

          ctx.stroke();
          break;
        case 'polygon':
          ctx.beginPath();
          ctx.moveTo(c[0] + dx, c[1] + dy);
          for (k = 2; k < c.length; k += 2) {
            ctx.lineTo(c[k] + dx, c[k + 1] + dy);
          }
          ctx.closePath();
          if (item.fill !== "") {
            ctx.fillStyle = item.fill;
            ctx.strokeStyle = item.fill;
            ctx.fill();
          }
          ctx.stroke();
          break;
        case 'image':
          // ToDo: Support images here
          break;
        case 'write':
          // ctx write text
          ctx.fillStyle = item.fill;
          ctx.font = `${item.font[2]} ${item.font[1]}px ${item.font[0]}`;
          ctx.textAlign = ANCHOR_LUT[item.anchor];
          ctx.textBaseline = 'middle';
          ctx.fillText(item.text, item.x+dx, item.y+dy);
          break;
      }
    }
  }

  get_width() {
    return this.getOrCreateCanvas().width;
  }

  get_height() {
    return this.getOrCreateCanvas().height;
  }

  delete (item) {
    if (item == 'all') {
      this.items = [];
    } else {
      delete this.items[item];
    }
  }

  create_text (item) {
    this.items.push(item);
    return this.items.length - 1;
  }

  create_image (image) {
    this.items.push({ type: 'image', image: image });
    return this.items.length - 1;
  }

  create_line () {
    this.items.push({
      type: 'line',
      fill: '',
      coords: [0, 0, 0, 0],
      width: 2,
      capstyle: 'round'
    });
    return this.items.length - 1;
  }

  create_polygon () {
    this.items.push({
      type: 'polygon',
      // fill: "" XXX
      // outline: "" XXX
      coords: [0, 0, 0, 0, 0, 0]
    });
    return this.items.length - 1;
  }

  coords (item, coords) {
    if (coords === undefined) {
      return this.items[item].coords;
    }
    this.items[item].coords = coords;
  }

  itemconfigure (item, key, value) {
    this.items[item][key] = value;
  }

  css (key, value) {
    if (value !== undefined) {
      let canvas = this.getOrCreateCanvas();
      canvas.style[key] = value; // tuples of values
    }
  }

  title(title) {
    this.emit('title', title);
  }
}