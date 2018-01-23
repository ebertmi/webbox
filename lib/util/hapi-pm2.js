exports.plugin = {
  register: async (server) => {
    process.on('SIGINT', async () => {
      server.log(['info', 'pm2', 'shutdown'], 'stopping hapi...');

      try {
        await server.stop();
      }
      catch (err) {
        console.log(err);
      }

      server.log(['info', 'pm2', 'shutdown'], 'hapi stopped');
      return process.exit(0);
    });
  },
  name: 'hapi-pm2-shutdown',
  version: '0.0.2'
};
