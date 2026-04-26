function normalizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function normalizeUsers(users) {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .map(function(user) {
      const id = normalizeText(user && (user.id || user.userId || user.account));
      const name = normalizeText(user && (user.name || user.userName || user.account));

      if (!id) {
        return null;
      }

      return {
        id: id,
        name: name || id
      };
    })
    .filter(function(user) {
      return !!user;
    });
}

function buildUrl(url, requestId, draft) {
  const safeDraft = draft || {};
  const params = [
    ['requestId', requestId],
    ['ids', normalizeText(safeDraft.ids)],
    ['names', normalizeText(safeDraft.names)]
  ];
  const query = params
    .filter(function(entry) {
      return !!entry[1];
    })
    .map(function(entry) {
      return encodeURIComponent(entry[0]) + '=' + encodeURIComponent(entry[1]);
    })
    .join('&');

  if (!query) {
    return url;
  }

  return url + (url.indexOf('?') === -1 ? '?' : '&') + query;
}

function toLayerSize(value) {
  if (typeof value === 'number') {
    return value + 'px';
  }

  return normalizeText(value);
}

export function createUserPicker(options = {}) {
  const layer = options.layer;
  const title = normalizeText(options.title) || '选择用户';
  const url = normalizeText(options.url) || './view/uum/userPicker.html';
  const width = toLayerSize(options.width || 960) || '960px';
  const height = toLayerSize(options.height || 640) || '640px';
  let seed = 0;
  const pending = Object.create(null);

  if (!layer || typeof layer.open !== 'function' || typeof layer.close !== 'function') {
    throw new Error('Layer API is required');
  }

  function resolvePending(requestId, users) {
    const record = pending[requestId];

    if (!record) {
      return false;
    }

    delete pending[requestId];
    record.resolve(normalizeUsers(users));
    return true;
  }

  function rejectPending(requestId, error) {
    const record = pending[requestId];

    if (!record) {
      return false;
    }

    delete pending[requestId];
    record.reject(error || new Error('User picker cancelled'));
    return true;
  }

  return function userPicker(draft) {
    seed += 1;

    const requestId = 'modeler-user-picker-' + seed;

    return new Promise(function(resolve, reject) {
      const content = buildUrl(url, requestId, draft);

      layer.open({
        type: 2,
        skin: 'layui-bg-gray',
        area: [width, height],
        fix: true,
        maxmin: false,
        shadeClose: false,
        shade: 0.4,
        resize: false,
        move: false,
        title: title,
        content: content,
        beforeEnd: function(layero, index) {
          const data = layer.getChildFrame('#ID_selected_cache', index).attr('json');
          data ? resolvePending(requestId, JSON.parse(data)) : rejectPending(requestId);
          return true;
        },
        end: function() {
          if (!pending[requestId]) {
            return;
          }

          const record = pending[requestId];
          delete pending[requestId];
          record.reject(new Error('User picker cancelled'));
        }
      });

      pending[requestId] = {
        resolve: resolve,
        reject: reject
      };
    });
  };
}

export function installUserPicker(global = window) {
  global.MyCuckoo = Object.assign(global.MyCuckoo || {}, {
    createUserPicker: createUserPicker
  });
}
