describe('TEST | spa_function', function () {
    var
        firstFunc, secondFunc, thirdFunc,
        firstDfdFunc, secondDfdFunc,
        page;

    firstFunc = spa_page_transition2.createFunc().setMainFunc(function (observer) {
        console.log('first func is called!');
    });
    secondFunc = spa_page_transition2.createFunc('KEY1').setMainFunc(function (observer) {
        console.log('second func is called!');
    });
    thirdFunc = spa_page_transition2.createFunc('KEY1', 'KEY2').setMainFunc(function (observer) {
        console.log('third func is called!');
    });
    firstDfdFunc = spa_page_transition2.createDfdFunc('KD1').path('./').setMainFunc(function (observer, data) {
        console.log('first DFD func is called!');
    });
    secondDfdFunc = spa_page_transition2.createDfdFunc('KD1').path('./').setMainFunc(function (observer, data) {
        console.log('first DFD func is called!');
    });

    page = {
        renderPage: function () {
            console.log('Render page.')
        },
        renderErrorPage: function () {
            console.log('Render error page.')
        }
    }

    describe('execute.func', function () {
        var
            idx = 0;

        beforeEach(function () {
            spyOn(firstFunc, 'main_func').and.callThrough();
            spyOn(secondFunc, 'main_func').and.callThrough();
            spyOn(thirdFunc, 'main_func').and.callThrough();
            spyOn(firstDfdFunc, 'main_func');
            spyOn(secondDfdFunc, 'main_func');
            spyOn(firstDfdFunc, 'execute').and.callFake(function () {
                var
                    d = $.Deferred().resolve(),
                    this_obj = this;
                d.then(function (data) {
                    d = this_obj.exec_main_func(d, this_obj);
                });
                return d.promise();
            });
            spyOn(secondDfdFunc, 'execute').and.callFake(function () {
                var
                    d = $.Deferred().resolve(),
                    this_obj = this;
                d.then(function (data) {
                    d = this_obj.exec_main_func(d, this_obj);
                });
                return d.promise();
            });
            spyOn(page, 'renderPage').and.callThrough();
            spyOn(page, 'renderErrorPage').and.callThrough();
        });

        it('idx=' + idx, function () {
            // spa_page_transition2.model.addAction('action-A', [firstFunc, secondFunc, thirdFunc]);
            spa_page_transition2.model.addAction('action-A', [firstFunc, firstDfdFunc, secondFunc, secondDfdFunc, thirdFunc]);
            spa_page_transition2.model.execAction('action-A').then(function (data) {
                page.renderPage(data);
            }, function (data) {
                if (data && data.stays) {
                    return;
                } else {
                    page.renderErrorPage(data.callback_data);
                }
            });

            expect(firstFunc.main_func).toHaveBeenCalled();
            expect(secondFunc.main_func).toHaveBeenCalled();
            expect(thirdFunc.main_func).toHaveBeenCalled();
            expect(firstDfdFunc.main_func).toHaveBeenCalled();
            expect(secondDfdFunc.main_func).toHaveBeenCalled();
            expect(page.renderPage).toHaveBeenCalled();
            expect(page.renderErrorPage).not.toHaveBeenCalled();
        });
    });
});