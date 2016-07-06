/**
  Python arduino module for interacting with html5 arduino model. This is not intended
  for real world arduino interaction.

**/
var arduino = arduino || {}; // do not override

arduino.HIGH = 1;
arduino.LOW = 0;
arduino.CHANGE = 2;
arduino.RISING = 3;
arduino.FALLING = 4;
arduino.OUTPUT = 'OUTPUT';
arduino.INPUT = 'INPUT';
arduino.INPUT_PULLUP = 'INPUT_PULLUP';
arduino.OFF = 0;
arduino.ON = 1;

// dictionary object for maintaing references to all arduinos to reset them if programs are rerun
arduino.mapping = {};


arduino.Timer1 = function(ard, period) {
  this.period = period;
  this.arduino = ard;

  // keep array that contains all timeout ids
  if (!this.arduino.board.timer) {
    this.arduino.board.timer = [];
  }
};

arduino.Timer1.prototype.attachInterrupt = function (func) {
  this.func = func;
  this.detachInterrupt();

  this.arduino.board.timer.push(window.setInterval(this.func, this.period));
};

arduino.Timer1.prototype.detachInterrupt = function () {
  var i;
  if (!this.arduino || !this.arduino.board.timer) {
    return; // nothing to do here
  }

  for (i = 0; i < this.arduino.board.timer.length; i++) {
    window.clearInterval(this.arduino.board.timer[i]);
  }
  this.arduino.board.timer = [];
};


/****************/
/*      DHT     */
/****************/
arduino.dht = function(arduino, pin, type) {
  // we identify dht by their wired arduino and its port
  // the python function does already check if those arguments are valid
  this.arduino = arduino;
  //debugger;
  this.pin = pin;
  this.type = type;
};

arduino.dht.prototype.begin = function() {
  this.begin = true;
  this.arduino.board.pinMode(this.pin, arduino.INPUT);
  this.arduino.board.digitalWrite(this.pin, arduino.HIGH);
};

/* helper method to check if pin is connected to our sensor */
arduino.dht.prototype.isPinConnected = function(pin) {
  var nodes;
  var selctorQuery = '#' + this.arduino.board.port + ' .' + (pin.name ? pin.name : ("pin" + pin));

  nodes = document.querySelectorAll(selctorQuery);

  // check for input mode

  return nodes && nodes.length > 0;
};

arduino.dht.prototype.readHumidity = function() {
  // always read zero if begin is not called
  if(this.begin === false) {
    return null;
  }

  // currently we are working with ids in order to get the temp
  var id = "#hum_input_" + this.arduino.board.port;
  var rh = $(id);
  if(rh.length === 0) {
    return null;
  }

  if(this.isPinConnected(this.pin)) {
    // add time check, value changes only every 2 seconds
    // slow sensor
    var millis = new Date().getTime();
    if(this.lastHumidityTime && (millis-2*1000) >= this.lastHumidityTime) {
      this.lastHumidityTime = millis;
      this.oldHumidityValue = rh.val(); // update oldtime
      return this.oldHumidityValue;
    } else if(!this.lastHumidityTime) {
      this.lastHumidityTime = millis;
      this.oldHumidityValue = rh.val(); // update oldtime
      return this.oldHumidityValue;
    } else {
      // 2 seconds have not passed yet, so return old data
      return this.oldHumidityValue;
    }
  } else {
    return null;
  }
};

// ToDo: add noise via random
arduino.dht.prototype.readTemperature = function() {
  // always read zero if begin is not called
  if(this.begin === false) {
    return null;
  }

  var id = "#temp_input_" + this.arduino.board.port;
  var rt = $(id);
  if(rt.length === 0) {
    return null;
  }

  if(this.isPinConnected(this.pin)) {
    // add time check, value changes only every 2 seconds
    // slow sensor
    var millis = new Date().getTime();
    if(this.lastTempTime && (millis-2*1000) >= this.lastTempTime) {
      this.lastTempTime = millis;
      this.oldTempValue = rt.val(); // update oldtime
      return this.oldTempValue;
    } else if(!this.lastTempTime) {
      this.lastTempTime = millis;
      this.oldTempValue = rt.val(); // update oldtime
      return this.oldTempValue;
    } else {
      // 2 seconds have not passed yet, so return old data
      return this.oldTempValue;
    }
  } else {
    return null;
  }
};

