function toStr(value) {
  return (value === undefined || value === null) ? '' : String(value).trim();
}

function toLayerSize(value) {
  if (typeof value === 'number') {
    return value + 'px';
  }

  return toStr(value);
}

function buildUrl(url, query) {
  const params = Object.keys(query || {})
    .map(function(key) {
      return [key, toStr(query[key])];
    })
    .filter(function(entry) {
      return !!entry[1];
    })
    .map(function(entry) {
      return encodeURIComponent(entry[0]) + '=' + encodeURIComponent(entry[1]);
    })
    .join('&');

  if (!params) {
    return url;
  }

  return url + (url.indexOf('?') === -1 ? '?' : '&') + params;
}

export function createPicker(options = {}) {
  const layer = options.layer;
  const url = toStr(options.url);
  const width = toLayerSize(options.width || 900) || '900px';
  const height = toLayerSize(options.height || 600) || '600px';
  let seed = 0;
  const pending = Object.create(null);

  if (!layer || typeof layer.open !== 'function' || typeof layer.close !== 'function') {
    throw new Error('Layer API is required');
  }

  function settle(requestId, result) {
    const record = pending[requestId];
    if (!record) {
      return;
    }

    delete pending[requestId];

    if (!result.hasValue) {
      if (options.cancelError) {
        record.reject(options.cancelError);
      } else {
        record.resolve(null);
      }
      return;
    }

    try {
      record.resolve(result.value);
    } catch (error) {
      record.reject(error);
    }
  }

  return function framePicker(data) {
    seed += 1;
    const requestId = (options.requestIdPrefix || 'frame-picker-') + seed;

    return new Promise(function(resolve, reject) {
      pending[requestId] = {resolve, reject};

      try {
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
          title: toStr(options.title),
          content: buildUrl(url, {requestId, ...(data?.value || {})}),
          beforeEnd: function(layero, index) {
            let rawResult;
            try {
              rawResult = layer.getChildFrame('#ID_selected_cache', index).attr('data-json');
            } catch (error) {
              delete pending[requestId];
              reject(error);
              return true;
            }

            let hasValue = rawResult !== undefined && rawResult !== null && rawResult !== '';
            settle(requestId, {
              hasValue: hasValue,
              value: hasValue ? JSON.parse(rawResult) : null
            });
            return true;
          },
          end: function() {
            settle(requestId, {hasValue: false});
          }
        });
      } catch (error) {
        delete pending[requestId];
        reject(error);
      }
    });
  };
}

export function installFramePicker(global = window) {
  global.MyCuckoo = Object.assign(global.MyCuckoo || {}, {
    createPicker: createPicker
  });
}
