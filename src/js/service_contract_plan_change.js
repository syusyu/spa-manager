var plan_change = (function () {
    'use strict';
    var
        initPlan, selectPlan, selectDefaultPlan, verifyPlan, updatePlan, cancelInitPlan, cancelPlan, initModule,
        logger, getLogger,
        initialized = false,
        PLAN_SELECTED_EVENT = 'plan',
        INIT_DATA_EVENT = 'init_data';

    initPlan = function (params) {
        if (initialized) {
            return;
        }
        plan_change.model.initPlan();
        selectDefaultPlan();
        initialized = true;
    };

    selectPlan = function (params) {
        var
            selected_plan;

        if (!plan_change.model.existsPlan()) {
            return;
        }
        selected_plan = plan_change.model.selectPlan(!params ? null : params.id);
        plan_change.shell.selectPlan(selected_plan.id);
    };

    selectDefaultPlan = function (params) {
        selectPlan();
    };

    verifyPlan = function (params) {
        plan_change.model.verifyPlan(params.id);
        selectPlan(params);
    };

    updatePlan = function (params) {
        var
            send_params = {};

        if (!initialized) {
            return;
        }
        return plan_change.model.updatePlan(params, plan_change.shell.getParamForUpdate());
    };

    cancelInitPlan = function (params) {

    };

    cancelPlan = function (params) {
        return plan_change.model.cancelPlan(params, plan_change.shell.getParamForCancel());
    };

    getLogger = function () {
        return logger;
    };

    initModule = function ($container, $server_host, send_params_for_init, is_debug_mode) {
        if (!$server_host || !$server_host.val()) {
            throw new Error('$server_host should be set.')
        }
        logger = spa_log.createLogger(is_debug_mode, '### PLAN_CHANGE.LOG ###');

        spa_page_transition.addAction('initialize', 'list', initPlan);
        spa_page_transition.addAction('select-plan', 'list', selectPlan, initPlan);
        spa_page_transition.addAction('next-to-confirm', 'confirm', verifyPlan, initPlan);
        spa_page_transition.addAction('back-to-list', 'list', null, initPlan);
        spa_page_transition.addAction('update', 'complete', updatePlan);
        spa_page_transition.addAction('cancel-init', 'cancel', cancelInitPlan);
        spa_page_transition.addAction('cancel', 'cancel-complete', cancelPlan);
        spa_page_transition.addAction('popup-warning', 'warning');

        spa_page_transition.addEvent(PLAN_SELECTED_EVENT);
        spa_page_transition.addEvent(INIT_DATA_EVENT);

        plan_change.model.initModule($server_host.val(), send_params_for_init);
        plan_change.shell.initModule($container);
    };

    return {
        initPlan: initPlan,
        selectPlan: selectPlan,
        verifyPlan: verifyPlan,
        updatePlan: updatePlan,
        cancelInitPlan: cancelInitPlan,
        cancelPlan: cancelPlan,
        initModule: initModule,
        getLogger: getLogger,
        PLAN_SELECTED_EVENT: PLAN_SELECTED_EVENT,
        INIT_DATA_EVENT: INIT_DATA_EVENT,
    };
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
        serverData,
        initPlan, existsPlan, selectPlan, verifyPlan, updatePlan, cancelInitPlan, cancelPlan,
        serverHost,
        initModule;

    serverData = (function () {
        var
            planList, getPlanList, setPlanList, findPlan,
            initData, getInitData, setInitData;

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

        return {
            getInitData: getInitData,
            setInitData: setInitData,
            existsPlan: existsPlan,
            getPlanList: getPlanList,
            setPlanList: setPlanList,
            findPlan: findPlan,
        }
    })();

    initPlan = function () {
        plan_change.getLogger().debug('initPlan.init_data', serverData.getInitData());
        $(spa_page_transition.DATA_BIND_EVENT).trigger(plan_change.INIT_DATA_EVENT, serverData.getInitData());
    };

    existsPlan = function () {
        return serverData.existsPlan();
    };

    selectPlan = function (selected_id) {
        var
            selected_plan = serverData.findPlan(selected_id) || serverData.getPlanList()[0];

        $(spa_page_transition.DATA_BIND_EVENT).trigger(plan_change.PLAN_SELECTED_EVENT, selected_plan);
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

    updatePlan = function (params, send_params) {
        var
            dfd_result = $.Deferred();

        plan_change.getLogger().debug('updatePlan');
        plan_change.data.doAccessServerWrapper(serverHost + plan_change.data.PATH_UPDATE, send_params, dfd_result);
        return dfd_result.promise();
    };

    cancelInitPlan = function () {

    };

    cancelPlan = function (params, send_params) {
        var
            dfd_result = $.Deferred();

        plan_change.getLogger().debug('cancelPlan');
        plan_change.data.doAccessServerWrapper(serverHost + plan_change.data.PATH_CANCEL, send_params, dfd_result);
        return dfd_result.promise();
    };

    initModule = function (server_host, send_params) {
        var
            anchor_map = $.uriAnchor.makeAnchorMap(),
            action = anchor_map ? anchor_map['action'] : null,
            dfd_result = $.Deferred();

        serverHost = server_host;

        if ('cancel-init' === action) {
            dfd_result.resolve();
            // plan_change.data.doAccessServerWrapper(serverHost + plan_change.data.PATH_CANCEL_INIT, send_params, dfd_result);
        } else {
            plan_change.data.doAccessServerWrapper(serverHost + plan_change.data.PATH_INIT, send_params, dfd_result, function (data) {
                plan_change.getLogger().debug('initial data loaded! status', data.status, 'init_data', data.init_data);
                serverData.setInitData(data.init_data);
                serverData.setPlanList(data.plan_list);
            }, function(data) {
                spa_page_transition.shell.renderErrorPage(data.message);
            });
        }
        plan_change.getLogger().debug('service.model.initModule executed.');
        spa_page_transition.prepareActivation(dfd_result.promise());
    };

    return {
        initPlan: initPlan,
        existsPlan: existsPlan,
        selectPlan: selectPlan,
        verifyPlan: verifyPlan,
        updatePlan: updatePlan,
        cancelInitPlan: cancelInitPlan,
        cancelPlan: cancelPlan,
        initModule: initModule,
    };
}());

plan_change.data = (function () {
    'use strict';
    var
        doAccessServerWrapper, PATH_INIT, PATH_UPDATE, PATH_CANCEL_INIT, PATH_CANCEL;

    PATH_INIT = '/server_response_initialize.json';
    PATH_CANCEL_INIT = '/server_response_initialize_cancel.json';
    PATH_UPDATE = '/server_response_update.json';
    PATH_CANCEL = '/server_response_update_cancel.json';
    // PATH_INIT = '/changeplan/init';
    // PATH_CANCEL_INIT = '/changeplan/cancel_init';
    // PATH_UPDATE = '/changeplan/update';
    // PATH_CANCEL = '/changeplan/cancel';

    doAccessServerWrapper = function (filePath, send_params, dfd_result, succeeded_func, failed_func) {
        setTimeout(function () {
            spa_page_data.doAccessServer(filePath, send_params, function (data) {
                if (data.status === '0') {
                    if (succeeded_func) {
                        succeeded_func(data);
                    }
                    dfd_result.resolve(data);
                } else {
                    if (failed_func) {
                        failed_func(data);
                    }
                    dfd_result.reject(data.message);
                }
            });
        }, 1000);
    };

    return {
        doAccessServerWrapper: doAccessServerWrapper,
        PATH_INIT: PATH_INIT,
        PATH_UPDATE: PATH_UPDATE,
        PATH_CANCEL_INIT: PATH_CANCEL_INIT,
        PATH_CANCEL: PATH_CANCEL,
    }

}());
