export let usageConsole = {
  log: function (message, messageText, severity) {
    if (severity === 'info') {
      console.info(message, messageText);
    } else if (severity === 'warning') {
      console.warn(message, messageText);
    } else {
      console.error(message, messageText);
    }
  },
  info: function (message, messageText) {
    console.info(message, messageText);
  },
  error: function (message, messageText) {
    console.error(message, messageText);
  },
  warn: function (message, messageText) {
    console.warn(message, messageText);
  }
};
