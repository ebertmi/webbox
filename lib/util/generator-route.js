import co from 'co';

// Wraps generator so it can be used in Hapi Route Handlers
function generoute(generator) {
  return co.wrap(generator);
}

export default generoute;