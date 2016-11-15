/*
 * SPA page management
 *
 * @author Okabe
 */
var spa_page_transition = (function () {
    'use strict';
    var
        initModule, addAction, addEvent, prepareActivation, spaLogger, getLogger,
        DATA_BIND_EVENT = {};

    /**
     * Add action
     * @param action_id: compulsory
     * @param next_page_cls: compulsory
     * @param main_proc: compulsory, Must return jQuery.Deferred().resolve(action).promise() only when using post_proc.
     * @param post_proc: optional
     */
    addAction = function (action_id, next_page_cls, main_proc, post_proc) {
        spa_page_transition.model.addAction(action_id, next_page_cls, main_proc, post_proc);
    };

    addEvent = function (event_id) {
        DATA_BIND_EVENT[event_id] = null;
    };

    prepareActivation = function (dfd_activation) {
        spa_page_transition.shell.prepareActivation(dfd_activation);
    };

    getLogger = function () {
        return spaLogger;
    };

    initModule = function ($container, is_debug_mode) {
        spaLogger = spa_log.createLogger(is_debug_mode, 'SPA.LOG ');
        spa_page_transition.model.initModule();
        spa_page_transition.shell.initModule($container);
        spa_data_bind.initModule();
    };

    /**
     * Object.create polyfill
     */
    if (!Object.create) {
        Object.create = function (o) {
            if (arguments.length > 1) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }
            function F() {
            }

            F.prototype = o;
            return new F();
        };
    }

    return {
        initModule: initModule,
        addAction: addAction,
        addEvent: addEvent,
        prepareActivation: prepareActivation,
        getLogger: getLogger,
        DATA_BIND_EVENT: DATA_BIND_EVENT,
    };
}());


