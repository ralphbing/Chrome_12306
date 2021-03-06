//log
(function() {
    var logger = {
        id: 0,
        getId: function() {
            return ('0000000000' + ++this.id).match(/[\w]{6}$/)[0];
        },
        log: function() {
            var text = String.format.apply(this, arguments);
            var id = $('<span></span>')
                .html('&nbsp;&nbsp;&nbsp;' + this.getId() + '&nbsp;');
            var t = $('<span></span>').text(text);
            $('.log').append($('<div></div>').append(id).append(t));
            //新增一条再删除一条
            if ($('.log > div').length > 200) {
                $('.log > div:first').remove();
            }
            //滚动滚动条至最下面
            setTimeout(function() {
                $('.log_wrapper').each(function() {
                    var jthis = $(this),
                        jlog = jthis.find('.log');
                    var th = jthis.height(),
                        lh = jlog.height();
                    if (lh > th) {
                        jthis.scrollTop(lh - th);
                    }
                });
            }, 1);
        },
        clear: function() {
            $('.log').html('');
        }
    };

    $(document).on('click', '.clear_log', logger.clear);

    $.extend(window, {
        log: $.proxy(logger.log, logger)
    });

    setInterval(function() {
        $('#time').text(new Date().pattern('HH:mm:ss'));
    }, 1000);
})();

$(function() {
    $('textarea').each(function() {
        $(this).val($.trim($(this).val()));
    });

    var tdate = $('#train_date');
    tdate.datepicker({
        dateFormat: "yy-mm-dd",
        maxDate: '+60',
        minDate: 0
    }).change(function() {
        interact.loadAvailableTrains();
    });
    setTimeout(function() {
        var t = new Date().pattern('yyyy-MM-dd');
        if (tdate.val() < t) {
            tdate.val(t).trigger('change');;
        }
    }, 200);

    $('.station_name').autocomplete({
        delay: 50,
        minLength: 1,
        selectListText: 'value',
        source: station_autocomplete,
        autoFocus: true,
        height: '200px',
        select: function() {
            setTimeout(function() {
                interact.loadAvailableTrains();
            }, 1);
        },
        change: function() {
            setTimeout(function() {
                interact.loadAvailableTrains();
            }, 1);
        }
    });
});

//checkcode
$(function() {
    $(document).on('click', '.checkcode-new', function() {
        var $wrap = $(this).parent();
        var $img = $wrap.find('img');
        $img.unbind('load').bind('load', function() {
            $wrap.removeClass('loading');
        });
        $wrap.addClass('loading');
        $img[0].src = $img[0].src.replace(/\&[^&]*$/, '') + '&' + (+new Date());
    });
    window.newcode = function(id) {
        id = id || 1;
        $('.checkcode' + id).nextAll('.checkcode-new').trigger('click');
    };
    window.getCode = function(id) {
        id = id || 1;
        var $wrap = $('.checkcode' + id).parent();
        var selects = [];
        $wrap.find('.checkcode-select.select').each(function() {
            var i = $(this).data('index');
            selects.push((i % 4) * 71 + 30);
            selects.push(parseInt(i / 4) * 71 + 30);
        });
        return selects;
    };
    $(document).on('click', '.checkcode-select', function(e) {
        $(e.target).toggleClass('select');
    });
    function init() {
        $('.checkcode').each(function() {
            var $wrap = $(this).parent();
            $('<div class="checkcode-new"></div>').appendTo($wrap);
            for (var i = 0; i < 8; i++) {
                $('<div class="checkcode-select"></div>')
                    .css({
                        top: parseInt(i / 4) * 71 + 40,
                        left: (i % 4) * 71 + 5
                    })
                    .data('index', i)
                    .appendTo($wrap);
            }
        });
    }
    init();
});
//alarm
$(function() {
    window.alarm = {
        view: $('#alarm'),
        audio: $("#alarm_audio").get(0),
        alertAudio: $("#alarm_alert_audio").get(0),
        show: function() {
            var that = alarm;
            that.view.show();
            that.audio.load();
            that.audio.play();
            $('.alarm_switch').text('关闭声音');
            that._alertTitle();
        },
        alert: function () {
            var that = alarm;
            that.view.show();
            that.alertAudio.load();
            that.alertAudio.play();
            $('.alarm_switch').text('关闭声音');
            that._alertTitle();
        }, 
        hide: function() {
            var that = alarm;
            that.view.hide();
            that.audio.pause();
            that.alertAudio.pause();
            $('.alarm_switch').text('试听声音');
            that._cancleAlertTitle();
        },
        _switch: function() {
            if (alarm.view.css('display') == 'block') {
                alarm.hide();
            } else {
                alarm.show();
            }
        }, 
        _alertTitle: function() {
            this._titleBack = document.title; 
            var title = ''; 
            this._alertTitleInterval = setInterval(function() {
                title = title.indexOf('*') === -1
                    ? '****'
                    : ''; 
                title = title + Math.random().toString().substr(2);
                document.title = title; 
            }, 150);
        },
        _cancleAlertTitle: function() {
            if (this._alertTitleInterval) {
                clearInterval(this._alertTitleInterval);
                this._alertTitleInterval = null;
                document.title = this._titleBack;
            }
        }
        
    };
    $(document).on('click', '.alarm_show', alarm.show);
    $(document).on('click', '.alarm_hide', alarm.hide);
    $(document).on('click', '.alarm_switch', alarm._switch);
});

