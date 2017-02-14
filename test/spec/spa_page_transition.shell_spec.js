describe('TEST | spa_page_transition.shell', function () {

    describe('anchor.createSelfAnchorMap', function () {
        var
            str_param_list, expected, actual;

        str_param_list = ['id, cd', 'cd=a, id=1', 'cd=a, id=1, $name.foo.data-action-change-params', '$name.foo.data-action-change-params, cd=a, id=1'];
        expected = [{}, {'cd': 'a', 'id': '1'}, {'cd': 'a', 'id': '1'}, {'cd': 'a', 'id': '1'}];
        $.each(str_param_list, function (idx, str_param) {
            it('idx=' + idx, function () {
                actual = spa_page_transition.shell.anchorGetter.createSelfAnchorMap(str_param);
                expect(expected[idx]).toEqual(actual);
            });
        });
    });

    describe('data_bind.evt_data_bind_view.get_toggle_class_list', function () {
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
                    'toggle_action_type': spa_page_transition.data_bind.ENUM_TOGGLE_ACTION_TYPE.REMOVE,
                    'toggle_class': 'btn-disable',
                },
                {
                    'toggle_action_type': spa_page_transition.data_bind.ENUM_TOGGLE_ACTION_TYPE.ADD,
                    'toggle_class': 'btn-enable',
                },
            ],
            [
                {
                    'toggle_action_type': spa_page_transition.data_bind.ENUM_TOGGLE_ACTION_TYPE.ADD,
                    'toggle_class': 'btn-disable',
                },
                {
                    'toggle_action_type': spa_page_transition.data_bind.ENUM_TOGGLE_ACTION_TYPE.REMOVE,
                    'toggle_class': 'btn-enable',
                },
            ],
            [
                {
                    'toggle_action_type': spa_page_transition.data_bind.ENUM_TOGGLE_ACTION_TYPE.REMOVE,
                    'toggle_class': 'btn-disable',
                },

            ],
            [
                {
                    'toggle_action_type': spa_page_transition.data_bind.ENUM_TOGGLE_ACTION_TYPE.ADD,
                    'toggle_class': 'btn-disable',
                },

            ],
        ];

        $.each(param_list, function (idx, param) {
            it('idx=' + idx, function () {
                actual = spa_page_transition.data_bind.evt_data_bind_view.get_toggle_class_list(
                    param.trigger_key, true, param.trigger_status_on, param.data_bind_toggle_attr);
                expect(actual).toEqual(expected_list[idx]);
            });
        });
    });


    describe('data_bind.evt_data_bind_view.show_condition', function () {
        var
            sut = spa_page_transition.data_bind.evt_data_bind_view.show_condition,
            data = {
                'bar': '1',
                'baz': '2',
                'list': [1, 2, 3],
                'list_emp': [],
                'map': {'1':1},
                'map_emp': {},
                'na': '',
                'h1': [
                    {'h21': '21'},
                    {'h22': '22'}
                ]
            },
            fixtures = [
                {'title': 'eq',     'selector': 'data-bind-show-if-eq',     'attr': 'FOO.bar=1',    'expected': true},
                {'title': 'if',     'selector': 'data-bind-show-if',        'attr': 'FOO.bar=0',    'expected': false},
                {'title': 'not-eq', 'selector': 'data-bind-show-if-not-eq', 'attr': 'FOO.bar=0',    'expected': true},
                {'title': 'not-eq', 'selector': 'data-bind-show-if-not-eq', 'attr': 'FOO.bar=1',    'expected': false},
                {'title': 'empty-list',  'selector': 'data-bind-show-if-empty', 'attr': 'FOO.list_emp', 'expected': true},
                {'title': 'empty-list',  'selector': 'data-bind-show-if-empty', 'attr': 'FOO.list', 'expected': false},
                {'title': 'empty-map',  'selector': 'data-bind-show-if-empty', 'attr': 'FOO.map_emp', 'expected': true},
                {'title': 'empty-map',  'selector': 'data-bind-show-if-empty', 'attr': 'FOO.map', 'expected': false},
                {'title': 'empty-bar',  'selector': 'data-bind-show-if-empty', 'attr': 'FOO.bar', 'expected': false},
                {'title': 'empty-na',  'selector': 'data-bind-show-if-empty', 'attr': 'FOO.na', 'expected': true},
                {'title': 'not-empty-list',  'selector': 'data-bind-show-if-not-empty', 'attr': 'FOO.list_emp', 'expected': false},
                {'title': 'not-empty-list',  'selector': 'data-bind-show-if-not-empty', 'attr': 'FOO.list', 'expected': true},
                {'title': 'not-empty-map',  'selector': 'data-bind-show-if-not-empty', 'attr': 'FOO.map_emp', 'expected': false},
                {'title': 'not-empty-map',  'selector': 'data-bind-show-if-not-empty', 'attr': 'FOO.map', 'expected': true},
                {'title': 'not-empty-bar',  'selector': 'data-bind-show-if-not-empty', 'attr': 'FOO.bar', 'expected': true},
                {'title': 'not-empty-na',  'selector': 'data-bind-show-if-not-empty', 'attr': 'FOO.na', 'expected': false},
                {'title': 'hierarcy', 'selector': 'data-bind-show-if-eq', 'attr': 'FOO.h1$0.h21=22', 'expected': false},
                {'title': 'hierarcy', 'selector': 'data-bind-show-if-eq', 'attr': 'FOO.h1$1.h22=22', 'expected': true},
            ];

        $.each(fixtures, function (idx, f) {
            it('idx=' + idx + '-' + f.title, function () {
                var matched_show_cond = sut.findShowCond(f.selector).prepare(data, f.attr);
                if (matched_show_cond.is_target('FOO')) {
                    expect(f.expected).toEqual(matched_show_cond.visible());
                }
            });
        });
    });


});