spa_page_transition.shell = (function () {
    'use strict';
    var
        $errorDetailMessage,
        anchorGetter, bindView,
        dfdActivation, prepareActivation,
        execAction, renderPage, renderErrorPage, doRenderPage,
        initModule;

    anchorGetter = (function () {
        var
            createAnchorMap, createSelfAnchorMap, createBindAnchorMap;

        createAnchorMap = function ($el, attr_action_id, attr_action_params) {
            var
                str_params, params, params_bind,
                anchor_map = {};

            //action_id
            anchor_map['action'] = $el.attr(attr_action_id);

            //params
            str_params = $el.attr(attr_action_params);

            if (str_params) {
                params = createSelfAnchorMap(str_params);
                params_bind = createBindAnchorMap($el, str_params);
                $.extend(params, params_bind);

                $.each(params, function (key, value) {
                    anchor_map[key] = value;
                });
            }

            return anchor_map;
        };

        createSelfAnchorMap = function (str_params) {
            var
                pattern, matched_str_list,
                result = '';

            pattern = /[a-zA-Z0-9]+=[a-zA-Z0-9]+/g;
            matched_str_list = str_params.match(pattern) || [];

            $.each(matched_str_list, function (idx, matched_str) {
                result += matched_str.replace(pattern, function (target) {
                    var
                        key_val_list = target.split('=');

                    return '"' + key_val_list[0] + '":"' + key_val_list[1] + '"';
                });
                result += idx < matched_str_list.length - 1 ? ',' : '';
            });

            return JSON.parse('{' + result + '}');
        };

        createBindAnchorMap = function ($el, str_params) {
            var
                pattern, matched_str_list,
                result = {};

            pattern = /\$(name|id)\.[a-zA-Z0-9]+\.data\-action\-[a-zA-Z0-9]+\-params/g;
            matched_str_list = str_params.match(pattern) || [];

            $.each(matched_str_list, function (idx, matched_str) {
                var
                    elements, type, selector, attr_name, bind_str_param, $bind_el;

                elements = matched_str.split('\.');

                if (!elements || elements.length != 3) {
                    throw new Error('bindAnchor.format.illegal. ' + matched_str);
                }

                type = elements[0];
                selector = elements[1];
                attr_name = elements[2];
                $bind_el = $('input[name="' + selector + '"]:checked');

                if (!$bind_el) {
                    throw new Error('bindAnchor.bind.element.null. ' + $bind_el);
                }

                bind_str_param = $bind_el.attr(attr_name);

                if (!bind_str_param) {
                    throw new Error('bindAnchor.bind.param.null. ' + bind_str_param);
                }

                $.extend(result, createSelfAnchorMap(bind_str_param));
            });
            return result;
        };

        return {
            createAnchorMap: createAnchorMap,
            //VisibleForTesting
            createSelfAnchorMap: createSelfAnchorMap,
        }
    })();

    execAction = function (anchor_map) {
        spa_page_transition.model.execAction(anchor_map).then(function (data) {
            renderPage(data);
        }, function (data) {
            renderErrorPage(data.callback_data);
        });
    };

    renderPage = function (data) {
        if (!data.action) {
            throw new Error('actionProto should not be null');
        }
        doRenderPage(data.action.nextPageCls);
    };

    renderErrorPage = function (message) {
        console.error(message);
        if ($errorDetailMessage) {
            $errorDetailMessage.append(message);
            doRenderPage('spa-error');
        }
    };

    doRenderPage = function (pageCls) {
        var
            $show_target_page = $('.' + pageCls),
            $current_page = $(".spa-page:visible"),
            all_matched = $current_page.length > 0 ? true : false;

        $current_page.each(function (idx, el) {
            all_matched &= $(el).hasClass(pageCls);
        });

        if (all_matched) {
            return;
        }

        if (!$show_target_page.hasClass('modal')) {
            $('.spa-page').removeClass('visible');
        }

        $show_target_page.addClass('visible');

        if ($show_target_page.hasClass('spa-scroll-top')) {
            $('body, html').animate({scrollTop: 0}, 100, 'linear');
        }
    };

    prepareActivation = function (dfd_activation) {
        dfdActivation = dfd_activation;
    };

    initModule = function ($container) {
        $(window).on('hashchange', function () {
            execAction($.uriAnchor.makeAnchorMap());
        });

        if ($container) {
            $errorDetailMessage = $container.find('#error-detail-message');
        }

        $('*[data-action-click-id]').on('click', function (e) {
            $.uriAnchor.setAnchor(anchorGetter.createAnchorMap($(this), 'data-action-click-id', 'data-action-click-params'));
        });

        $('*[data-action-change-id]').on('change', function (e) {
            $.uriAnchor.setAnchor(anchorGetter.createAnchorMap($(this), 'data-action-change-id', 'data-action-change-params'));
        });

        $('*[data-action-click-dbupdate-id]').on('click', function (e) {
            $(this).addClass('spa-update-btn-disabled');
            execAction(anchorGetter.createAnchorMap($(this), 'data-action-click-dbupdate-id', 'data-action-click-dbupdate-params'));
            history.pushState(null, null, location.pathname);
            window.addEventListener("popstate", function () {
                history.pushState(null, null, location.pathname);
            });
        });

        $.when(dfdActivation).then(function (data) {
            spa_page_transition.getLogger().debug('SPA starts.');
            $(window).trigger('hashchange');
        })
    };

    return {
        prepareActivation: prepareActivation,
        renderErrorPage: renderErrorPage,
        initModule: initModule,
        //VisibleForTesting
        anchorGetter: anchorGetter,
        bindView: bindView,
    };
}());

spa_page_transition.model = (function () {
    'use strict';
    var
        actionProto, actionFactory,
        addAction, findAction, execAction,
        initModule,
        actionList = [];

    /**
     * Action prototype
     * @type {{execMainProc: actionProto.execMainProc}}
     */
    actionProto = {
        execMainProc: function (params) {
            var
                dfd = $.Deferred(),
                main_proc_res,
                this_action = this;

            if (this.hasOwnProperty('preProc')) {
                this.preProc();
            }
            if (this.hasOwnProperty('mainProc')) {
                main_proc_res = this.mainProc(params);
            }
            $.when(main_proc_res).then(function (data) {
                dfd.resolve({action: this_action, callback_data: data});
            }, function (data) {
                dfd.reject({action: this_action, callback_data: data});
            });

            return dfd.promise();
        }
    };

    /**
     * Create actionProto
     * @param action_id: compulsory
     * @param next_page_cls: compulsory
     * @param main_proc: optional
     * @param post_proc: optional
     * @returns {actionProto|*}
     */
    actionFactory = function (action_id, next_page_cls, main_proc, pre_proc) {
        var
            action = Object.create(actionProto);

        action.actionId = action_id;
        action.nextPageCls = next_page_cls;
        if (pre_proc) {
            action.preProc = pre_proc;
        }
        if (main_proc) {
            action.mainProc = main_proc;
        }
        return action;
    };

    findAction = function (action_id) {
        var result;

        action_id = !action_id ? 'initialize' : action_id;
        result = actionList.filter(function (obj, idx) {
            return obj.actionId === action_id
        })[0];
        if (!result) {
            throw new Error('no action... action_id=' + action_id);
        }
        return result;
    };

    execAction = function (anchor_map) {
        var
            result,
            action = findAction(anchor_map['action']);
        try {
            result = action.execMainProc(anchor_map);
        } catch (e) {
            result = $.Deferred().reject({'callback_data': e}).promise();
        }
        return result;
    };

    addAction = function (action_id, next_page_cls, main_proc, pre_proc) {
        actionList.push(actionFactory(action_id, next_page_cls, main_proc, pre_proc));
    };

    initModule = function () {
    };

    return {
        addAction: addAction,
        execAction: execAction,
        initModule: initModule,
    };
}());


