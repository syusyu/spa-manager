describe('TEST | spa_page_transition.shell_spec', function () {

    describe('anchor.createSelfAnchorMap', function () {
        var
            str_param_list, expected, actual;

        str_param_list = ['cd=a, id=1', 'cd=a, id=1, $name.foo.data-action-change-params', '$name.foo.data-action-change-params, cd=a, id=1'];
        expected = [{'cd': 'a', 'id': '1'}, {'cd': 'a', 'id': '1'}, {'cd': 'a', 'id': '1'}];
        $.each(str_param_list, function (idx, str_param) {
            it('idx=' + idx, function () {
                actual = spa_page_transition.shell.anchorGetter.createSelfAnchorMap(str_param);
                expect(expected[idx]).toEqual(actual);
            });
        });
    });

    describe('bindView.getToggleClassList', function () {
        var
            param_list, expected_list, actual;

        param_list = [
            {
                'trigger_key': 'cancel-confirm',
                'trigger_status_on': true,
                'data_bind_toggle_attr': 'cancel-confirm, btn-disable:inverse, btn-enable'
            },
            {
                'trigger_key': 'cancel-confirm',
                'trigger_status_on': false,
                'data_bind_toggle_attr': 'cancel-confirm, btn-disable:inverse, btn-enable'
            },
            {
                'trigger_key': 'cancel-confirm',
                'trigger_status_on': true,
                'data_bind_toggle_attr': 'cancel-confirm, btn-disable:inverse'
            },
            {
                'trigger_key': 'cancel-confirm',
                'trigger_status_on': true,
                'data_bind_toggle_attr': 'cancel-confirm, btn-disable'
            },
        ];
        expected_list = [
            [
                {
                    'toggle_action_type': spa_page_transition.shell.ENUM_TOGGLE_ACTION_TYPE.REMOVE,
                    'toggle_class': 'btn-disable',
                },
                {
                    'toggle_action_type': spa_page_transition.shell.ENUM_TOGGLE_ACTION_TYPE.ADD,
                    'toggle_class': 'btn-enable',
                },
            ],
            [
                {
                    'toggle_action_type': spa_page_transition.shell.ENUM_TOGGLE_ACTION_TYPE.ADD,
                    'toggle_class': 'btn-disable',
                },
                {
                    'toggle_action_type': spa_page_transition.shell.ENUM_TOGGLE_ACTION_TYPE.REMOVE,
                    'toggle_class': 'btn-enable',
                },
            ],
            [
                {
                    'toggle_action_type': spa_page_transition.shell.ENUM_TOGGLE_ACTION_TYPE.REMOVE,
                    'toggle_class': 'btn-disable',
                },

            ],
            [
                {
                    'toggle_action_type': spa_page_transition.shell.ENUM_TOGGLE_ACTION_TYPE.ADD,
                    'toggle_class': 'btn-disable',
                },

            ],
        ];

        $.each(param_list, function (idx, param) {
            it('idx=' + idx, function () {
                actual = spa_page_transition.shell.bindView.getToggleClassList(
                    param.trigger_key, true, param.trigger_status_on, param.data_bind_toggle_attr);
                expect(actual).toEqual(expected_list[idx]);
            });
        });
    });
});