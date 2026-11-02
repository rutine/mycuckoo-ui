/**
 * 表单渲染组件
 * 依赖：layui（jquery、form、laydate、upload、rate、dropdown、layer）、MyCuckoo
 */
(function (window, layui) {
    if (!layui) {
        console.error('mycuckoo-form.js 依赖 layui');
        return;
    }

    layui.use(['jquery', 'form', 'laydate', 'upload', 'rate', 'dropdown', 'layer'], function () {
        const $ = layui.jquery;
        const form = layui.form;
        const laydate = layui.laydate;
        const upload = layui.upload;
        const rate = layui.rate;
        const dropdown = layui.dropdown;
        const layer = layui.layer;

        // ==================== 内部状态 ====================

        let state = {
            formConfig: [],
            formData: {},
            dataId: null,
            formCode: '',
            bizId: '',
            mode: 'edit',
            loaded: false,
            elem: null,
            formFilter: 'editForm'   // 外部容器的 lay-filter 名称，默认 editForm
        };

        // ==================== 工具函数 ====================

        function parseUrls(val) {
            if (!val) return [];
            if (val.charAt(0) === '[') {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return [];
                }
            }
            return [val];
        }

        function renderUploadTip(item) {
            let tips = [];
            if (item.exts) tips.push('格式：' + item.exts);
            if (item.max) tips.push('大小：不超过 ' + item.max + 'KB');
            if (item.defaultBool) tips.push('可多选');
            return tips.join('，') || '点击上传';
        }

        // ==================== 渲染 ====================

        function renderForm() {
            const isView = state.mode === 'view';
            const $container = $(state.elem);

            if (isView) {
                $container.addClass('view-mode');
            }

            $container.html(renderFields(state.formConfig));
            form.render();
            initUpload(state.formConfig);
            fillData(state.formConfig, state.formData);
            initExtra(state.formConfig);
        }

        function renderFields(fields) {
            let html = '';
            let rowCols = 0;
            let rowHtml = '';

            function flushRow() {
                if (rowHtml) {
                    html += '<div class="layui-row">' + rowHtml + '</div>';
                    rowHtml = '';
                    rowCols = 0;
                }
            }

            fields.forEach(function (item) {
                const col = item.col || 12;
                const colCls = 'layui-col-md' + col;
                if (rowCols + col > 12) flushRow();

                if (item.type === 0) {
                    const inner = renderFields(item.children || []);
                    rowHtml += '<div class="' + colCls + '" style="padding:0 6px 10px;box-sizing:border-box;">' +
                        '<div class="mycuckoo-form-group">' +
                        '<div class="mycuckoo-form-group-title">' + (item.title || '分组') + '</div>' +
                        inner +
                        '</div></div>';
                } else {
                    rowHtml += '<div class="' + colCls + '" style="padding:0 6px 10px;box-sizing:border-box;">' +
                        renderField(item) + '</div>';
                }
                rowCols += col;
                if (rowCols >= 12) flushRow();
            });
            flushRow();
            return html;
        }

        function renderField(item) {
            const isView = state.mode === 'view';
            const required = item.required && !isView ? '<span style="color:red;">*</span>' : '';
            return '<div class="layui-form-item" style="margin-bottom:0;">' +
                '<label class="layui-form-label">' + required + item.title + '</label>' +
                '<div class="layui-input-block">' + renderControl(item) + '</div>' +
                '</div>';
        }

        function renderControl(item) {
            const isView = state.mode === 'view';
            const verify = item.required && !isView ? 'lay-verify="required"' : '';
            const disabled = isView ? 'disabled' : '';
            const readonly = isView ? 'readonly' : '';
            const def = item.defaultValue || '';

            switch (item.type) {
                case 1:
                    return '<input type="text" name="' + item.field + '" class="layui-input" value="' + def + '" placeholder="' + (item.placeholder || '') + '" ' + verify + ' ' + readonly + ' />';
                case 2:
                    return '<textarea name="' + item.field + '" class="layui-textarea" placeholder="' + (item.placeholder || '') + '" ' + verify + ' ' + readonly + '>' + def + '</textarea>';
                case 3:
                    return (item.options || []).map(function (o) {
                        return '<input type="radio" name="' + item.field + '" value="' + o.value + '" title="' + o.name + '" ' + verify + ' ' + disabled + '>';
                    }).join('');
                case 4:
                    return (item.options || []).map(function (o) {
                        return '<input type="checkbox" name="' + item.field + '" value="' + o.value + '" title="' + o.name + '" ' + disabled + '>';
                    }).join('');
                case 5:
                    return '<input type="checkbox" name="' + item.field + '" lay-skin="switch" lay-text="' + (item.defaultValue || '是|否') + '" ' + (item.defaultBool ? 'checked' : '') + ' ' + disabled + '>';
                case 6:
                    return '<select name="' + item.field + '" ' + verify + ' ' + disabled + '>' +
                        '<option value="">' + (item.placeholder || '请选择') + '</option>' +
                        (item.options || []).map(function (o) {
                            return '<option value="' + o.value + '" ' + (String(def) === String(o.value) ? 'selected' : '') + '>' + o.name + '</option>';
                        }).join('') +
                        '</select>';
                case 7:
                    return '<input type="text" name="' + item.field + '" class="layui-input" id="ID_cascader_' + item.field + '" placeholder="' + (item.placeholder || '请选择') + '" readonly />' +
                        '<input type="hidden" name="' + item.field + '_value" value="" />' +
                        '<input type="hidden" name="' + item.field + '_path" value="" />';
                case 8:
                    return '<input type="number" name="' + item.field + '" class="layui-input" value="' + def + '" ' + verify + ' ' + readonly + ' />';
                case 9:
                    return '<input type="number" step="0.01" name="' + item.field + '" class="layui-input" value="' + def + '" ' + verify + ' ' + readonly + ' />';
                case 10:
                case 11:
                    return '<input type="text" name="' + item.field + '" class="layui-input" readonly ' + verify + ' />';
                case 12:
                    return '<input type="text" name="' + item.field + '" class="layui-input" lay-verify="' + (item.required && !isView ? 'required|' : '') + 'phone" ' + readonly + ' />';
                case 13:
                    return '<input type="text" name="' + item.field + '" class="layui-input" lay-verify="' + (item.required && !isView ? 'required|' : '') + 'email" ' + readonly + ' />';
                case 14:
                    return (isView ? '' : '<button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="ID_filePicker' + item.field + '">' +
                            '<i class="layui-icon layui-icon-upload"></i> 选择文件</button>') +
                        '<div id="ID_fileList' + item.field + '" style="margin-top:6px;"></div>' +
                        '<input type="hidden" name="' + item.field + '" value="' + def + '" />' +
                        (isView ? '' : '<div class="mycuckoo-form-tip">' + renderUploadTip(item) + '</div>');
                case 15:
                    return (isView ? '' : '<button type="button" class="layui-btn layui-btn-primary layui-btn-sm" id="ID_filePicker' + item.field + '">' +
                            '<i class="layui-icon layui-icon-upload"></i> 选择图片</button>') +
                        '<div id="ID_fileList' + item.field + '" style="margin-top:6px;"></div>' +
                        '<input type="hidden" name="' + item.field + '" value="' + def + '" />' +
                        (isView ? '' : '<div class="mycuckoo-form-tip">' + renderUploadTip(item) + '</div>');
                case 16:
                    return '<div id="ID_rate_' + item.field + '"></div>' +
                        '<input type="hidden" name="' + item.field + '" value="' + (def || 0) + '" />';
                default:
                    return '<input type="text" name="' + item.field + '" class="layui-input" ' + readonly + ' />';
            }
        }

        // ==================== 上传 ====================

        function initUpload(fields) {
            if (state.mode === 'view') return;
            fields.forEach(function (item) {
                if (item.type === 0) {
                    initUpload(item.children || []);
                } else if (item.type === 14 || item.type === 15) {
                    renderUpload(item);
                }
            });
        }

        function renderUpload(item) {
            const isImage = item.type === 15;
            const $list = $('#ID_fileList' + item.field);
            const $hidden = $('input[name="' + item.field + '"]');

            const val = $hidden.val();
            if (val) {
                renderFileList($list, val, isImage);
            }

            $list.off('click', '.close').on('click', '.close', function () {
                const url = $(this).data('url');
                if (item.defaultBool) {
                    let urls = parseUrls($hidden.val());
                    urls = urls.filter(function (u) { return u !== url; });
                    $hidden.val(JSON.stringify(urls));
                    renderFileList($list, JSON.stringify(urls), isImage);
                } else {
                    $hidden.val('');
                    $list.empty();
                }
            });

            const config = {
                elem: '#ID_filePicker' + item.field,
                url: MyCuckoo.api.fileMgr.url,
                accept: item.accept || (isImage ? 'images' : 'file'),
                data: { type: (isImage ? 'PHOTO' : 'AFFICHE') },
                multiple: item.defaultBool || false,
                done: function (res) {
                    if (res.code === 0) {
                        const url = res.data.url;
                        if (item.defaultBool) {
                            let urls = parseUrls($hidden.val());
                            urls.push(url);
                            $hidden.val(JSON.stringify(urls));
                            renderFileList($list, JSON.stringify(urls), isImage);
                        } else {
                            $hidden.val(url);
                            renderFileList($list, url, isImage);
                        }
                    } else {
                        MyCuckoo.msg({ msg: res.msg || '上传失败' });
                    }
                },
                error: function () {
                    MyCuckoo.msg({ msg: '上传失败' });
                }
            };

            if (item.exts) {
                config.exts = item.exts.split(',').map(function (s) { return s.trim(); });
            }
            if (item.max) {
                config.size = item.max;
            }

            upload.render(config);
        }

        function renderFileList($list, val, isImage) {
            const urls = parseUrls(val);
            if (!urls.length) {
                $list.empty();
                return;
            }

            const html = urls.map(function (url) {
                if (isImage) {
                    return '<div class="mycuckoo-upload-img-item">' +
                        '<img src="' + url + '" />' +
                        (state.mode === 'view' ? '' : '<span class="close" data-url="' + url + '">×</span>') +
                        '</div>';
                } else {
                    return '<div class="mycuckoo-upload-file-item">' +
                        '<i class="layui-icon layui-icon-file"></i> ' + url.split('/').pop() +
                        (state.mode === 'view' ? '' : '<span class="close" data-url="' + url + '">×</span>') +
                        '</div>';
                }
            }).join('');

            $list.html(html);
        }

        // ==================== 其它控件 ====================

        function initExtra(fields) {
            fields.forEach(function (item) {
                if (item.type === 0) {
                    initExtra(item.children || []);
                } else if (item.type === 16) {
                    rate.render({
                        elem: '#ID_rate_' + item.field,
                        value: state.formData[item.field] || 0,
                        max: item.max || 5,
                        half: item.defaultBool || false,
                        text: false,
                        readonly: state.mode === 'view',
                        choose: function (value) {
                            $('input[name="' + item.field + '"]').val(value);
                        }
                    });
                } else if (state.mode === 'view') {
                    return;
                } else if (item.type === 10) {
                    laydate.render({ elem: '[name="' + item.field + '"]', type: 'date' });
                } else if (item.type === 11) {
                    laydate.render({ elem: '[name="' + item.field + '"]', type: 'datetime' });
                } else if (item.type === 7) {
                    renderCascader(item);
                }
            });
        }

        function renderCascader(item) {
            const $input = $('#ID_cascader_' + item.field);
            const data = item.cascaderData || [];

            if (!data.length) {
                $input.attr('placeholder', '未配置级联数据');
                return;
            }

            $input.off('click').on('click', function () {
                showCascaderLevel($input, data, [], item);
            });
        }

        function showCascaderLevel($input, nodes, selectedPath, item) {
            if (!nodes || !nodes.length) return;

            const dropdownData = nodes.map(function (node) {
                const hasChildren = node.children && node.children.length;
                return {
                    id: node.value,
                    title: node.label + (hasChildren ? ' ▸' : ''),
                    node: node
                };
            });

            dropdown.render({
                elem: $input[0],
                data: dropdownData,
                show: true,
                customName: { title: 'title', id: 'id' },
                click: function (obj) {
                    const node = obj.node;
                    const newPath = selectedPath.concat([{ label: node.label, value: node.value }]);

                    if (node.children && node.children.length) {
                        setTimeout(function () {
                            showCascaderLevel($input, node.children, newPath, item);
                        }, 200);
                    } else {
                        const labels = newPath.map(function (p) { return p.label; }).join(' / ');
                        const values = newPath.map(function (p) { return p.value; }).join(',');
                        $input.val(labels);
                        $('input[name="' + item.field + '_value"]').val(values);
                        $('input[name="' + item.field + '_path"]').val(JSON.stringify(newPath));
                    }
                }
            });
        }

        // ==================== 回显 ====================

        function fillData(list, data) {
            list.forEach(function (item) {
                if (item.type === 0) {
                    fillData(item.children || [], data);
                } else {
                    const val = data[item.field];
                    if (val === undefined || val === null) return;

                    if (item.type === 3) {
                        $('[name="' + item.field + '"]').filter('[value="' + val + '"]').prop('checked', true);
                    } else if (item.type === 4) {
                        const $input = $('[name="' + item.field + '"]');
                        $input.prop('checked', false);
                        if (Array.isArray(val)) {
                            val.forEach(function (v) {
                                $input.filter('[value="' + v + '"]').prop('checked', true);
                            });
                        }
                    } else if (item.type === 6) {
                        $('[name="' + item.field + '"]').val(String(val));
                    } else if (item.type === 14 || item.type === 15) {
                        const $hidden = $('input[name="' + item.field + '"]');
                        const $list = $('#ID_fileList' + item.field);
                        const isImage = item.type === 15;
                        $hidden.val(typeof val === 'string' ? val : JSON.stringify(val));
                        renderFileList($list, $hidden.val(), isImage);
                    } else if (item.type === 5) {
                        $('[name="' + item.field + '"]').prop('checked', val === true || val === 'true' || val === 1);
                    } else if (item.type === 16) {
                        $('input[name="' + item.field + '"]').val(val);
                    } else if (item.type === 7) {
                        if (val && typeof val === 'object') {
                            $('[name="' + item.field + '"]').val(val.label || '');
                            $('[name="' + item.field + '_value"]').val(val.value || '');
                            $('[name="' + item.field + '_path"]').val(val.path || '');
                        } else {
                            $('[name="' + item.field + '"]').val(val);
                        }
                    } else {
                        $('[name="' + item.field + '"]').val(val);
                    }
                }
            });
            form.render();
        }

        // ==================== 收集数据 ====================

        function collectData(list, fieldData, result) {
            list.forEach(function (item) {
                if (item.type === 0) {
                    collectData(item.children || [], fieldData, result);
                } else if (item.type === 4) {
                    const vals = [];
                    $('input[name="' + item.field + '"]:checked').each(function () {
                        vals.push($(this).val());
                    });
                    result[item.field] = vals;
                } else if (item.type === 14 || item.type === 15) {
                    const val = $('input[name="' + item.field + '"]').val();
                    result[item.field] = item.defaultBool ? parseUrls(val) : val;
                } else if (item.type === 5) {
                    result[item.field] = $('input[name="' + item.field + '"]').prop('checked');
                } else if (item.type === 16) {
                    result[item.field] = parseInt($('input[name="' + item.field + '"]').val()) || 0;
                } else if (item.type === 7) {
                    result[item.field] = {
                        label: $('[name="' + item.field + '"]').val(),
                        value: $('[name="' + item.field + '_value"]').val(),
                        path: $('[name="' + item.field + '_path"]').val()
                    };
                } else {
                    result[item.field] = fieldData[item.field];
                }
            });
        }

        // ==================== 校验 ====================

        function validate() {
            let valid = true;

            state.formConfig.forEach(function (item) {
                if (item.type === 0) {
                    (item.children || []).forEach(function (child) {
                        if (child.required && state.mode !== 'view') {
                            const val = $('[name="' + child.field + '"]').val();
                            if (!val) {
                                valid = false;
                                layer.msg(child.title + '不能为空', { icon: 2 });
                                return false;
                            }
                        }
                    });
                } else if (item.required && state.mode !== 'view') {
                    const val = $('[name="' + item.field + '"]').val();
                    if (!val) {
                        valid = false;
                        layer.msg(item.title + '不能为空', { icon: 2 });
                        return false;
                    }
                }
            });

            return valid;
        }

        // ==================== 暴露 API ====================

        const FormComponent = {
            /**
             * 渲染表单
             * @param {Object} options
             * @param {string} options.elem 容器选择器
             * @param {string} [options.formFilter] 外部容器的 lay-filter 名称，默认 'editForm'
             * @param {string} options.formCode 表单编码
             * @param {string} [options.bizId] 业务ID
             * @param {string} [options.mode] edit / view
             * @param {Function} [options.onLoaded] 加载完成回调
             */
            render: function (options) {
                state = {
                    formConfig: [],
                    formData: {},
                    dataId: null,
                    formCode: options.formCode || '',
                    bizId: options.bizId || '',
                    mode: options.mode || 'edit',
                    loaded: false,
                    elem: options.elem || '#ID_form_container',
                    formFilter: options.formFilter || 'editForm'
                };

                if (!state.formCode) {
                    layer.msg('缺少 formCode 参数', { icon: 2 });
                    return;
                }

                // 校验：必须存在指定 lay-filter 的 layui-form 容器
                if (!$('.layui-form[lay-filter="' + state.formFilter + '"]').length) {
                    layer.msg('初始化失败：外部缺少 lay-filter="' + state.formFilter + '" 的容器', { icon: 2 });
                    return;
                }

                const action = {
                    url: MyCuckoo.resolve('http://localhost:8080/cms/form/mgr/data/{formCode}?bizId={bizId}', {
                        formCode: state.formCode,
                        bizId: state.bizId
                    }),
                    method: 'get',
                    canAccess: () => true
                };

                $.request(action).then(json => {
                    if (json.code === 0 && json.data) {
                        const vo = json.data;
                        state.formConfig = vo.configs || [];
                        state.formData = vo.data || {};
                        state.dataId = vo.dataId;
                    }
                    state.loaded = true;
                    renderForm();
                    options.onLoaded && options.onLoaded(state);
                });
            },

            /**
             * 收集表单数据（使用 state.formFilter 动态获取）
             */
            collectFormData: function () {
                const data = form.val(state.formFilter);
                const result = {};
                collectData(state.formConfig, data, result);
                return result;
            },

            /**
             * 校验表单
             */
            validateForm: function () {
                return validate();
            },

            /**
             * 保存表单数据
             * @returns {Promise}
             */
            save: function (params = {}) {
                if (!validate()) {
                    return Promise.reject(new Error('校验失败'));
                }

                const data = form.val(state.formFilter);
                const result = {};
                collectData(state.formConfig, data, result);

                const payload = {
                    id: state.dataId,
                    formCode: state.formCode,
                    bizId: state.bizId,
                    data: result,
                    ...params
                };

                const action = {
                    url: MyCuckoo.resolve('http://localhost:8080/cms/form/mgr/data'),
                    method: 'post',
                    canAccess: () => true
                };

                return $.request(action, payload).then(json => {
                    if (json.code === 0 && !state.dataId && json.data) {
                        state.dataId = json.data;
                    }
                    return json;
                });
            },

            getConfig: function () {
                return state.formConfig;
            },

            getData: function () {
                return state.formData;
            },

            getDataId: function () {
                return state.dataId;
            },

            isLoaded: function () {
                return state.loaded;
            }
        };

        // 挂到 MyCuckoo.form 下
        MyCuckoo.form = FormComponent;
    });
})(window, layui);