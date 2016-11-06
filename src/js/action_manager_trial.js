var action_manager_trial = (function () {
    var
        firstFunc, secondFunc, thirdFunc,
        initModule
        ;

    firstFunc = spa_page_transition2.createFunc().setMainFunc(function () {
        console.log('first func is called!');
    });

    secondFunc = spa_page_transition2.createFunc('KEY1').setMainFunc(function (observer) {
        console.log('second func is called!');
        observer.trigger('KEY1', 1);
    });

    thirdFunc = spa_page_transition2.createFunc('KEY1', 'KEY2').setMainFunc(function (observer) {
        console.log('third func is called!');
        observer.trigger('KEY1', 1).trigger('KEY2', 2);
    });

    initModule = function () {
        spa_page_transition2
            .addAction('action-A', [firstFunc, secondFunc])
            .addAction('action-B', [secondFunc, thirdFunc])
            .initModule();

        spa_page_transition2.model.execFunc('action-B');
    };

    return {
        initModule: initModule
    }
})();