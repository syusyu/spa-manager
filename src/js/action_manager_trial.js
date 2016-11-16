var action_manager_trial = (function () {
    var
        firstFunc, secondFunc, thirdFunc,
        dfdFirs1stFunc,
        initModule
        ;

    firstFunc = spa_page_transition2.createFunc().setMainFunc(function (observer) {
        console.log('first func is called!');
        if (false) {
            observer.stay();
        } else {
            // throw new Error('OMG! firstFunc');
        }

    });

    secondFunc = spa_page_transition2.createFunc('KEY1').setMainFunc(function (observer) {
        console.log('second func is called!');
        if (false) {
            observer.stay();
        } else {
            // throw new Error('OMG! secondFunc');
            observer.trigger('KEY1', 1);
        }
    });

    thirdFunc = spa_page_transition2.createFunc('KEY1', 'KEY2').setMainFunc(function (observer) {
        console.log('third func is called!');
        if (false) {
            observer.stay();
        } else {
            observer.trigger('KEY1', 1).trigger('KEY2', 2);
        }
    });

    dfdFirs1stFunc = spa_page_transition2.createAjaxFunc('KEY_D1').path('./server_response_initialize.json').setMainFunc(function (observer, data) {
        console.log('dfd 1st func is called! data=' + data);
        if (false) {
            observer.stay();
        } else {
            // throw new Error('OMG! dfdFirs1stFunc');
            observer.trigger('KEY_D1', 'D1');
        }
    });

    initModule = function () {
        spa_page_transition2
            .addAction('action-A', [firstFunc, dfdFirs1stFunc, secondFunc, thirdFunc])
            // .addAction('action-A', [dfdFirs1stFunc, firstFunc, secondFunc])
            // .addAction('action-A', [firstFunc, secondFunc])
            .addAction('action-B', [firstFunc, secondFunc, thirdFunc])
            .initModule();

        spa_page_transition2.shell.execAction('action-A');
    };

    return {
        initModule: initModule
    }
})();