var spa_page_data = (function () {
    'use strict';
    var
        serverAccessor, doAccessServer;

    /**
     * The callback function should return data.spa_status === 'succeeded'
     * @param filePath: Url of server
     * @param send_params: Parameters for send to server
     * @param succeeded_func
     * @param failed_func
     * @returns {*<T>|*}
     */
    doAccessServer = function (filePath, send_params, succeeded_func, failed_func) {
        var
            dfd = $.Deferred();

        serverAccessor(filePath, send_params).done(function (data) {
            succeeded_func(data);
            dfd.resolve();
        }).fail(function (XMLHttpRequest, textStatus, errorThrown) {
            if (errorThrown) {
                console.error(errorThrown.message);
            }
            if (failed_func) {
                failed_func(XMLHttpRequest);
            } else {
                spa_page_transition.shell.renderErrorPage(XMLHttpRequest.message);
            }
            dfd.reject('Connection error occurred.');
        });

        return dfd.promise();
    };

    serverAccessor = function (filePath, data) {
        var
            dfd = $.Deferred();

        $.ajax({
            url: filePath,
            type: 'get',
            data: data,
            dataType: 'json',
            success: dfd.resolve,
            error: dfd.reject
        });

        return dfd.promise();
    };

    return {
        doAccessServer: doAccessServer,
        serverAccessor: serverAccessor,
    };
}());

var spa_log = (function () {
    'use strict';
    var
        loggerProto, createLogger;

    loggerProto = {
        isDebugMode: true,
        logPrefix: '',
        debug: function () {
            var
                log, i, is_left, is_right, is_last,
                result = '';

            if (arguments.length < 1) {
                console.error('No arguments...')
                return;
            }
            if (!this.isDebugMode) {
                return;
            }

            result += this.logPrefix + ' ';

            for (i = 0; i < arguments.length; i++) {
                is_last = (i === arguments.length - 1);
                is_right = (i % 2 === 1);

                log = (is_right ? ' = ' : '');
                log += arguments[i] instanceof Object ? JSON.stringify(arguments[i], null, '\t') : arguments[i];
                log += (is_right && !is_last ? ', ' : '');

                result += log;
            }

            console.log(result);
        }
    };

    createLogger = function (is_debug_mode, log_prefix) {
        var logger = Object.create(loggerProto);
        logger.isDebugMode = is_debug_mode;
        logger.logPrefix = log_prefix || '';
        return logger;
    };

    return {
        createLogger: createLogger,
    }
})();

