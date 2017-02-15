var plan_change = (function () {
    'use strict';
    var
        logger, getLogger,
        initModule;

    getLogger = function () {
        return logger;
    };

    initModule = function ($container, $server_host, send_params, is_debug_mode) {
        var
            server_host = $server_host.val(),
            PATH_INIT = server_host + '/server_response_initialize.json',
            PATH_UPDATE = server_host + '/server_response_update.json',
            PATH_CANCEL = server_host + '/server_response_update_cancel.json',

            initializationFunc = spa_page_transition.createAjaxFunc(PATH_INIT, send_params, function (observer, anchor_map, data) {
                plan_change.getLogger().debug('initial data loaded! status', data.status, 'data', data);
                if (data.status !== '0') {
                    observer.error('Invalid initial data');
                    return;
                }
                plan_change.model.serverData.setInitData(data.init_data);
                plan_change.model.serverData.setPlanList(data.plan_list);
                plan_change.model.serverData.initHistory(data);
                observer.trigger('init_data', plan_change.model.serverData.getInitData());
                observer.trigger('HISTORY',plan_change.model.serverData.filterHistoryList(plan_change.model.serverData.getFirstElementOfHistoryFilter()));
                observer.trigger('HISTORY_FILTER', plan_change.model.serverData.getHistoryFilterList());
                selectDefaultPlan.execute();
            }),

            selectPlan = spa_page_transition.createFunc(function (observer, anchor_map) {
                var
                    selected_plan;

                if (!plan_change.model.existsPlan()) {
                    return;
                }
                selected_plan = plan_change.model.selectPlan(!anchor_map ? null : anchor_map.id);
                observer.trigger('plan', selected_plan);
                plan_change.shell.selectPlan(selected_plan.id);
            }),

            selectDefaultPlan = spa_page_transition.createFunc(function (observer) {
                selectPlan.execute();
            }),

            verifyPlan = spa_page_transition.createFunc(function (observer, anchor_map) {
                plan_change.model.verifyPlan(anchor_map.id);
                selectPlan.execute(anchor_map);
            }),

            updatePlan = spa_page_transition.createAjaxFunc(PATH_UPDATE, function (observer, anchor_map, data) {
                if (data.status !== '0') {
                    observer.error('');
                    return;
                }
            }).get_params(plan_change.shell.getParamForUpdate),

            cancelPlan = spa_page_transition.createAjaxFunc(PATH_CANCEL, function (observer, anchor_map, data) {
                if (data.status !== '0') {
                    observer.error('');
                    return;
                }
            }).get_params(plan_change.shell.getParamForCancel),

            filterHistoryList = spa_page_transition.createFunc(function (observer, anchor_map) {
                logger.debug('filterHistoryList is called. selected_val', anchor_map.val);
                observer.trigger('HISTORY', plan_change.model.serverData.filterHistoryList(anchor_map.val));
            });

        logger = spa_log.createLogger(is_debug_mode, '### PLAN_CHANGE.LOG ###');

        plan_change.shell.initModule($container);

        spa_page_transition.debugMode(is_debug_mode).initialize(initializationFunc)
            .addAction(spa_page_transition.model.START_ACTION, 'list')
            .addAction('select-plan', 'list', [selectPlan])
            .addAction('next-to-confirm', 'confirm', [verifyPlan])
            .addAction('back-to-list', 'list')
            .addAction('update', 'complete', [updatePlan])
            .addAction('cancel-init', 'cancel')
            .addAction('cancel', 'cancel-complete', [cancelPlan])
            .addAction('filter-history', 'cancel', [filterHistoryList])
            .addAction('popup-warning', 'warning')
            .run();
    };

    return {
        initModule: initModule,
        getLogger: getLogger
    }
}());


