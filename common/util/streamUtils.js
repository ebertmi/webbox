import { Transform } from 'stream';

/**
 * Replaces newlines (\n) with \r\n (for term.js)
 */
export class TerminalTransform extends Transform {
  constructor(options) {
    super(options);
  }

  _transform(chunk, encoding, callback) {
    let str = chunk.toString();
    this.push(str.replace(/\n/g, '\r\n'));
    callback();
  }
}

/**
 * Transforms a binary stream into an PNG-Image:
 * 1. STARTIMAGE first 11 Bytes
 * 2. DATA
 * 3. ENDIMAGE last 8 Bytes
 */
export class MatplotLibTransfrom extends Transform {
  constructor(project, options) {
    super(options);

    this.project = project;

    this.imageBuffer = null;
    this.isImageStart = false;
    this.isImageEnd = false;
    this.imageParts = [];
  }

  _transform (chunk, encoding, callback) {
    if (chunk.length >= 8 && chunk.slice(-8).toString() === "ENDIMAGE") {
      this.isImageStart = false;
      this.isImageEnd = false;

      this.imageParts.push(chunk.slice(0, -9));
      console.info('MPLStream: ENDIMAGE %d', chunk.length);

      // must be called after appending the last image part
      this._createImageFromBuffer();
    } else if (chunk.length >= 11 && chunk.slice(-11).toString() === "STARTIMGAGE") {
      this.isImageStart = true;
      this.isImageEnd = false;
      this.imageBuffer = null;

      this.imageParts.push(chunk.slice(11));
      console.info('MPLStream: STARTIMGAGE %d', chunk.length);
    } else {
      this.imageParts.push(chunk);
      console.info('MPLStream: DATA %d', chunk.length);
    }

    callback();
  }

  // Create an internal image blob (stored in the browser ressources) and open tab for displaying
  _createImageFromBuffer () {
    var blob = new Blob(this.imageParts, {type: "image/png"});
    var imgSrc = window.URL.createObjectURL(blob);
    var img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      this.project.addTab('matplotlib', {item: img, active: true});
    };
  }
}