$(function() {
    window.interact = {
        getInputInfo: function () {
            var trains = [];
            $.each($('#trains_list .item'), function() {
                trains.push({
                    no: $(this).attr('_train'), 
                    type: $(this).attr('_type')
                });
            });
            var passengers = [];
            $('#passenger_list .item').each(function() {
                var jthis = $(this);
                passengers.push({
                    name: jthis.attr('_name'),
                    id: jthis.attr('_id'), 
                    type: jthis.attr('_type')
                });
            });
            return {
                from: station_names[$('#from_station').val()], 
                to: station_names[$('#to_station').val()], 
                date: $('#train_date').val(), 
                duration: +$('#query_duration').val(),
                trains: trains, 
                passengers: passengers, 
                isStr: $('#stu')[0].checked
            };  
        },
        switchDest: function() {
            var a = $('#from_station'),
                b = $('#to_station');
            var v = a.val();
            a.val(b.val());
            b.val(v);
            setTimeout(function() {
                interact.loadAvailableTrains();
            }, 1);
        },
        del_item: function() {
            $(this).closest('.item').remove();
        },
        loadAvailableTrains: function() {
            var from = station_names[$('#from_station').val()],
                to = station_names[$('#to_station').val()],
                date = $('#train_date').val();

            if (!from || !to) {
                return;
            }
            var trains = $('#available_trains'),
                $data = from + '_' + to + '_' + date;
            if (trains.attr('_data') == $data) {
                return;
            }
            trains.attr('_data', $data);

            log('获取列车列表..');
            R.query(from, to, date, false).done(function (data) {
                if (trains.attr('_data') != $data) {
                    return;
                }
                trains.empty();
                $.each(data, function() {
                    trains.append(template('available_train_item', {
                        train: this['queryLeftNewDTO']['station_train_code']
                    }));
                });
                $('#trains_list .item').remove();
                log('获取列车列表成功');
            }).fail(function () {
                log('获取列车列表失败');
            });
        },
        addTrain: function() {
            var train = $('#available_trains option:selected').text(),
                type = $('#available_train_type option:selected').val(),
                typeName = $('#available_train_type option:selected').text();
            if (!train) {
                return;
            }

            var list = $('#trains_list');
            if (
                list.find('.item[_train=' + train + '][_type=' + type + ']')
                    .length
            ) {
                return;
            }
            list.append(template('train_item', {
                type: type,
                typeName: typeName,
                train: train
            }));
        },
        _addPassenger: function(p) {
            var list = $('#passenger_list');
            if (p.name == '' 
                || p.id.length != 18 
                || list.find('.item[_id=' + p.id + ']').length
            ) {
                return false;
            }

            if (list.find('.item').length >= 5) {
                log('最多5位乘客！');
                return false;
            }

            list.append(template('t_passenger', p));
            return true;
        },
        addNewPassenger: function() {
            this._addPassenger({
                name: $('#new_p_name'),
                id: $('#new_p_id'),
                type: $('#new_p_type option:selected').val(),
                oldType: $('#new_p_type option:selected').val(),
                typeName: $('#new_p_type option:selected').text()

            });
        },
        addOldPassenger: function() {
            var o = $('#old_p option:selected'),
                t = $('#old_p_type option:selected');
            if (o.length == 0) {
                return;
            }
            this._addPassenger({
                name: o.attr('_name'),
                id: o.attr('_id'),
                oldType: o.attr('_type'),
                type: t.val(),
                typeName: t.text()
            });
        },
        loadMyPassengers: function() {
            log('获取已存乘客..');
            R.getTokens().then(function () {
                return R.getMyPassengers();
            }).done(function (data) {
                log('获取已存乘客成功');
                var options = $('#old_p').empty();
                $.each(data, function() {
                    options.append(template('t_old_p', {
                        name: this['passenger_name'],
                        id: this['passenger_id_no'],
                        type: this['passenger_type']
                    }));
                });
            }).fail(function () {
                log('获取已存乘客失败，是否登陆了？');
            });
        },
        autoSubmitOrder: function() {
            var ipt = getCode(2);
            var code = ipt.join(',');
            if (ipt.length) {
                return;
            }
            log('验证验证码： ' + code + " 中...");
            R.checkRandCode(2, code).done(function () {
                alarm.hide();
                log('验证码正确，自动提交订单！');
                grabber.submitOrder(code);
            }).fail(function () {
                log('验证码： ' + code + " 错误！");
            });
        },
        logout: function() {
            log('退出登陆中..');
            R.logout().done(function () {
                log('退出登陆成功！');
                newcode(1);
            });
        },
        login: function() {
            var user = $.trim($('#user').val());
            var pwd = $.trim($('#pwd').val());
            var code = getCode(1).join(',');
            log('登陆中..');
            R.login(user, pwd, code).done(function () {
                log('登陆成功');
                interact.loadMyPassengers();
            }).fail(function () {
                log('登陆失败！');
            });
        }
    };

    $(document).on('click', '.delete_item', interact.del_item);
    $('.switch_dest').click($.proxy(interact, 'switchDest'));
    $('.add_train').click($.proxy(interact, 'addTrain'));
    $('.new_p_add').click($.proxy(interact, 'addNewPassenger'));
    $('.old_p_add').click($.proxy(interact, 'addOldPassenger'));

    $('.login').click($.proxy(interact, 'login'));
    $('.logout').click($.proxy(interact, 'logout'));

    $('.query').click($.proxy(grabber, 'query'));
    $('.stop_query').click($.proxy(grabber, 'stop'));

    setTimeout(function() {
        interact.loadAvailableTrains();
        interact.loadMyPassengers();
    }, 300);
});

