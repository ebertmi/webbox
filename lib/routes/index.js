'use strict';

/**
 * This file returns all routes
 */

// contains all routing configurations,
// can be extended
let routeConfigurations = [
  './api',
  './base',
  './static',
];

let routes = [];
let route;

// concats all configs to one routing table
for (let config of routeConfigurations) {
  route = require(config);

  routes = routes.concat(route);
}

// exports all routes
module.exports = routes;