plan_change.shell = (function () {
    'use strict';
    var
        $radio_newplans,
        selectPlan, getParamForUpdate, getParamForCancel, getCommonParamForUpdate, initModule;

    selectPlan = function (selected_id) {
        $.each($radio_newplans, function (idx, el) {
            if ($(el).attr('id') !== 'newplan' + selected_id || $(el).is(':checked')) {
                return true;
            }
            $(el).attr('checked', 'checked');
            return false;
        });
        plan_change.getLogger().debug('shell.selectPlan. id', selected_id);
    };

    getParamForUpdate = function () {
        var
            params = {};

        params['contractPlanId'] = $('#contract-plan-id').val();
        params['servicePlanId'] = $('input[name=newplan]:checked').val();
        $.extend(params, getCommonParamForUpdate());
        plan_change.getLogger().debug('getParamForUpdate. param' + params);
        return params;
    };

    getParamForCancel = function () {
        var
            params = {};

        params['contractId'] = $('#contract-id').val();
        $.extend(params, getCommonParamForUpdate());
        plan_change.getLogger().debug('getParamForCancel. param', params);
        return params;
    };

    getCommonParamForUpdate = function () {
        var
            params = {};

        $('input[name^=CHECK_KEY_]').each(function (idx, el) {
            params[$(el).attr('name')] = $(el).val();
        });
        return params;
    }

    initModule = function ($container) {
        $radio_newplans = $container.find('input[name="newplan"]');
    };

    return {
        selectPlan: selectPlan,
        getParamForUpdate: getParamForUpdate,
        getParamForCancel: getParamForCancel,
        initModule: initModule,
    };
}());


plan_change.model = (function () {
    'use strict';
    var
        serverData, existsPlan, selectPlan, verifyPlan;

    serverData = (function () {
        var
            planList, getPlanList, setPlanList, findPlan,
            initData, getInitData, setInitData,
            initHistory, filterHistoryList,
            history_list, history_filter_list, getHistoryFilterList, getFirstElementOfHistoryFilter;

        getInitData = function () {
            return initData;
        };
        setInitData = function (init_data) {
            initData = init_data;
        };

        existsPlan = function () {
            return planList != null && planList.length > 0;
        };
        getPlanList = function () {
            return planList;
        };
        setPlanList = function (plan_list) {
            planList = plan_list;
        };
        findPlan = function (id) {
            if (!id) {
                return null;
            }
            return planList.filter(function (obj, idx) {
                    return obj.id === id
                })[0] || null;
        };
        initHistory = function (data) {
            history_list = data.history_list;
            history_filter_list = data.history_filter_list;
        };
        getHistoryFilterList = function () {
            return {'history_filter_list': history_filter_list};
        };
        getFirstElementOfHistoryFilter = function () {
            return spa_page_util.isEmpty(history_filter_list) ? null : history_filter_list[0].year + '-' + history_filter_list[0].month;
        };
        filterHistoryList = function (selected_filter) {
            var
                y_m = selected_filter.split('-'),
                y = y_m[0],
                m = y_m[1],
                new_history_list = history_list.filter(function (el) {
                    return (y === 'all' || m === 'all') ? true : (el.year === y && el.month === m);
                });
            return {'history_list': new_history_list};
        };

        return {
            getInitData: getInitData,
            setInitData: setInitData,
            existsPlan: existsPlan,
            getPlanList: getPlanList,
            setPlanList: setPlanList,
            findPlan: findPlan,
            initHistory: initHistory,
            getHistoryFilterList: getHistoryFilterList,
            getFirstElementOfHistoryFilter: getFirstElementOfHistoryFilter,
            filterHistoryList: filterHistoryList,
        }
    })();

    existsPlan = function () {
        return serverData.existsPlan();
    };

    selectPlan = function (selected_id) {
        var
            selected_plan = serverData.findPlan(selected_id) || serverData.getPlanList()[0];

        plan_change.getLogger().debug('selectPlan executed. selected_plan', selected_plan.id);
        return selected_plan;
    };

    verifyPlan = function (selected_id) {
        if (!selected_id) {
            throw Error('Id should be selected');
        }
        if (!serverData.findPlan(selected_id)) {
            throw new Error('Invalid selected id = ', selected_id);
        }
        plan_change.getLogger().debug('verifyPlan.selected_id', selected_id);
    };

    return {
        existsPlan: existsPlan,
        selectPlan: selectPlan,
        verifyPlan: verifyPlan,
        serverData: serverData,
    };
}());