$(function() {
    var Resign = {
        switchModel: function(e) {
            var that = Resign;
            if (grabber.tourFlag == 'gc') {
                grabber.tourFlag = 'dc';
                $('.noresign').show();
                $('.resign').hide();
                $(this).text('改签抢票');
            } else {
                grabber.tourFlag = 'gc';
                $('.resign').show();
                $('.noresign').hide();
                that.loadAvailableTickets();
                $(this).text('订购新票');
            }
        },
        loadAvailableTickets: function() {
            var container = $('#tickets');
            container.empty();
            return R.getTictets().done(function (data) {
                $.each(data, function() {
                    $.each(this['tickets'], function() {
                        var t = this;
                        if (t['ticket_status_code'] != 'a') {
                            return;
                        }
                        container.append(template('t_available_ticket', {
                            from: t['stationTrainDTO']['from_station_name'],
                            to: t['stationTrainDTO']['to_station_name'],
                            date: t['start_train_date_page'].substr(0, 10),
                            name: t['passengerDTO']['passenger_name'],
                            id: t['passengerDTO']['passenger_id_no'],
                            type: t['ticket_type_name'],
                            seatName: 
                                t['seat_type_name'] + '-' + t['seat_name'],
                            train: t['stationTrainDTO']['station_train_code']
                        }));
                        $.data(
                            container.find('option:last').get(0), 'ticket', t
                        );
                    });
                });
            }).fail(function () {
                log('load tickets fail..');
            });
        },
        addTicketToResign: function() {
            var op = $('#tickets option:selected').get(0);
            if (!op) {
                return;
            }
            var t = $.data(op, 'ticket');
            var added = false;
            $('#resign_tickets .item').each(function() {
                if ($.data(this, 'ticket') == t) {
                    added = true;
                    return false;
                }
            });
            if (added) {
                return;
            }
            var data = {
                from: t['stationTrainDTO']['from_station_name'],
                to: t['stationTrainDTO']['to_station_name'],
                date: t['start_train_date_page'].substr(0, 10),
                name: t['passengerDTO']['passenger_name'],
                id: t['passengerDTO']['passenger_id_no'],
                type: t['ticket_type_name'],
                seatName: t['seat_type_name'] + '-' + t['seat_name'],
                train: t['stationTrainDTO']['station_train_code']
            };
            $('#resign_tickets').append(template('t_ticket_to_resign', data));
            $.data($('#resign_tickets .item:last').get(0), 'ticket', t);
            $('#from_station').val(data.from);
            $('#to_station').val(data.to);
            $('#train_date').val(data.date);
            interact.loadAvailableTrains();
        }
    };

    $('.resign_btn').click(Resign.switchModel);
    $('.resign_add').click(Resign.addTicketToResign);
});

