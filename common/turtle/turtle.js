import { Writable } from 'stream';
//return '{"cmd": "result", "result": "400"}'
export class TurtleMessageConsumer extends Writable {
  constructor(turtle, options) {
    super(options);

    this.turtle = turtle;
  }

  _write (chunk, encoding, callback) {
    let chunkStr = chunk.toString();
    // split chunkStr, as it may contain multiple messages
    let msgs = chunkStr.split('\n');
    for (let i = 0; i < msgs.length; i++) {
      // ignore empty lines
      if ((msgs[i].length === 1 && msgs[i].charCodeAt(0) === 13) || msgs[i].length === 0 || msgs[i] === "" || msgs[i] === ' ' || msgs[i] === '\n') {
        // ToDo: nothing todo here, right?
      } else {
        try {
          let chunkJson = JSON.parse(msgs[i]);

          this.turtle.onStreamMessage(chunkJson);
        } catch (e) {
          console.log(`Invalid json message: "${msgs[i]}"`, e);
        }
      }
    }

    callback();
  }
}

/**
 * Turtle Class for rendering and communicating with the canvas
 */
export class Turtle {
  constructor(fromTurtleStream, toTurtleStream, project) {
    this.project = project;
    this.canvas; // jQuery object
    this.items = [];

    //this.toTurtleStream = toTurtleStream;
    this.toTurtleStream = fromTurtleStream;
    //this.toTurtleStream.setEncoding('utf8');
    this.fromTurtleStream = fromTurtleStream;
    this.fromTurtleStream.pipe(new TurtleMessageConsumer(this), {end: true});

    /*
    var dx, dy, xpos, ypos;
    this.canvas.off('click');
    this.canvas.click(function (e) {
      if (e.eventPhase !== 2) {
        return;
      }
      e.stopPropagation();
      dx = this.width / 2;
      dy = this.height / 2;
      if (e.offsetX == undefined) {
        var offset = canvas.offset();
        xpos = e.pageX - offset.left;
        ypos = e.pageY - offset.top;
      }
      else {
        xpos = e.offsetX;
        ypos = e.offsetY;
      }

      this.toTurtleStream.write(JSON.stringify({
        'cmd': 'canvasevent',
        'type': '<Button-1>',
        'x': xpos - dx,
        'y': ypos - dy
      }));
      this.toTurtleStream.write('\n');
    });
    */
  }

  addCanvasClickHandler() {
    // Todo
  }

  /**
   * Create or get a canvas
   */
  getOrCreateCanvas () {
    if (this.canvas == null) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 400;
      this.canvas.height = 400;

      // add a new tab with the turtle canvas
      this.project.addTab('turtle', {item: this.canvas});
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
        break;
      default:
        console.info('Received unhandled turtle msg', msg.cmd);
    }
  }

  handleTurtleCommand (msg) {
    if (msg.action in this) {
      let result = this[msg.action].apply(this, msg.args);
      this.toTurtleStream.write(JSON.stringify({cmd: 'result', 'result': result}) + '\n');
    } else {
      this.toTurtleStream.write(JSON.stringify({cmd: 'exception', exception: 'AttributeError', message: msg.action}) + '\n');
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
}