var spa_data_bind = (function () {
    'use strict';
    var
        ENUM_TOGGLE_ACTION_TYPE = {ADD: 'ADD', REMOVE: 'REMOVE', TOGGLE: 'TOGGLE'},
        BIND_ATTR_REPLACED = 'data-bind-replaced',
        evt_data_bind_view,
        initModule;

    evt_data_bind_view = (function () {
        var
            init_bind_prop_map, _create_bind_prop_map, _bind_prop_map,
            get_all_prop_map,
            settle_bind_val, _extract_val, _get_bind_val, _format_bind_val,
            each_attr_type, each_attr_type_selectors,

            create_loop_element, _do_find_loop_element, _clone_loop_children, _replace_cloned_element_attr,

            get_toggle_class_list,

            BIND_ATTR_TYPES = ['id', 'text', 'html', 'val', 'loop'];

        init_bind_prop_map = function (key, data) {
            $('[' + BIND_ATTR_REPLACED + ']').each(function (idx, el) {
                $(el).remove();
            })
            _bind_prop_map = {};
            _create_bind_prop_map(key, data);
            return this;
        };

        _create_bind_prop_map = function (whole_key, data) {
            if (!whole_key) {
                throw new Error('key should not be null:' + key);
            }
            if (!(data instanceof Object)) {
                throw new Error('data should be a map');
            }

            $.each(data, function (data_key, data_val) {
                var new_key = whole_key + "." + data_key;

                if (data_val instanceof Array) {
                    $.each(data_val, function (ary_idx, ary_val) {
                        _create_bind_prop_map(new_key + '$' + ary_idx, ary_val);
                    });
                } else if (data_val instanceof Object) {
                    _create_bind_prop_map(new_key, data_val);
                } else {
                    _bind_prop_map[new_key] = data_val;
                }
            });
        };

        get_all_prop_map = function () {
            return _bind_prop_map;
        };

        _extract_val = function (data, key) {
            var
                val,
                keys = key.split('\$');

            val = keys.length > 1 ? data[keys[0]][keys[1]] : data[key];
            return val;
        };

        /**
         *
         * @param data
         * @param key: This is split and keys[0] is entity, keys[1..n] is property of the entity.
         * @returns {*}
         * @private
         */
        _get_bind_val = function (data, key) {
            var
                i, val, pure_key,
                keys = key.split('\.');

            if (keys.length < 2) {
                throw new Error('key should be like "entity.prop" but actual key = ' + key);
            }
            val = _extract_val(data, keys[1]);
            for (i = 2; i < keys.length; i++) {
                val = _extract_val(val, keys[i]);
            }
            return val;
        };

        _format_bind_val = function (data, prop_key, bind_format) {
            var
                val = _get_bind_val(data, prop_key);

            if (!bind_format) {
                return val;
            }
            if (bind_format === 'number') {
                val = val.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
            } else if (bind_format === 'date') {
            } else {
                console.error('Invalid bind_format:' + bind_format)
            }
            return val;
        };

        settle_bind_val = function ($el, attr, data, prop_key) {
            var
                format = $el.attr('data-bind-format'),
                val = _format_bind_val(data, prop_key, format);

            if (attr === 'text') {
                $el.text(val);
            } else if (attr === 'html') {
                $el.html(val);
            } else if (attr === 'val') {
                $el.val(val);
            } else {
                $el.attr(attr, val);
            }
            $el.show();
        };

        each_attr_type = function (func) {
            $.each(BIND_ATTR_TYPES, function (idx, el) {
                func('data-bind-' + el, el);
            });
        };

        each_attr_type_selectors = function () {
            var result = '';
            $.each(BIND_ATTR_TYPES, function (idx, el) {
                result += (idx > 0 ? ',' : '') + '[data-bind-' + el + ']';
            });
            return result;
        };

        /**
         * @param parent, should not be loop element.
         */
        create_loop_element = function (parent, data, key) {
            $(parent).children().each(function (idx, el) {
                _do_find_loop_element(el, data, key);
            });
        };

        _do_find_loop_element = function (el, data, key) {
            var
                cloned_children,
                loop_prop_key = $(el).attr('data-bind-loop');

            if (loop_prop_key && loop_prop_key.indexOf(key) === 0) {
                cloned_children = _clone_loop_children(el, loop_prop_key, data);
                $.each(cloned_children, function (idx, el_cloned_child) {
                    _do_find_loop_element(el_cloned_child, data, key);
                });
            } else if ($(el).children()) {
                create_loop_element(el, data, key);
            }
        };

        _clone_loop_children = function (el, loop_prop_key, data) {
            var
                i, $el_cloned,
                list = _get_bind_val(data, loop_prop_key),
                cloned_elements = [], clone_target_elements = [],
                bind_attr_type_selectors = each_attr_type_selectors();

            for (i = 0; i < list.length; i++) {
                $(el).children().each(function (idx, el_child) {
                    $el_cloned = $(el_child).clone(true);
                    _replace_cloned_element_attr($el_cloned, loop_prop_key, i);
                    $el_cloned.find(bind_attr_type_selectors).each(function (idx, el_cloned_child) {
                        _replace_cloned_element_attr($(el_cloned_child), loop_prop_key, i);
                    });
                    cloned_elements.push($el_cloned);
                    clone_target_elements.push($(el_child));
                });
            }

            $.each(cloned_elements, function (idx, $el_child) {
                $(el).append($el_child);
            });
            $.each(clone_target_elements, function (idx, $el_child) {
                $el_child.hide();
            });

            return cloned_elements;
        };

        _replace_cloned_element_attr = function ($el, loop_prop_key, i) {
            each_attr_type(function (bind_attr_type, attr_type) {
                var
                    bind_attr = $el.attr(bind_attr_type);

                if (bind_attr) {
                    $el.attr(bind_attr_type, bind_attr.replace(loop_prop_key, loop_prop_key + '$' + i));
                    $el.attr(BIND_ATTR_REPLACED, true);
                }
            });
        };

        /**
         * get_toggle_class_list
         * @param trigger_key : Ex) 'cancel-confirm'
         * @param has_trigger_status : True if trigger's input type is checkbox or radio
         * @param trigger_status_on : True if the trigger is 'checked' or 'selected'
         * @param data_bind_toggle_class : Ex) 'cancel-confirm, btn_disable:inverse, btn-enable'
         * @returns A list of the pair of toggleActionType and toggleClass. If not matched, returns an empty list.
         */
        get_toggle_class_list = function (trigger_key, has_trigger_status, trigger_status_on, data_bind_toggle_attr) {
            var
                key_cls_list, cls_list,
                result = [];

            if (!trigger_key || !data_bind_toggle_attr) {
                throw new Error('trigger_key:' + trigger_key + ', data_bind_toggle_attr:' + data_bind_toggle_attr);
            }

            key_cls_list = data_bind_toggle_attr.replace(/\s+/g, '').split(',');
            if (key_cls_list.length < 2) {
                throw new Error('key_cls_list:' + key_cls_list);
            }

            if (trigger_key !== key_cls_list[0]) {
                return [];
            }

            cls_list = key_cls_list.slice(1);
            $.each(cls_list, function (idx, obj) {
                var
                    cls_inverse, len, toggle_class, toggle_action_type, status_on, inverse;

                cls_inverse = obj.split(':');
                len = cls_inverse.length;
                if (len != 1 && len != 2) {
                    throw new Error('cls_inverse(obj):' + obj);
                }

                toggle_class = cls_inverse[0];
                status_on = trigger_status_on ? 1 : -1;
                inverse = len > 1 && cls_inverse[1] === 'inverse' ? 1 : -1;
                toggle_action_type = !has_trigger_status ? ENUM_TOGGLE_ACTION_TYPE.TOGGLE
                    : (status_on * inverse > 0 ? ENUM_TOGGLE_ACTION_TYPE.REMOVE : ENUM_TOGGLE_ACTION_TYPE.ADD);
                result.push({'toggle_action_type': toggle_action_type, 'toggle_class': toggle_class});
            });
            return result;
        };

        return {
            init_bind_prop_map: init_bind_prop_map,
            get_all_prop_map: get_all_prop_map,
            settle_bind_val: settle_bind_val,
            each_attr_type: each_attr_type,
            create_loop_element: create_loop_element,
            each_attr_type_selectors: each_attr_type_selectors,
            get_toggle_class_list: get_toggle_class_list,

            //VisibleForTesting
            _get_bind_val: _get_bind_val,
        }
    })();

    initModule = function () {
        $.each(Object.keys(spa_page_transition.DATA_BIND_EVENT), function (idx_evt, key) {
            $(spa_page_transition.DATA_BIND_EVENT).on(key, function (e, data) {
                var
                    bind_props, all_props, bind_attr_type_selectors;

                if (!data) {
                    return true;
                }

                bind_props = evt_data_bind_view.init_bind_prop_map(key, data);
                all_props = bind_props.get_all_prop_map();
                bind_attr_type_selectors = evt_data_bind_view.each_attr_type_selectors();

                evt_data_bind_view.create_loop_element($('body'), data, key);

                $(bind_attr_type_selectors).each(function (idx_bind, obj) {
                    var
                        el_prop_key,
                        $this = $(this);

                    evt_data_bind_view.each_attr_type(function (bind_attr, attr) {
                        el_prop_key = $this.attr(bind_attr);
                        if (!el_prop_key) {
                            return true;
                        }
                        if (all_props[el_prop_key]) {
                            evt_data_bind_view.settle_bind_val($this, attr, data, el_prop_key);
                        } else if (!$this.attr('data-bind-loop')) {
                            $this.hide();
                        }
                    });
                });

                $('[data-bind-show-if],[data-bind-show-id]').each(function (idx, el) {
                    var
                        pure_attr, obj_key_cond_list, obj_key_list, cond, val;

                    if (!data) {
                        $(el).hide();
                        console.warn('data-bind-show-if.data is null');
                        return true;
                    }

                    pure_attr = $(el).attr('data-bind-show-if') ? $(el).attr('data-bind-show-if') : $(el).attr('data-bind-show-id');
                    if (!pure_attr) {
                        return true;
                    }

                    obj_key_cond_list = pure_attr.split('=');
                    obj_key_list = obj_key_cond_list[0].split('\.');
                    if (obj_key_cond_list.length > 1) {
                        cond = obj_key_cond_list[1];
                    }

                    if (obj_key_list && obj_key_list[0] === key) {
                        val = data[obj_key_list[1]];
                        if (!val) {
                            $(el).hide();
                        } else if (cond && cond !== val) {
                            $(el).hide();
                        } else {
                            $(el).show();
                        }
                    }
                });
            });
        });

        $('[data-view-toggle-trigger]').on('click', function (e_toggle) {
            var
                trigger_key = $(this).attr('data-view-toggle-trigger'),
                has_trigger_status = $(this).prop('type') === 'checkbox' || $(this).prop('type') === 'radio',
                trigger_status_on = has_trigger_status && ($(this).prop('checked') || $(this).prop('selected'));

            $('[data-view-toggle-class]').each(function (idx, el) {
                var
                    toggle_class_list,
                    data_bind_toggle_attr = $(this).attr('data-view-toggle-class');

                toggle_class_list = evt_data_bind_view.get_toggle_class_list(
                    trigger_key, has_trigger_status, trigger_status_on, data_bind_toggle_attr);

                $.each(toggle_class_list, function (idx, obj) {
                    if (obj.toggle_action_type === ENUM_TOGGLE_ACTION_TYPE.TOGGLE) {
                        $(el).toggleClass(obj.toggle_class);
                    } else if (obj.toggle_action_type === ENUM_TOGGLE_ACTION_TYPE.ADD) {
                        $(el).addClass(obj.toggle_class);
                    } else if (obj.toggle_action_type === ENUM_TOGGLE_ACTION_TYPE.REMOVE) {
                        $(el).removeClass(obj.toggle_class);
                    }
                });
            });

            if (trigger_key && trigger_key.indexOf('toggle-slide-next') === 0) {
                $(this).next('.toggle-slide-next-target').slideToggle();
            }
        });

        $('[data-view-toggle-trigger="toggle-slide-next:on"]').trigger('click');
    };

    return {
        evt_data_bind_view: evt_data_bind_view,
        initModule: initModule,
        //VisibleForTesting
        ENUM_TOGGLE_ACTION_TYPE: ENUM_TOGGLE_ACTION_TYPE,
    }
})();