(function() {
    var Run = function() {
        this.running = false;
        this.needStop = false;
    };
    $.extend(Run.prototype, {
        run: function() {
            if (this.running) {
                return false;
            } else {
                this.running = true;
                return true;
            }
        },
        isStopped: function() {
            if (!this.running || this.needStop) {
                this.running = false;
                this.needStop = false;
                return true;
            }
            return false;
        },
        stop: function() {
            this.needStop = true;
        }
    });

    var grabber = {
        r: new Run(),
        item: null,
        tourFlag: "dc",
        isStu: false,
        _query: function () {
            var me = this;
            var dtd = $.Deferred();
            var queryCount = 0;
            var task = function () {
                queryCount++;
                var inputInfo = interact.getInputInfo();
                if (me.r.isStopped()) {
                    dtd.reject();
                    return;
                }
                me._queryForOneAvailableItem().done(function (item) {
                    if (item) {
                        dtd.resolve(item);
                    } else {
                        setTimeout(task, inputInfo.duration);
                    }
                }).fail(function () {
                    setTimeout(task, inputInfo.duration);
                });
                if (queryCount % 10 === 1) {
                    R.checkUser().fail(function () {
                        log('登陆信息失效，请重新登陆。');
                        alarm.alert();
                        me.r.stop();
                    });
                }
            };
            R.getLoginKey('query', true).done(function () {
                task();
            }).fail(function () {
                dtd.reject();
            });
            return dtd.promise();
        },
        _queryForOneAvailableItem: function () {
            var me = this;
            var inputInfo = interact.getInputInfo();
            if (inputInfo.trains.length == 0) {
                log('请选择车次！');
            }
            // 如果勾选了学生票，交换性的查询成人票和学生票
            // 在服务器端两个页面cache更新的时间不同。
            // 黄牛囤积的票一般都卖给成人，所以学生票可以很容易地从黄牛手中抢到
            me.isStu = inputInfo.isStu ? !me.isStu : false;
            log(me.isStu ? '查询学生票...' : '查询成人票...');
            return R.query(
                inputInfo.from, inputInfo.to, inputInfo.date, me.isStu
            ).then(function (data) {
                var availableItem = null;
                $.each(inputInfo.trains, function(i, trainItem) {
                    var item = me._findTrainItem(data, trainItem.no);
                    if (!item) {
                        return true;
                    }
                    var info = item['queryLeftNewDTO'];
                    log(
                        '%0：%1', 
                        info['station_train_code'], 
                        item['buttonTextInfo']
                    );
                    if (item['buttonTextInfo'] == '预订') {
                        log(
                            '硬座：%0 无座：%1 硬卧：%2 二等座：%3 一等座：%4', 
                            info.yz_num, info.wz_num, 
                            info.yw_num, info.ze_num, info.zy_num
                        );
                        var seatKey = trainItem.type + '_num';
                        if (info[seatKey] 
                            && info[seatKey] != '无' 
                            && info[seatKey] != '--'
                        ) {
                            availableItem = 
                                $.extend(item, {seatType: trainItem.type});
                            return false;
                        }
                    }
                });
                return availableItem;
            }).fail(function () {
                log('query fail');
            });
        }, 
        getTrains: function() {
            var items = [];
            $.each($('#trains_list .item'), function() {
                items.push([$(this).attr('_train'), $(this).attr('_type')]);
            });
            return items;
        },
        _findTrainItem: function(data, name) {
            var theTrain = null;
            $.each(data, function(i, item) {
                if (item.queryLeftNewDTO.station_train_code.toUpperCase() 
                    === name.toUpperCase()
                ) {
                    theTrain = item;
                    return false;
                }
            });
            return theTrain;
        },
        initDc: function() {
            return this._submitOrderRequest(R.getTokens);
        },
        _submitOrderRequest: function(tokenGetter) {
            var me = this;
            var item = me.item;
            return R.submitOrderRequest(
                item, me.tourFlag, me.isStu
            ).then(function () {
                return tokenGetter.call(R);
            }).done(function () {
                newcode(2);
                alarm.show();
                log('token: %0 keyChange: %1', R.submitToken, R.keyChange);
                log('请立刻输入 验证码2 ，验证码输入正确后将自动提交订单');
            }).fail(function () {
                log('fail..');
            });
        },
        _getPassengers: function(passengerDTOs, types, t) {
            var seats = {
                yz: 1,
                wz: 1,
                yw: 3,
                ze: 'O',
                zy: 'M'
            };
            var seatType = seats[this.item.seatType];
            var ps = [],
                oldps = [];
            $.each(passengerDTOs, function(idx, item) {
                var id = item['passenger_id_no'],
                    name = item['passenger_name'],
                    ticket_type = types[idx];
                ps.push(
                    [seatType, 0, ticket_type, name, 1, id, '', t].join(',')
                );
                oldps.push([name, 1, id, ticket_type].join(','));
            });
            return {
                ps: ps.join('_'),
                oldps: oldps.join('_') + '_',
                length: ps.length
            };
        },
        getPassengers: function() {
            var passengerDTOs = [],
                types = [],
                t = 'N';
            $('#passenger_list .item').each(function() {
                var jthis = $(this);
                var name = jthis.attr('_name'),
                    id = jthis.attr('_id'),
                    type = jthis.attr('_type');
                passengerDTOs.push({
                    passenger_id_no: id,
                    passenger_name: name
                });
                types.push(type);
            });
            return this._getPassengers(passengerDTOs, types, t);
        },
        _submitOrder: function(ocode) {
            var me = this;
            var passengers = me.getPassengers();
            if (!passengers.length) {
                log('请选择乘客！');
                return $.Deferred().reject().promise();
            }
            var item = me.item,
                ps = passengers['ps'],
                oldps = passengers['oldps'];
            log('ps:' + ps);
            log('oldPs:' + oldps);

            return R.checkOrderInfo(
                ps, oldps, ocode, me.tourFlag
            ).then(function () {
                return R.confirmSingleForQueue(
                    ps, oldps, ocode, item
                );
            });
        }
    };

    //改签
    $.extend(grabber, {
        initGc: function() {
            var me = this;
            var tickets = me.getTickets();
            if (!tickets.length) {
                log('请选择需要改签的车票！');
                return $.Deferred().reject().promise();
            }
            return R.getTictets().then(function () {
                return R.resginTicket(tickets);
            }).then(function () {
                return me._submitOrderRequest(R.getResignTokens);
            });
        },
        getTickets: function() {
            var tickets = [];
            $('#resign_tickets .item').each(function() {
                tickets.push($.data(this, 'ticket'));
            });
            return tickets;
        },
        getResignPassengers: function() {
            var passengerDTOs = [],
                types = [],
                t = 'Y';
            $('#resign_tickets .item').each(function() {
                var ticket = $.data(this, 'ticket');
                passengerDTOs.push(ticket['passengerDTO']);
                types.push(ticket['ticket_type_code']);
            });
            return this._getPassengers(passengerDTOs, types, t);
        },
        _submitResignOrder: function(ocode) {
            var me = this;
            var passengers = me.getResignPassengers();
            if (!passengers.length) {
                log('请选择乘客！');
                return $.Deferred().reject().promise();
            }
            var item = me.item;
            var ps = passengers['ps'];
            var oldps = passengers['oldps'];
            log('ps:' + ps);
            log('oldPs:' + oldps);

            return R.checkOrderInfo(ps, oldps, ocode, me.tourFlag)
                .then(function () {
                return R.confirmResignForQueue(
                    ps, oldps, ocode, item
                );
            });
        }
    });

    $.extend(grabber, {
        query: function() {
            var me = this;
            if (!me.r.run()) {
                return;
            }
            me._query().done(function (item) {
                window.GET_TRAIN_TIME = +new Date();
                me.item = item;
                var next = me.tourFlag == 'dc' 
                    ? me.initDc : me.initGc;
                next.call(me).always(function () {
                    me.stop();
                });
            }).fail(function () {
                me.stop();
            });
        },
        stop: function() {
            this.r.stop();
            this.r.isStopped();
        },
        submitOrder: function(ocode) {
            var me = this;
            if (!me.r.run()) {
                return;
            }
            var submitFun = me.tourFlag === 'gc' 
                ? me._submitResignOrder : me._submitOrder;
            submitFun.call(me, ocode).done(function () {
                me.stop();
                log(
                    '提交订单成功，耗时: %0s，请点击查看订单前往12306完成付款。', 
                    formatFloat((+new Date() - GET_TRAIN_TIME) / 1000, '.3')
                );
            }).fail(function () {
                me.stop();
                log('提交订单失败！');
            });
        }
    });

    $.extend(window, {
        grabber: grabber
    });

})();
