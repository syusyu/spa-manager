describe('TEST | spa_function', function () {
    var
        firstFunc, secondFunc, thirdFunc,
        firstDfdFunc, secondDfdFunc, thirdDfdFunc,
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
    firstDfdFunc = spa_page_transition2.createDfdFunc('KEY_D1').path('./server_response_initialize.json').setMainFunc(function (observer, data) {
        console.log('first dfd func is called!');
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
            spyOn(firstFunc, 'main_func');
            spyOn(secondFunc, 'main_func');
            spyOn(thirdFunc, 'main_func');
            spyOn(firstDfdFunc, 'main_func');
            spyOn(page, 'renderPage');
            spyOn(page, 'renderErrorPage');

            // spa_page_transition2.model.addAction('action-A', [firstFunc, secondFunc, thirdFunc]);
            spa_page_transition2.model.addAction('action-A', [firstDfdFunc, secondFunc, thirdFunc]);
            spa_page_transition2.model.execAction('action-A').then(function (data) {
                page.renderPage(data);
            }, function (data) {
                if (data && data.stays) {
                    return;
                } else {
                    page.renderErrorPage(data.callback_data);
                }
            });

        });

        it('idx=' + idx, function () {
            // expect(firstFunc.main_func).toHaveBeenCalled();
            expect(firstDfdFunc.main_func).toHaveBeenCalled();
            expect(secondFunc.main_func).toHaveBeenCalled();
            expect(thirdFunc.main_func).toHaveBeenCalled();
            expect(page.renderPage).toHaveBeenCalled();
            expect(page.renderErrorPage).not.toHaveBeenCalled();
        });
    });
});