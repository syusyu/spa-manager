describe('TEST | spa_page_transition', function () {
    var
        n1, n2, n3, ns, ne,
        d1, d2, d3, ds, de, de2,
        initFunc,
        page, dfdResolve, dfdReject, trigger;

    page = {
        renderPage: function () {
            console.log('Render page.')
        },
        renderErrorPage: function () {
            console.log('Render error page.')
        }
    };

    // dfdResolve = function () {
    //     var
    //         d = $.Deferred().resolve(),
    //         this_obj = this;
    //
    //     d.then(function (data) {
    //         d = this_obj.exec_main_func(this_obj);
    //     });
    //     return d.promise();
    // };
    dfdResolve = function (anchor_map) {
        var
            d = $.Deferred().resolve(),
            this_obj = this;

        d.then(function (data) {
            // d = this_obj.exec_main_func(this_obj, anchor_map, data);
            d = this_obj.exec_main_func(this_obj, anchor_map, data).then(function (data_main_func) {
                // console.log('ajaxfunc.sub.succeeded. stays=' + (data_main_func ? data_main_func.stays : 'none'));
                // d = $.Deferred().resolve();
            }, function (data_main_func) {
                return $.Deferred().reject(data_main_func).promise();
            });
        }, function (data) {
            d.reject(data);
            console.log('ajaxfunc.srv.failed');
        });
        return d.promise();
    };

    dfdReject = function () {
        var
            d = $.Deferred().reject(),
            this_obj = this;

        d.then(function (data) {
            d = this_obj.exec_main_func(this_obj);
        });
        return d.promise();
    };

    trigger = function (key, val) {
        console.log('trigger is called. key=' + key + ', val=' + val);
        return this;
    };

    initFunc = spa_page_transition.createAjaxFunc('.', function (data) {
        console.log('initFUnc is called!');
    });

    n1 = spa_page_transition.createFunc(function () {
        console.log('n1 is called!');
    });
    n2 = spa_page_transition.createFunc(function (observer) {
        console.log('n2 is called!');
        observer.trigger('KEY2', 2);
    });
    n3 = spa_page_transition.createFunc(function (observer, params) {
        console.log('n3 is called! params.key=' + params.key);
        observer.trigger('KEY3', 3).trigger('KEY33', 3);
    });
    ns = spa_page_transition.createFunc(function (observer) {
        console.log('ns is called!');
        observer.stay();
    });
    ne = spa_page_transition.createFunc(function (observer) {
        console.log('ne is called!');
        throw new Error('normal error');
    });

    d1 = spa_page_transition.createAjaxFunc('./', function (data) {
        console.log('d1 is called!');
    });
    d2 = spa_page_transition.createAjaxFunc('./', function (observer, data) {
        console.log('d2 is called!');
        observer.trigger('KD2', 'D2');
    });
    d3 = spa_page_transition.createAjaxFunc('./', function (observer, data) {
        console.log('d3 is called!');
        observer.trigger('KD3', 'D3').trigger('KD33', 'D33');
    });
    ds = spa_page_transition.createAjaxFunc('./', function (observer, data) {
        console.log('ds is called!');
        observer.stay();
    });
    de = spa_page_transition.createAjaxFunc('./', function (observer, data) {
        console.log('de is called!');
        throw new Error('dfd error');
    });
    de2 = spa_page_transition.createAjaxFunc('./', function (observer, data) {
        console.log('de2 is called!');
    });

    describe('execute.func', function () {
        var
            params = [
                // normal
                {
                    'title': 'n all',
                    'func_list': [n1, n2, n3],
                    'expected': {'n1': true, 'n2': true, 'n3': true, 'render': true, 'error': false}
                },
                {
                    'title': 'd all',
                    'func_list': [d1, d2, d3],
                    'expected': {'d1': true, 'd2': true, 'd3': true, 'render': true, 'error': false}
                },
                {
                    'title': 'd n d',
                    'func_list': [d1, n2, d3],
                    'expected': {'d1': true, 'n2': true, 'd3': true, 'render': true, 'error': false}
                },

                // normal inifFunc
                {
                    'title': 'init, d n d',
                    'func_list': [initFunc, d1, n2, d3],
                    'expected': {'initFunc': true, 'd1': true, 'n2': true, 'd3': true, 'render': true, 'error': false}
                },

                // stay
                {
                    'title': 'n first stay',
                    'func_list': [ns, n2, n3],
                    'expected': {'ns': true, 'n2': false, 'n3': false, 'render': false, 'error': false}
                },
                {
                    'title': 'd first stay',
                    'func_list': [ds, n2, n3],
                    'expected': {'ds': true, 'n2': false, 'n3': false, 'render': false, 'error': false}
                },
                {
                    'title': 'd third stay',
                    'func_list': [n1, d2, ds],
                    'expected': {'n1': true, 'd2': true, 'ds': true, 'render': false, 'error': false}
                },

                //error
                {
                    'title': 'n first error',
                    'func_list': [ne, n2, n3],
                    'expected': {'ne': true, 'n2': false, 'n3': false, 'render': false, 'error': true}
                },
                {
                    'title': 'd second error',
                    'func_list': [n1, de, n3],
                    'expected': {'n1': true, 'de': true, 'n3': false, 'render': false, 'error': true}
                },
                {
                    'title': 'd third error',
                    'func_list': [n1, d2, de],
                    'expected': {'n1': true, 'd2': true, 'de': true, 'render': false, 'error': true}
                },
                {
                    'title': 'd third error 2',
                    'func_list': [n1, d2, de2],
                    'expected': {'n1': true, 'd2': true, 'de2': false, 'render': false, 'error': true}
                },
            ];

        beforeEach(function () {
            spyOn(initFunc, 'execute').and.callFake(dfdResolve);
            spyOn(initFunc, 'main_func').and.callThrough();
            spyOn(initFunc, 'trigger').and.callFake(trigger);
            spyOn(n1, 'main_func').and.callThrough();
            spyOn(n1, 'trigger').and.callFake(trigger);
            spyOn(n2, 'main_func').and.callThrough();
            spyOn(n2, 'trigger').and.callFake(trigger);
            spyOn(n3, 'main_func').and.callThrough();
            spyOn(n3, 'trigger').and.callFake(trigger);
            spyOn(ns, 'main_func').and.callThrough();
            spyOn(ns, 'trigger').and.callFake(trigger);
            spyOn(ne, 'main_func').and.callThrough();
            spyOn(ne, 'trigger').and.callFake(trigger);
            spyOn(d1, 'main_func').and.callThrough();
            spyOn(d1, 'execute').and.callFake(dfdResolve);
            spyOn(d1, 'trigger').and.callFake(trigger);
            spyOn(d2, 'main_func').and.callThrough();
            spyOn(d2, 'execute').and.callFake(dfdResolve);
            spyOn(d2, 'trigger').and.callFake(trigger);
            spyOn(d3, 'main_func').and.callThrough();
            spyOn(d3, 'execute').and.callFake(dfdResolve);
            spyOn(d3, 'trigger').and.callFake(trigger);
            spyOn(ds, 'main_func').and.callThrough();
            spyOn(ds, 'execute').and.callFake(dfdResolve);
            spyOn(ds, 'trigger').and.callFake(trigger);
            spyOn(de, 'main_func').and.callThrough();
            spyOn(de, 'execute').and.callFake(dfdResolve);
            spyOn(de, 'trigger').and.callFake(trigger);
            spyOn(de2, 'main_func').and.callThrough();
            spyOn(de2, 'execute').and.callFake(dfdReject);
            spyOn(de2, 'trigger').and.callFake(trigger);
            spyOn(page, 'renderPage').and.callThrough();
            spyOn(page, 'renderErrorPage').and.callThrough();
        });

        $.each(params, function (param_idx, obj) {
            it(obj.title + '(' + param_idx + ')', function () {
                spa_page_transition.debugMode().initialize().addAction('action-01', 'dummy-cls', obj.func_list);
                spa_page_transition.model.execAction({'action': 'action-01', 'key': 'key01'}).then(function (data) {
                    page.renderPage(data);
                }, function (data) {
                    if (data && data.stays) {
                        return;
                    } else {
                        page.renderErrorPage();
                    }
                });

                obj.expected.initFunc ? expect(initFunc.main_func).toHaveBeenCalled() : expect(initFunc.main_func).not.toHaveBeenCalled();
                obj.expected.n1 ? expect(n1.main_func).toHaveBeenCalled() : expect(n1.main_func).not.toHaveBeenCalled();
                obj.expected.n2 ? expect(n2.main_func).toHaveBeenCalled() : expect(n2.main_func).not.toHaveBeenCalled();
                obj.expected.n3 ? expect(n3.main_func).toHaveBeenCalled() : expect(n3.main_func).not.toHaveBeenCalled();
                obj.expected.ns ? expect(ns.main_func).toHaveBeenCalled() : expect(ns.main_func).not.toHaveBeenCalled();
                obj.expected.ne ? expect(ne.main_func).toHaveBeenCalled() : expect(ne.main_func).not.toHaveBeenCalled();
                obj.expected.d1 ? expect(d1.main_func).toHaveBeenCalled() : expect(d1.main_func).not.toHaveBeenCalled();
                obj.expected.d2 ? expect(d2.main_func).toHaveBeenCalled() : expect(d2.main_func).not.toHaveBeenCalled();
                obj.expected.d3 ? expect(d3.main_func).toHaveBeenCalled() : expect(d3.main_func).not.toHaveBeenCalled();
                obj.expected.ds ? expect(ds.main_func).toHaveBeenCalled() : expect(ds.main_func).not.toHaveBeenCalled();
                obj.expected.de ? expect(de.main_func).toHaveBeenCalled() : expect(de.main_func).not.toHaveBeenCalled();
                obj.expected.de2 ? expect(de2.main_func).toHaveBeenCalled() : expect(de2.main_func).not.toHaveBeenCalled();
                obj.expected.render ? expect(page.renderPage).toHaveBeenCalled() : expect(page.renderPage).not.toHaveBeenCalled();
                obj.expected.error ? expect(page.renderErrorPage).toHaveBeenCalled() : expect(page.renderErrorPage).not.toHaveBeenCalled();
            });
        });
    });
});