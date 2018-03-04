export function loadMonaco(context=window, requireConfig) {

  return new Promise((resolve, reject) => {
    // monaco has been already loaded and we can return immediatelly
    if (context.monaco !== undefined) {
      resolve(monaco);
      return;
    }

    const loaderUrl = requireConfig.url || '/vs/loader.js';

    // Callback that tries to load monaco lib, after loader.js has been loaded
    const onGotAmdLoader = () => {
      if (context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__) {
        // Do not use webpack
        if (requireConfig.paths && requireConfig.paths.vs) {
          context.require.config(requireConfig);
        }
      }

      // Load monaco
      context.require(['vs/editor/editor.main'], () => {
        resolve(context.monaco);
      });

      // Call the delayed callbacks when AMD loader has been loaded
      if (context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__) {
        context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__ = false;
        const loaderCallbacks = context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__;
        if (loaderCallbacks && loaderCallbacks.length) {
          let currentCallback = loaderCallbacks.shift();
          while (currentCallback) {
            currentCallback.fn.call(currentCallback.context);
            currentCallback = loaderCallbacks.shift();
          }
        }
      }
    };

    // Load AMD loader if necessary
    if (context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__) {
      // We need to avoid loading multiple loader.js when there are multiple editors loading
      // concurrently, delay to call callbacks except the first one
      // eslint-disable-next-line max-len
      context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__ = context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__ || [];
      context.__REACT_MONACO_EDITOR_LOADER_CALLBACKS__.push({
        context: this,
        fn: onGotAmdLoader
      });
    } else if (typeof context.require === 'undefined') {
      const loaderScript = context.document.createElement('script');
      loaderScript.type = 'text/javascript';
      loaderScript.src = loaderUrl;
      loaderScript.addEventListener('load', onGotAmdLoader);
      context.document.body.appendChild(loaderScript);
      context.__REACT_MONACO_EDITOR_LOADER_ISPENDING__ = true;
    } else {
      onGotAmdLoader();
    }
  });
}

export const BASE_MONACO_REQUIRE_CONFIG = {
  url: '/public/js/vs/loader.js',
  paths: {
    'vs': '/public/js/vs'
  }
};


export function createModel(name, value, language='python', uri) {
  if (value == null) {
    value = '';
  }

  const model = monaco.editor.createModel(value, language);
  model._name = name;

  return model;
}

export function setMode(model, mode='python') {
  moncao.editor.setModelLanguage(model, mode);
}