var spa_page_transition2 = (function () {
    'use strict';
    var
        addAction, initModule, spaLogger, getLogger,
        createFunc, createDfdFunc, setMainFunc,
        initialize, action, run;


    spaLogger = spa_log.createLogger(true, 'SPA2 ');
    getLogger = function () {
        return spaLogger;
    };

    addAction = function (action_id, func_list) {
        return spa_page_transition2.model.addAction(action_id, func_list);
    };
    createFunc = function (trigger_keys) {
        return spa_function.createFunc.apply(this, arguments);
    };
    createDfdFunc = function (trigger_keys) {
        return spa_function.createDfdFunc.apply(this, arguments);
    };
    setMainFunc = function (_main_func) {
        return spa_function.setMainFunc(_main_func);
    };
    initModule = function () {
        spa_page_transition2.model.initModule();
    };

    initialize = function () {
        return spa_page_transition2.model.initialize();
    };
    action = function () {
        return spa_page_transition2.model.addAction();
    };
    run = function () {
        spa_page_transition2.model.run();
    };

    return {
        getLogger: getLogger,
        addAction: addAction,
        createFunc: createFunc,
        createDfdFunc: createDfdFunc,
        setMainFunc: setMainFunc,
        initModule: initModule,
    }
})();

spa_page_transition2.shell = (function () {
    'use strict';
    var
        execAction, renderPage, renderErrorPage;

    execAction = function (anchor_map) {
        spa_page_transition2.model.execAction(anchor_map).then(function (data) {
            renderPage(data);
        }, function (data) {
            if (data && data.stays) {
                return;
            } else {
                // renderErrorPage(data.callback_data);
                renderErrorPage();
            }
        });
    };

    renderPage = function (data) {
        console.log('### result ### Page rendered!')
    };

    renderErrorPage = function (data) {
        console.log('### result ### Error page rendered!')
    };

    return {
        execAction: execAction,
    }
})();