/***************/
/* Arduino Uno */
/***************/
arduino.uno = function (resetID, onID, lID, txID) {
  this.timeoutID = undefined;
  this.status = arduino.OFF;
  this.actions = {};
  this.actions.reset = document.getElementById(resetID);
  this.actions.on = document.getElementById(onID);
  this.actions.onChange = []; // list of external event handlers for value changes
  this.int0 = undefined; // digital pin 2
  this.int1 = undefined; // digital pin 3
  this.interrupts = true; // enabled by default http://arduino.cc/en/pmwiki.php?n=Reference/Interrupts
  this.port = undefined;

  // setup io map
  this.io = {};
  this.io.ledON = {
    'pin': undefined,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LEDON'
  };
  this.io.ledTX = {
    'pin': undefined,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LEDTX'
  };
  this.io.ledRX = {
    'pin': undefined,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LEDRX'
  };
  this.io.pin0 = {
    'pin': 0,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'RX'
  };
  this.io.pin1 = {
    'pin': 1,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'TX'
  };
  this.io.pin2 = {
    'pin': 2,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'INT0'
  };
  this.io.pin3 = {
    'pin': 3,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'INT1'
  };
  this.io.pin4 = {
    'pin': 4,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin5 = {
    'pin': 5,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin6 = {
    'pin': 6,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin7 = {
    'pin': 7,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin8 = {
    'pin': 8,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin9 = {
    'pin': 9,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'PWM'
  };
  this.io.pin10 = {
    'pin': 10,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'PWM'
  };
  this.io.pin11 = {
    'pin': 11,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'PWM'
  };
  this.io.pin12 = {
    'pin': 12,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin13 = {
    'pin': 13,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LED'
  };
  this.io.gnd = {
    'pin': 'gnd',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'GND'
  };
  this.io.vcc = {
    'pin': 'vcc',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'VCC'
  };
  this.io.analog0 = {
    'pin': '14',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'analog0'
  };
  this.io.analog1 = {
    'pin': '15',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'analog1'
  };
  this.io.analog2 = {
    'pin': '16',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'analog2'
  };
  this.io.analog3 = {
    'pin': '17',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'analog3'
  };
  this.io.analog4 = {
    'pin': '18',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'analog4'
  };
  this.io.analog5 = {
    'pin': '19',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'analog5'
  };

  // mapping of all digital pins
  this.io.digital = [this.io.pin0, this.io.pin1, this.io.pin2, this.io.pin3,
    this.io.pin4, this.io.pin5, this.io.pin6, this.io.pin7, this.io.pin8, this.io
    .pin9, this.io.pin10, this.io.pin11, this.io.pin12, this.io.pin13, this.io.analog0,
    this.io.analog1, this.io.analog2, this.io.analog3,
    this.io.analog4, this.io.analog5
  ];

  // mapping of all analog pins
  this.io.analog = [this.io.analog0, this.io.analog1, this.io.analog2, this.io
    .analog3,
    this.io.analog4, this.io.analog5
  ];
};

/**
  Actives the interrupts for the arduino
**/
arduino.uno.prototype.interrupts = function () {
  this.interrupts = true;
};

/**
  Deactives the interrupts for the arduino
**/
arduino.uno.prototype.noInterrupts = function () {
  this.interrupts = false;
};

arduino.uno.prototype.setStatus = function (status) {
  // only set valid status
  if (status !== undefined && (status === arduino.OFF || status === arduino.ON)) {
    this.status = status;
    this.digitalWrite(this.io.ledON, status); // LED control
  }
};

/**
    Returns value for given pin, should be used in callbacks and not as public
    arduino API
**/
arduino.uno.prototype._getPinValue = function (pin) {
  // is there a leading pin?
  if (typeof pin === 'string' && pin.indexOf('pin') === 0) {
    pin = pin.replace(/pin/g, '');
  }

  var io_index = this._pin(pin);

  if (io_index == null) {
    return null;
  }

  return this.io.digital[io_index].value; // current value for specified pin
};

arduino.uno.prototype.digitalRead = function (pin) {
  return this._getPinValue(pin);
};

/**
  Adds an eventlistener that will be triggered on pin writing changes
**/
arduino.uno.prototype.addonChange = function (callback) {
  if (callback) {
    return this.actions.onChange.push(callback) - 1; // return index
  }
};

arduino.uno.prototype.onReset = function (callback) {
  this.actions.reset.addEventListener('click', callback, false);
};

arduino.uno.prototype.onOn = function (callback) {
  this.actions.on.addEventListener('click', callback, false);
};

/**
    interrupt:  die Nummer des Interrupts (int)
    function :  die Funktion, die aufgerufen wird, wenn ein Interrupt
                eintrifft; diese Funktion darf keine Parameter und auch keine
                R�ckgaben enthalten.
    mode     :  definiert wann genau der Interrupt eingeleitet werden soll. Vier
                Konstanten sind bereits als zul�ssige Werte vordefiniert worden.

**/
arduino.uno.prototype.attachInterrupt = function (interrupt, func, mode) {
  var interrupt_object = {
    'func': func,
    'mode': mode
  };

  // handle case for int0 and int1
  if ('INT0' === interrupt.toUpperCase()) {
    this.int0 = interrupt_object;
  } else if ('INT1' === interrupt.toUpperCase()) {
    this.int1 = interrupt_object;
  }
};

arduino.uno.prototype.detachInterrupt = function (interrupt) {
  // handle case for int0 and int1
  if ('INT0' === interrupt.toUpperCase() || interrupt === 0) {
    this.int0 = undefined;
  } else if ('INT1' === interrupt.toUpperCase() || interrupt === 1) {
    this.int1 = undefined;
  }
};

arduino.uno.prototype.pinMode = function (pin, mode) {
  if (!mode || !(mode === arduino.INPUT || mode === arduino.OUTPUT ||
    arduino.INPUT_PULLUP)) {
    throw new Error('Unallowed mode: ' + mode); // return if no value specified
  }

  if (pin < 0 || pin > this.io.digital.length) {
    throw new Error('Cannot write to specified pin -> not existing.');
  }

  this.io.digital[pin].pinmode = mode;
};

arduino.uno.prototype._pin = function (pin) {
  // analog pins are mapped to 14-19 inside the io.digital array
  var _int = parseInt(pin);
  if (!isNaN(_int)) {
    pin = _int;
  }

  switch (pin) {
  case 0:
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
  case 6:
  case 7:
  case 8:
  case 9:
  case 10:
  case 11:
  case 12:
  case 13:
    return pin;
  case 14:
  case 'a0':
    return 14;
  case 15:
  case 'a1':
    return 15;
  case 'a2':
  case 16:
    return 16;
  case 'a3':
  case 17:
    return 17;
  case 'a4':
  case 18:
    return 18;
  case 'a5':
  case 19:
    return 19;
  default:
    return null;
  }
};

arduino.uno.prototype.digitalWrite = function (pin, value) {
  var susp;
  var that = this;
  if (!(value === arduino.HIGH || value === arduino.LOW)) {
    throw new Sk.builtin.ValueError('Value is neither HIGH nor LOW.'); // return if no value specified
  }

  // get pin object
  var io;
  if (typeof pin === 'string' || typeof pin === 'number') {
    if (!isNaN(pin) && (pin < 0 || pin > this.io.digital.length)) {
      throw new Sk.builtin.ValueError(
        'Cannot write to specified pin -> not existing.');
    }
    pin = this._pin(pin);
    io = this.io.digital[pin];
  } else if (pin.value !== undefined && pin.pinmode !== undefined) {
    io = pin; // got pin object, value, mode, name
  } else {
    throw new Sk.builtin.ValueError(
      'Cannot write to specified pin -> not existing.');
  }

  var old_value = io.value;

  // ToDo: do we really need this?
  // are we allowed to write?
  if (io.pinmode === arduino.OUTPUT) {
    susp = new Sk.misceval.Suspension();
    susp.resume = function() {
      if("error" in susp.data) {
        throw new Sk.builtin.Exception(susp.data.error.message);
      }
    };
    susp.data = {
      type: "Sk.promise",
      promise: new Promise(function(resolve, reject) {
          io.value = value;

          // trigger callbacks
          if (old_value !== io.value) {
            var i;
            for (i = 0; i < that.actions.onChange.length; i++) {
              that.actions.onChange[i].call(that, io, pin);
            }
          }
          resolve();
      })
    };

    return susp;
  }
};

/**
    Not part of the original arduino function set, however needed to simulate
    external write operations on the pins and trigger interrupt routines
**/
arduino.uno.prototype.externalDigitalWrite = function (pin, value, ignorePinmode) {
  if (!(value === arduino.HIGH || value === arduino.LOW)) {
    throw new Error('Value is neither HIGH nor LOW.'); // return if no value specified
  }

  if (pin < 0 || pin > this.io.digital.length) {
    throw new Error('Cannot write to specified pin -> not existing.');
  }

  ignorePinmode = ignorePinmode || false;
  var io = this.io.digital[pin]; // get pin object

  // only check pinMode if required, some calls just change the value
  // while simulation a button press and therefore are set to input
  if (!ignorePinmode && io.pinmode === arduino.OUTPUT) {
    throw new Error('Pinmode for pin: ' + pin + ' is set to OUTPUT.');
  }

  var that = this;
  var old_value = io.value;
  io.value = value; // set value

  // check mode
  var isChange = old_value != value;
  var isLow = value === arduino.LOW;
  var isHigh = value === arduino.HIGH;
  var isFalling = old_value === arduino.HIGH && value === arduino.LOW;
  var isRising = old_value === arduino.LOW && value === arduino.HIGH;

  // check if we need to trigger interrupt
  function triggerInterrupt(interrupt, change, low, high, falling, rising) {
    if (!interrupt) return;
    // check mode
    if ((interrupt.mode = arduino.CHANGE && change) || (interrupt.mode =
      arduino.LOW && low) || (interrupt.mode = arduino.HIGH && high) || (
      interrupt.mode = arduino.FALLING && falling) || (interrupt.mode =
      arduino.RISING && rising)) {

      susp = new Sk.misceval.Suspension();
      susp.resume = function() {
        if("error" in susp.data) {
          throw new Sk.builtin.Exception(susp.data.error.message);
        }
      };
      susp.data = {
        type: "Sk.promise",
        promise: new Promise(function(resolve, reject) {
          // trigger it
          interrupt.func.call(that);
          resolve();
        })
      };

    return susp;
    }
  }

  if (this.interrupts) {
    triggerInterrupt(this.int0, isChange, isLow, isHigh, isFalling, isRising);
    triggerInterrupt(this.int1, isChange, isLow, isHigh, isFalling, isRising);
  }
};


/*********************/
/* Arduino Mega Rev3 */
/*********************/
arduino.mega = function (resetID, onID, lID, txID) {
  this.timeoutID = undefined;
  this.status = arduino.OFF;
  this.actions = {};
  this.actions.reset = document.getElementById(resetID);
  this.actions.on = document.getElementById(onID);
  this.actions.onChange = []; // list of external event handlers for value changes
  this.int0 = undefined; // digital pin 2
  this.int1 = undefined; // digital pin 3
  this.interrupts = true;
  this.port = undefined;

  // setup io map
  this.io = {};
  this.io.ledON = {
    'pin': undefined,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LEDON'
  };
  this.io.ledTX = {
    'pin': undefined,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LEDTX'
  };
  this.io.ledRX = {
    'pin': undefined,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LEDRX'
  };
  this.io.pin0 = {
    'pin': 0,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'RX'
  };
  this.io.pin1 = {
    'pin': 1,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'TX'
  };
  this.io.pin2 = {
    'pin': 2,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'INT0'
  };
  this.io.pin3 = {
    'pin': 3,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'INT1'
  };
  this.io.pin4 = {
    'pin': 4,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin5 = {
    'pin': 5,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin6 = {
    'pin': 6,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin7 = {
    'pin': 7,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin8 = {
    'pin': 8,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin9 = {
    'pin': 9,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'PWM'
  };
  this.io.pin10 = {
    'pin': 10,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'PWM'
  };
  this.io.pin11 = {
    'pin': 11,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'PWM'
  };
  this.io.pin12 = {
    'pin': 12,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': undefined
  };
  this.io.pin13 = {
    'pin': 13,
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'LED'
  };

  this.io.pin14 = {
  	'pin': '14',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin15 = {
  	'pin': '15',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin16 = {
  	'pin': '16',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin17 = {
  	'pin': '17',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin18 = {
  	'pin': '18',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin19 = {
  	'pin': '19',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin20 = {
  	'pin': '20',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin21 = {
  	'pin': '21',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin22 = {
  	'pin': '22',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin23 = {
  	'pin': '23',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin24 = {
  	'pin': '24',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin25 = {
  	'pin': '25',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin26 = {
  	'pin': '26',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin27 = {
  	'pin': '27',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin28 = {
  	'pin': '28',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin29 = {
  	'pin': '29',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin30 = {
  	'pin': '30',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin31 = {
  	'pin': '31',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin32 = {
  	'pin': '32',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin33 = {
  	'pin': '33',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin34 = {
  	'pin': '34',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin35 = {
  	'pin': '35',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin36 = {
  	'pin': '36',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin37 = {
  	'pin': '37',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin38 = {
  	'pin': '38',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin39 = {
  	'pin': '39',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin40 = {
  	'pin': '40',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin41 = {
  	'pin': '41',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin42 = {
  	'pin': '42',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin43 = {
  	'pin': '43',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin44 = {
  	'pin': '44',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin45 = {
  	'pin': '45',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin46 = {
  	'pin': '46',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin47 = {
  	'pin': '47',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin48 = {
  	'pin': '48',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin49 = {
  	'pin': '49',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin50 = {
  	'pin': '50',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin51 = {
  	'pin': '51',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin52 = {
  	'pin': '52',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.pin53 = {
  	'pin': '53',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': undefined
  };

  this.io.gnd = {
    'pin': 'gnd',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'GND'
  };

  this.io.vcc = {
    'pin': 'vcc',
    'value': 0,
    'pinmode': arduino.OUTPUT,
    'name': 'VCC'
  };

  this.io.analog0 = {
  	'pin': '54',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog0'
  };

  this.io.analog1 = {
  	'pin': '55',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog1'
  };

  this.io.analog2 = {
  	'pin': '56',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog2'
  };

  this.io.analog3 = {
  	'pin': '57',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog3'
  };

  this.io.analog4 = {
  	'pin': '58',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog4'
  };

  this.io.analog5 = {
  	'pin': '59',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog5'
  };

  this.io.analog6 = {
  	'pin': '60',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog6'
  };

  this.io.analog7 = {
  	'pin': '61',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog7'
  };

  this.io.analog8 = {
  	'pin': '62',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog8'
  };

  this.io.analog9 = {
  	'pin': '63',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog9'
  };

  this.io.analog10 = {
  	'pin': '64',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog10'
  };

  this.io.analog11 = {
  	'pin': '65',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog11'
  };

  this.io.analog12 = {
  	'pin': '66',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog12'
  };

  this.io.analog13 = {
  	'pin': '67',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog13'
  };

  this.io.analog14 = {
  	'pin': '68',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog14'
  };

  this.io.analog15 = {
  	'pin': '69',
  	'value': 0,
  	'pinmode': arduino.OUTPUT,
  	'name': 'analog15'
  };


  // mapping of all analog pins
  this.io.analog = [];
  for(var i = 0; i <= 15; i++) {
    this.io.analog.push(this.io["analog" + i]);
  }

  // mapping of all digital pins
  this.io.digital = [];
  for(var j = 0; j <= 53; j++) {
    this.io.digital.push(this.io["pin" + j]);
  }
  this.io.digital = this.io.digital.concat(this.io.analog);
};

/* inheritance code right here */
arduino.mega.prototype = Object.create(arduino.uno.prototype);

/**
    Returns value for given pin, should be used in callbacks and not as public
    arduino API
**/
arduino.mega.prototype._getPinValue = function (pin) {
  // is there a leading pin?
  if (typeof pin === 'string' && pin.indexOf('pin') === 0) {
    pin = pin.replace(/pin/g, '');
  }

  var io_index = this._pin(pin);

  if (io_index == null) {
    return null;
  }

  return this.io.digital[io_index].value; // current value for specified pin
};

arduino.mega.prototype.digitalRead = function (pin) {
  return this._getPinValue(pin);
};


// needs to be overriden
/**
 * Pin-Mapping of the code to the pin object.
 */
arduino.mega.prototype._pin = function (pin) {
  // analog pins start at index 54 in the digital io array
  var _int = parseInt(pin);
  if (!isNaN(_int)) {
    pin = _int;
  }

  if (pin >= 0 && pin <= 53) {
    return pin;
  }

  switch (pin) {
  case 54:
  case 'a0':
    return 54;
  case 55:
  case 'a1':
    return 55;
  case 'a2':
  case 56:
    return 56;
  case 'a3':
  case 57:
    return 57;
  case 'a4':
  case 58:
    return 58;
  case 'a5':
  case 59:
    return 59;
  case 'a6':
  case 60:
  	return 60;
  case 'a7':
  case 61:
  	return 61;
  case 'a8':
  case 62:
  	return 62;
  case 'a9':
  case 63:
  	return 63;
  case 'a10':
  case 64:
  	return 64;
  case 'a11':
  case 65:
  	return 65;
  case 'a12':
  case 66:
  	return 66;
  case 'a13':
  case 67:
  	return 67;
  case 'a14':
  case 68:
  	return 68;
  case 'a15':
  case 69:
  	return 69;
  default:
    return null;
  }
};


// helper functions that fixes IE svg classList issues
arduino.getClassList = function (element) {
  if (typeof element.classList === 'undefined') {
    var arr = (element.className instanceof SVGAnimatedString ? element.className
      .baseVal : element.className)
      .split(/\s+/);
    if ('' === arr[0]) {
      arr.pop();
    }
    return arr;
  } else {
    return element.classList;
  }
};

/* end of arduino api */

/*
  ToDo: we need a hook for plugging in the various arduino examples, each regged com port
  has a special callback function handling the specific example stuff
*/
var $builtinmodule = function (name) {
  var mod = {};

  // html ids of the buttons
  mod.arduino_reset = new Sk.builtin.str('arduino_reset'); // should be overridable
  mod.arduino_on = new Sk.builtin.str('arduino_on'); // dito
  mod.HIGH = new Sk.builtin.int_(arduino.HIGH);
  mod.LOW = new Sk.builtin.int_(arduino.LOW);
  mod.INPUT = new Sk.builtin.str(arduino.INPUT);
  mod.INPUT_PULLUP = new Sk.builtin.str(arduino.INPUT_PULLUP);
  mod.OUTPUT = new Sk.builtin.str(arduino.OUTPUT);
  mod.CHANGE = new Sk.builtin.str(arduino.CHANGE);
  mod.CHANGE = new Sk.builtin.str(arduino.CHANGE);
  mod.FALLING = new Sk.builtin.str(arduino.FALLING);

  var timeoutID = []; // collection of timeoutIDs

  function write_callback(io, pin) {
    var nodes;
    var selctorQuery = '#' + this.port + ' .' + (pin.name ? pin.name : ("pin" + pin));

    nodes = document.querySelectorAll(selctorQuery);

    if (!nodes || nodes.length <= 0) {
      console.log("Specified pin is not connected: " + pin.name);
      return;
    }

    var visibility = "hidden";

    if (io.value) {
      visibility = "visible";
    }

    var i;
    var classlist;
    for (i = 0; i < nodes.length; i++) {
      // fix for IE that does not have and classList attribute on svg elements
      classlist = arduino.getClassList(nodes[i]);
      if (classlist.length === 1) {
        nodes[i].setAttribute("visibility", visibility);
      }
    }
  }

  /*
   * internal helper method, that clears timeouts and clears the pins, and resets
   * the internal model of the arduino
   */
  function resetAll(ard) {
    var i;
    for (i = 0; i < timeoutID.length; i++) {
      window.clearTimeout(timeoutID[i]);
    }
    timeoutID = [];

    // detach any interrupts
    if(ard.board.timer) {
      for (i = 0; i < ard.board.timer.length; i++) {
        window.clearInterval(ard.board.timer[i]);
      }
      ard.board.timer = [];
    }

    // ToDo: must be changed for mega
    for (i = 0; i <= 13; i++) {
      ard.board.digitalWrite(i, arduino.LOW);
    }

    ard.board.setStatus(arduino.OFF);
    //Sk.execLimit = 0; // execution limit set to 0 will stop asy
  }

  var CLASS_ARDUINO = 'Arduino';
  var CLASS_TIMER = "Timer1";
  var CLASS_DHT = "dht";

  var timer_f = function ($gbl, $loc) {
    var init_f = function (self, ardu, timeout) {
      Sk.builtin.pyCheckArgs('__init__', arguments, 3, 3);

      if (Sk.abstr.typeName(ardu) !== CLASS_ARDUINO) {
        throw new Sk.builtin.ValueError('dht requires arduino object');
      }

      if (!Sk.builtin.checkNumber(timeout)) {
        throw new Sk.builtin.TypeError(
          'argument timeout must be a numeric type');
      }

      var _timeout = Sk.ffi.remapToJs(timeout);
      var _arduino = ardu.v; // custom unmapping

      self.v = new arduino.Timer1(_arduino, _timeout);
      // detach previous interrupt, if any

      self.v.detachInterrupt();
    };
    $loc.__init__ = new Sk.builtin.func(init_f);

    var attach_f = function (self, func) {
      Sk.builtin.pyCheckArgs('attachInterrupt', arguments, 2, 2);
      if (!Sk.builtin.checkFunction(func)) {
        throw new Sk.builtin.TypeError('func must be a function type');
      }

      // go, attaches interrupt and sets interval
      var callback = function () {
        Sk.misceval.callsimAsync(null, func).then(function success(r) {}, function failure(e) {});
      };
      self.v.attachInterrupt(callback); // call internal attachInterrupt method
    };
    $loc.attachInterrupt = new Sk.builtin.func(attach_f);
  };

  mod[CLASS_TIMER] = Sk.misceval.buildClass(mod, timer_f,
    CLASS_TIMER, []);

  /****************************/
  /*          DHT Class       */
  /****************************/
  var dht_f = function($gbl, $loc) {
    var init_f = function(self, ard, pin, type) {
      Sk.builtin.pyCheckArgs('__init__', arguments, 4, 4);
      if (Sk.abstr.typeName(ard) !== CLASS_ARDUINO) {
        throw new Sk.builtin.ValueError('dht requires arduino object');
      }

      if(!Sk.builtin.checkInt(pin)) {
        throw new Sk.builtin.TypeError("argument 'pin' must be of type 'int'");
      }

      var _pin = Sk.ffi.remapToJs(pin);

      if(!Sk.builtin.checkString(type)) {
        throw new Sk.builtin.TypeError("argument 'type' must be of type 'int'");
      }

      var _type = Sk.ffi.remapToJs(type);

      self.v = new arduino.dht(ard.v, _pin, _type);
    };

    init_f.co_varnames = ['arduino', 'pin', 'type'];
    $loc.__init__ = new Sk.builtin.func(init_f);

    /* to be consistent with dht.c lib */
    $loc.begin = new Sk.builtin.func(function(self){
        Sk.builtin.pyCheckArgs('begin', arguments, 1, 1);
        self.v.begin();
    });

    /* either return valid float or nan */
    $loc.readHumidity = new Sk.builtin.func(function(self){
        Sk.builtin.pyCheckArgs('readHumidity', arguments, 1, 1);
        var hum = self.v.readHumidity();

        if(hum === null || hum === undefined) {
          return Sk.builtin.float_(new Sk.builtin.str("nan"));
        } else {
          return new Sk.builtin.float_(hum);
        }
    });

    /* either return valid float or nan */
    $loc.readTemperature = new Sk.builtin.func(function(self){
        Sk.builtin.pyCheckArgs('readTemperature', arguments, 1, 1);
        var temp = self.v.readTemperature();

        if(temp === null || temp === undefined) {
          return Sk.builtin.float_(new Sk.builtin.str("nan"));
        } else {
          return new Sk.builtin.float_(temp);
        }
    });
  };

  mod[CLASS_DHT] = Sk.misceval.buildClass(mod, dht_f,
    CLASS_DHT, []);


  var arduino_f = function ($gbl, $loc) {
    var init_f = function (self, baud, port, timeout, sr) {
      Sk.builtin.pyCheckArgs('__init__', arguments, 3, 5);
      // ignore the actual arguments, due to the fact that we do not establish
      // a real connection to an hardware device
      var _port = Sk.ffi.remapToJs(port);
      var _reset = Sk.ffi.remapToJs(mod.arduino_reset) + "_" + _port;
      var _on = Sk.ffi.remapToJs(mod.arduino_on) + "_" + _port;
      var arduinoJS = {};

      // get the class used on the svg in order to determine the board type
      var $board = $("#" + _port);

      if ($board.length === 0) {
        throw new Sk.builtin.ValueError("Cannot connect to specified port.");
      }

      var isArduinoMega = $board.hasClass("mega");

      if (isArduinoMega) {
        arduinoJS.board = new arduino.mega(_reset, _on);
      } else {
        arduinoJS.board = new arduino.uno(_reset, _on);
      }
      arduinoJS.board.port = _port;

      self.v = arduinoJS;

      // we store the arduino instance in the Sk-space for external access
      if (_port in arduino.mapping) {
        // reset previous arduino instance and proceed
        // add dict for com4 ports and arduino objects
        resetAll(arduino.mapping[_port]);
      }
      arduino.mapping[_port] = self.v;

      self.tp$name = CLASS_ARDUINO; // set class name

      // add 'write' callback that toggles the visibility for items with exactly
      // one html class value (pin specifier)
      self.v.board.addonChange(write_callback);

      self.v.board.actions.reset.addEventListener('click', function () {
        resetAll(self.v);
      }, false);

      // check for external hooks
      if(typeof Sk.customArduinoCallback === "function") {
          // register custom change callback
          self.v.board.addonChange(Sk.customArduinoCallback);
      }

      if(typeof Sk.customArduinoInit === "function") {
          // call custom initialization
          Sk.customArduinoInit.call(undefined, self.v.board);
      }
    };

    init_f.co_varnames = ['baud', 'port', 'timeout', 'sr'];
    init_f.$defaults = [new Sk.builtin.int_(9600), Sk.builtin.none.none$,
      new Sk.builtin.int_(2), Sk.builtin.none.none$];
    $loc.__init__ = new Sk.builtin.func(init_f);

    $loc.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

    $loc.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;

    $loc.interrupts = new Sk.builtin.func(function (self) {
      Sk.builtin.pyCheckArgs('interrupts', arguments, 1, 1);

      // first unwrap arduino board object
      var arduinoJS = self.v;

      arduinoJS.board.interrupts();
    });

    $loc.noInterrupts = new Sk.builtin.func(function (self) {
      Sk.builtin.pyCheckArgs('noInterrupts', arguments, 1, 1);
      // first unwrap arduino board object
      var arduinoJS = self.v;

      arduinoJS.board.noInterrupts();
    });

    $loc.setStatus = new Sk.builtin.func(function (self, status) {
      Sk.builtin.pyCheckArgs('setStatus', arguments, 2, 2);

      // first unwrap arduino board object
      var arduinoJS = self.v;
      var _status = Sk.remapToJs(status);

      if (!_status || (_status !== arduino.OFF && _status !== arduino.ON)) {
        throw new Sk.builtin.ValueError('status must be either ON or OFF');
      }

      arduinoJS.board.setStatus(Sk.remapToJs(status));
    });

    $loc.attachInterrupt = new Sk.builtin.func(function (self, interrupt,
      func, mode) {
      Sk.builtin.pyCheckArgs('attachInterrupt', arguments, 4, 4);

      // ToDo: check if mode is one of the 4 predefined values, FALLING; RASING,...

      // first unwrap arduino board object
      var arduinoJS = self.v;
      //debugger;
      var _interrupt = Sk.ffi.remapToJs(interrupt);
      var _mode = Sk.ffi.remapToJs(mode);

      arduinoJS.board.attachInterrupt(_interrupt, func, _mode);
    });

    $loc.detachInterrupt = new Sk.builtin.func(function (self, interrupt) {
      Sk.builtin.pyCheckArgs('detachInterrupt', arguments, 2, 2);
      // first unwrap arduino board object
      var arduinoJS = self.v;
      var _interrupt = Sk.ffi.remapToJs(interrupt);

      arduinoJS.board.detachInterrupt(_interrupt);
    });

    $loc.pinMode = new Sk.builtin.func(function (self, pin, mode) {
      Sk.builtin.pyCheckArgs('pinMode', arguments, 3, 3);

      // first unwrap arduino board object
      var arduinoJS = self.v;
      var _pin = Sk.ffi.remapToJs(pin);
      var _mode = Sk.ffi.remapToJs(mode);

      arduinoJS.board.pinMode(_pin, _mode);
    });

    $loc.digitalWrite = new Sk.builtin.func(function (self, pin, value) {
      Sk.builtin.pyCheckArgs('digitalWrite', arguments, 3, 3);

      if (!Sk.builtin.checkNumber(pin) && !Sk.builtin.checkString(pin)) {
        throw new Sk.builtin.TypeError(
          "argument pin must be a 'int' or 'string' type");
      }

      if (!Sk.builtin.checkNumber(value)) {
        throw new Sk.builtin.TypeError(
          "argument value must be a 'int' type");
      }

      // first unwrap arduino board object
      var arduinoJS = self.v;
      var _pin = Sk.ffi.remapToJs(pin);
      var _value = Sk.ffi.remapToJs(value);

      // we add a small timeout
      var susp = new Sk.misceval.Suspension();
      susp.resume = function() { return Sk.builtin.none.none$; };
      susp.data = {type: "Sk.promise", promise: new Promise(function(resolve){
          if (typeof setTimeout === "undefined") {
              // We can't sleep (eg test environment), so resume immediately
              arduinoJS.board.digitalWrite(_pin, _value);
              resolve();
          } else {
              arduinoJS.board.digitalWrite(_pin, _value);
              setTimeout(resolve, 10); // wait 10 ms for each write
          }
      })};

      return susp;
    });

    $loc.digitalRead = new Sk.builtin.func(function (self, pin) {
      Sk.builtin.pyCheckArgs('digitalRead', arguments, 2, 2);
      // first unwrap arduino board object
      // ToDo: add check for valid pin numbers or pin names
      var arduinoJS = self.v;
      var _pin = Sk.ffi.remapToJs(pin);

      // we add a small timeout
      var susp = new Sk.misceval.Suspension();
      susp.resume = function() {
        return susp.data.result;
      };
      susp.data = {
        type: "Sk.promise",
        promise: new Promise(function(resolve) {
          if (typeof setTimeout === "undefined") {
              // We can't sleep (eg test environment), so resume immediately
              var vv_js = arduinoJS.board.digitalRead(_pin);
              if (vv_js == null) {
                throw new Sk.builtin.ValueError('invalid pin');
              }
              resolve(Sk.ffi.remapToPy(vv_js));
          } else {
              setTimeout(function(){
                resolve(Sk.ffi.remapToPy(arduinoJS.board.digitalRead(_pin)));
              }, 10); // wait 10 ms for each write
          }
        }),
      };

      return susp;
    });
  };

  mod[CLASS_ARDUINO] = Sk.misceval.buildClass(mod, arduino_f,
    CLASS_ARDUINO, []);

  function write_ledmatrix(io, pin) {
    // we have to determine the when we are allowed to 'light' and when to
    // turn the leds off
    /* col1, ..., col6
      -------------
      | | | | | | |
      -------------
      | | | | | | |
      -------------
      | | | | | | |
      -------------
    */
    //debugger;
    if (isNaN(pin) || pin < 0 || pin > 19) { //|| cols.indexOf(pin) === -1) {
      return;
    }

    var nodes;
    var pin_classname = pin.name ? pin.name : ("pin" + pin);

    nodes = document.getElementsByClassName(pin_classname);

    // iterate over all nodes and check if we can turn on or off
    var sibling_index;
    var fill;
    var sibling_value;
    var i;

    function classname_map(x) {
      return x.indexOf(pin_classname, x.length - pin_classname.length) === -
        1;
    }

    for (i = 0; i < nodes.length; i++) {
      // 1. get other pin index for specified
      fill = '#fafafa';
      var siblings = Array.prototype.filter.call(arduino.getClassList(nodes[i]),
        classname_map);
      if (siblings.length > 0) {
        sibling_value = this._getPinValue(siblings[0]);
        // HIGH value on col and HIGH on row
        if (io.value === arduino.HIGH && sibling_value === arduino.HIGH) {
          fill = 'lime';
        }
        nodes[i].setAttribute("fill", fill);
      }
    }
  }
  mod.ledMatrix = new Sk.builtin.func(function (ard) {
    Sk.builtin.pyCheckArgs('ledMatrix', arguments, 1, 1);
    if (Sk.abstr.typeName(ard) !== CLASS_ARDUINO) {
      throw new Sk.builtin.ValueError('ledMatrix needs arduino object');
    }

    ard.v.board.addonChange(write_ledmatrix);
  });

  /**
   * delay function that accepts milliseconds
   */
  mod.delay = new Sk.builtin.func(function (delay) {
    Sk.builtin.pyCheckArgs('delay', arguments, 1, 1);

    if(!Sk.builtin.checkInt(delay)) {
      throw new Sk.builtin.TypeError("argument 'delay' must be of type 'int'");
    }

    var _delay = Sk.ffi.remapToJs(delay);

    if (_delay < 10) {
      _delay = 10;
    }

    var susp = new Sk.misceval.Suspension();
        susp.resume = function() { return Sk.builtin.none.none$; };
        susp.data = {type: "Sk.promise", promise: new Promise(function(resolve) {
            if (typeof setTimeout === "undefined") {
                // We can't sleep (eg test environment), so resume immediately
                resolve();
            } else {
                setTimeout(resolve, _delay);
            }
        })};
        return susp;
  });

  mod.disableExecutionLimit = new Sk.builtin.func(function () {
    Sk.builtin.pyCheckArgs('disableExecutionLimit', arguments, 0, 0);

    Sk.execLimit = Number.POSITIVE_INFINITY;

    return Sk.builtin.none.none$;
  });

  mod.enableExecutionLimit = new Sk.builtin.func(function () {
    Sk.builtin.pyCheckArgs('enableExecutionLimit', arguments, 0, 0);

    Sk.execLimit = 30 * 1000; // 30 secs

    return Sk.builtin.none.none$;
  });

  return mod;
};
