import '@babel/polyfill';
import { expect } from 'chai';

import { MODES } from '../common/constants/Embed';
import Project from '../common/models/project/project';
import { StatusBarRegistry, StatusBarItem } from '../common/models/project/status';

const ANONYMOUS_PROJECT_DATA = {
  embed: {
    _creatorId: '17db10e0-5a9c-4a73-9e8c-ec923e5b9326',
    _mode: 'Default',
    assets: [],
    code: {},
    createdAt: '2016-10-20T10:21:28.628Z',
    id: '6564b0bb-2fb9-4c97-8387-7d53f2da38a1',
    lastUpdate: '2016-10-24T11:24:13.248Z',
    meta: {
      embedType: 'skulpt',
      language: 'python3',
      mainFile: 'main.py',
      name: 'Test - Testproject'
    },
    slug: null
  },
  communication: {
    jwt: 'invalid-jsonwebtoken',
    url: 'http://localhost',
    port: '3000'
  },
  user: {

  }
};

const OWNER_PROJECT_DATA = {
  embed: {
    _creatorId: '17db10e0-5a9c-4a73-9e8c-ec923e5b9326',
    _mode: 'Default',
    assets: [],
    code: {},
    createdAt: '2016-10-20T10:21:28.628Z',
    id: '6564b0bb-2fb9-4c97-8387-7d53f2da38a1',
    lastUpdate: '2016-10-24T11:24:13.248Z',
    meta: {
      embedType: 'skulpt',
      language: 'python3',
      mainFile: 'main.py',
      name: 'Test - Testproject'
    },
    slug: null
  },
  communication: {
    jwt: 'invalid-jsonwebtoken',
    url: 'http://localhost',
    port: '3000'
  },
  user: {
    id: '17db10e0-5a9c-4a73-9e8c-ec923e5b9326',
    email: 'owner@owner.com',
    username: 'ownername'
  }
};

const USER_PROJECT_DATA = {
  embed: {
    _creatorId: '23b11e0-5a9c-4b93-1n8c-ba153e5b7438',
    _mode: 'Default',
    assets: [],
    code: {
      'main.py': 'print("owner code")'
    },
    createdAt: '2016-10-20T10:21:28.628Z',
    id: '6564b0bb-2fb9-4c97-8387-7d53f2da38a1',
    lastUpdate: '2016-10-24T11:24:13.248Z',
    meta: {
      embedType: 'skulpt',
      language: 'python3',
      mainFile: 'main.py',
      name: 'Test - Testproject'
    },
    _document: {
      code: {
        'main.py': 'print("user code")'
      }
    },
    slug: null
  },
  communication: {
    jwt: 'invalid-jsonwebtoken',
    url: 'http://localhost',
    port: '3000'
  },
  user: {
    id: '23b11e0-5a9c-4b93-1n8c-ba153e5b7438',
    email: 'user@user.com',
    username: 'username'
  }
};

describe('Project', function () {
  describe('#constructor', function () {
    it('should correctly initialze from the valid project data', function () {

      const project = new Project(ANONYMOUS_PROJECT_DATA);

      expect(project).to.be.an.instanceof(Project);

      // There should be no inconsistencies, no pending saves
      // and loading initial data should not show unsaved changes
      expect(project.isConsistent).to.be.true;
      expect(project.pendingSave).to.be.false;
      expect(project.hasUnsavedChanges).to.be.false;

      // Status
      expect(project.statusBarRegistry).to.be.an.instanceOf(StatusBarRegistry);
      expect(project.status.message).to.be.an.instanceOf(StatusBarItem);
      expect(project.status.hasChanges).to.be.an.instanceOf(StatusBarItem);

      // The mode should be set correctly
      expect(project.mode).to.equal(MODES.Default);
    });

    it('should load the user document code data and not the embed code data', function () {
      const project = new Project(USER_PROJECT_DATA);

      expect(project).to.be.an.instanceof(Project);

      // The mode should be set correctly
      expect(project.mode).to.equal(MODES.Default);

      // We have only 1 file
      let files = project.getFiles().filter(file => file.getName() === 'main.py');
      expect(files.length).to.equal(1);

      let code = files[0].getValue();
      expect(code).to.equal(USER_PROJECT_DATA.embed._document.code['main.py']);
    });
  });
});

/**
 * Test language configurations
 *
 * Test Modes
 *
 * Loading of the code files and the tabs (tabManager)
 */