spa_page_transition2.model = (function () {
    'use strict';
    var
        addAction, protoAction, execAction, execFunc,
        initializeFunc, setInitializeFunc,
        actionList = [],

        initModule,
        initialize, run;

    initModule = function () {
        $.each(Object.keys(spa_page_transition.DATA_BIND_EVENT), function (idx_evt, key) {
            $(spa_page_transition.DATA_BIND_EVENT).on(key, function (e, data) {
                // console.log('model.receive.trigger.key=' + key + ', data=' + data + ', evt.keys=' + slist);
            });
        });
    };
    initialize = function () {
        actionList = [];
        return this;
    };
    run = function () {
        initModule();
    };

    protoAction = {};

    addAction = function (action_id, func_list) {
        var
            action = Object.create(protoAction);

        action.actionId = action_id;
        action.funcList = func_list;
        actionList.push(action);
        return this;
    };

    execAction = function (action_id) {
        var
            i = 0,
            promise = $.Deferred().resolve().promise(),
            action = findAction(action_id);

        return execFunc(action.funcList, promise, i);
    };

    execFunc = function (func_list, promise, idx) {
        promise.then(function (data) {
            promise = func_list[idx].execute();
            if (++idx < func_list.length) {
                promise = execFunc(func_list, promise, idx);
            }
            return promise;
        }, function (data) {
            return $.Deferred().reject(data).promise();
        });
        return promise;
    };

    var findAction = function (action_id) {
        var i;
        for (i = 0; i < actionList.length; i++) {
            if (action_id === actionList[i].actionId) {
                return actionList[i];
            }
        }
    };

    return {
        initModule: initModule,
        addAction: addAction,
        execAction: execAction,

        initialize: initialize,
        run: run,
    }
})
();

