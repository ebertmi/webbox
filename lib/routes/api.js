'use strict';

/**
 * This file contains all API routes, that provide basic
 * CRUD Operations on Ressources
 */
const Joi = require('joi');
const Api = require('../api/');
import PreHelpers from '../pre/prehelpers';
import genr from '../util/generator-route';

/**
 * API prefix
 */
const API_PREFIX = '/api';

/**
 * Common PreHelper Configuration for all API Routes
 */
const API_PREHELPERS = [
  {
    method: PreHelpers.isAuthenticatedJsonResponse
  }
];

const API_AUTH_CONFIG = {
  mode: 'try',
  strategy: 'session',
  scope: 'admin'
};

/**
 * Common PreHelper Plugin configurations
 */
const API_PLUGINS = {
  'hapi-auth-cookie': {
    redirectTo: false
  },
  'hapi-rate-limit': {
    pathLimit: false,
    userLimit: 500
  }
};

module.exports = [
  {
    method: 'GET',
    path: API_PREFIX + '/users',
    handler: Api.getUsers,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          q: Joi.string().allow('').default('')
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/user/{id}',
    handler: genr(Api.getUser),
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'PUT',
    path: API_PREFIX + '/user/{id}',
    handler: Api.saveUser,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'DELETE',
    path: API_PREFIX + '/user/{id}',
    handler: Api.deleteUser,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/unblockuser/{id}',
    handler: genr(Api.unblockUser),
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/user/{id}/resendconfirmationemail',
    handler: genr(Api.resendConfirmationEmail),
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/user/{id}/confirmuser',
    handler: genr(Api.confirmUser),
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/courses',
    handler: Api.getCourses,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          q: Joi.string().allow('').default('')
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/course/{id}',
    handler: genr(Api.getCourse),
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'PUT',
    path: API_PREFIX + '/course/{id}',
    handler: Api.saveCourse,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'DELETE',
    path: API_PREFIX + '/course/{id}',
    handler: Api.deleteCourse,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/embeds',
    handler: Api.getEmbeds,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          q: Joi.string().allow('').default('')
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/documents',
    handler: Api.getDocuments,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          q: Joi.string().allow('').default('')
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/embed/{id}',
    handler: Api.getEmbed,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().guid().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/logs',
    handler: Api.getLogs,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          q: Joi.string().allow('').default('')
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/log/{id}',
    handler: Api.getLog,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        params: {
          id: Joi.string().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'GET',
    path: API_PREFIX + '/authattempts',
    handler: Api.getAuthAttempts,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10)
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  },  {
    method: 'DELETE',
    path: API_PREFIX + '/authattempts',
    handler: Api.deleteAllAuthAttempts,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  },{
    method: 'GET',
    path: API_PREFIX + '/recyclebin',
    handler: Api.getRecyclebinEntries,
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10)
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  }, {
    method: 'PUT',
    path: API_PREFIX + '/sendmail/',
    handler: genr(Api.sendGeneralMail),
    config: {
      auth: API_AUTH_CONFIG,
      validate: {
        payload: {
          subject: Joi.string().required(),
          message: Joi.string().required(),
          email: Joi.string().email().required()
        }
      },
      plugins: API_PLUGINS,
      pre: API_PREHELPERS
    }
  },
];