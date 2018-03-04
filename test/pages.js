require('babel-register')({
  'presets': ['es2015', 'react'],
  'plugins': ['transform-object-rest-spread']
});

require('babel-polyfill');

const { expect } = require('code');
const Lab = require('lab');
// BDD
const { after, before, describe, it } = exports.lab = Lab.script();

// require server
const webbox = require('../webbox');


describe('basic pages', () => {

  before(async () => {
    await webbox.provision();
  });

  after(async () => {
    await webbox.server.stop();
  });

  it('returns 200 when viewing index without being logged in', async () => {

    const options = {
      method: 'GET',
      url: '/'
    };

    const response = await webbox.server.inject(options);

    expect(response.statusCode).to.equal(200);
  });

  it('returns 302 when viewing profile without being logged in', async () => {

    const options = {
      method: 'GET',
      url: '/profile'
    };

    const response = await webbox.server.inject(options);

    expect(response.statusCode).to.equal(302);
    expect(response.headers.location).to.equal('/login?next=%2Fprofile');
  });

  it('returns 200 when viewing privacy without being logged in', async () => {

    const options = {
      method: 'GET',
      url: '/datenschutz'
    };

    const response = await webbox.server.inject(options);

    expect(response.statusCode).to.equal(200);
  });

  it('returns 200 when viewing imprint without being logged in', async () => {

    const options = {
      method: 'GET',
      url: '/impressum'
    };

    const response = await webbox.server.inject(options);

    expect(response.statusCode).to.equal(200);
  });

  it('returns 302 when viewing admin dashboard without being logged in', async () => {

    const options = {
      method: 'GET',
      url: '/admin'
    };

    const response = await webbox.server.inject(options);

    expect(response.statusCode).to.equal(302);
    expect(response.headers.location).to.equal('/login?next=%2Fadmin');
  });
});
