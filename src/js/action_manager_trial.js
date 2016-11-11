var action_manager_trial = (function () {
    var
        firstFunc, secondFunc, thirdFunc,
        dfdFirs1stFunc,
        initModule
        ;

    firstFunc = spa_page_transition2.createFunc().setMainFunc(function () {
        console.log('first func is called!');
    });

    secondFunc = spa_page_transition2.createFunc('KEY1').setMainFunc(function (observer) {
        console.log('second func is called!');
        if (true) {
            observer.stay(true);
        } else {
            observer.trigger('KEY1', 1);
        }
    });

    thirdFunc = spa_page_transition2.createFunc('KEY1', 'KEY2').setMainFunc(function (observer) {
        console.log('third func is called!');
        observer.trigger('KEY1', 1).trigger('KEY2', 2);
    });


    // dfdFirs1stFunc = spa_page_transition2.createDfdFunc('KEY_D1').path('/d1').setMainFunc(function (observer, data) {
    //     console.log('dfd 1st func is called! data=' + data);
    //     observer.trigger('KEY_D1', D1);
    // });

    initModule = function () {
        spa_page_transition2
            .addAction('action-A', [firstFunc, secondFunc])
            .addAction('action-B', [secondFunc, thirdFunc])
            .initModule();

        spa_page_transition2.shell.execAction('action-B');
    };

    return {
        initModule: initModule
    }
})();