var spa_function = (function () {
    'use strict';
    var
        protoFunc, protoDfdFunc,
        createFunc, createDfdFunc;

    protoFunc = {
        execute: function () {
            return this.exec_main_func(this).promise();
        },

        exec_main_func: function (this_obj) {
            try {
                this_obj.main_func(this);
            } catch (e) {
                // console.warn(e);
                return $.Deferred().reject();
            }
            if (this_obj.stays) {
                return $.Deferred().reject({'stays': this_obj.stays});
            } else {
                return $.Deferred().resolve();
            }
        },

        stay: function () {
            this.stays = true;
        },

        trigger: function (key, val) {
            if (!(key in spa_page_transition.DATA_BIND_EVENT)) {
                throw new Error('No trigger key is found. key = ' + key + ', all events=' + Object.keys(spa_page_transition.DATA_BIND_EVENT));
            }
            spa_page_transition2.getLogger().debug('trigger.key', key, 'val', val);
            $(spa_page_transition.DATA_BIND_EVENT).trigger(key, val);

            return this;
        },

        setMainFunc: function (_main_func) {
            this.main_func = _main_func;
            return this;
        },
    };

    createFunc = function (trigger_keys) {
        var
            i, trigger_key,
            len = arguments.length;

        for (i = 0; i < len; i++) {
            trigger_key = arguments[i];
            if (trigger_key) {
                spa_page_transition.addEvent(trigger_key);
            }
        }
        return Object.create(protoFunc);
    };

    createDfdFunc = function (trigger_keys) {
        var
            res = createFunc.apply(this, arguments);

        res.execute = function () {
            var
                d = $.Deferred(),
                this_obj = this;

            spa_page_data.serverAccessor(this._path, this._params).then(function (data) {
                d = this_obj.exec_main_func(this_obj);
            });

            return d.promise();
        };

        res.path = function (_path) {
            this._path = _path;
            return this;
        };

        res.params = function (_params) {
            this._params = _params;
            return this;
        };

        return res;
    };

    return {
        createFunc: createFunc,
        createDfdFunc: createDfdFunc,
    }
})();
