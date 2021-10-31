
function DeviceHeatAbstract(name) {

    var on_sources = {};

    this._isOn = false;
    this._isEnabled = false;
    this._last_wb_value = -1;

    this.applyStateChange = function () {};

    this._send_to_wb = function (value) {
        if (this._last_wb_value !== value) {
            this._last_wb_value = value;
            log('Change state ' + name + ' ' + value.toString());
            dev["wb-gpio"][name] = value;
        }
    };

    this.on = function (source) {
        source = typeof source !== 'undefined' ? source : 'default';
        on_sources[source] = 1;
        this._isOn = true;
    };

    this.off = function (source) {
        source = typeof source !== 'undefined' ? source : 'default';
        delete on_sources[source];
        if (Object.keys(on_sources).length === 0) {
            this._isOn = false;
        }
    };

    this.enable = function () {
        this._isEnabled = true;
    };

    this.disable = function () {
        this._isEnabled = false;
    };

    this.isOn = function () {
        return this._isOn;
    }
}

function DeviceHeatValve(name, on_signal) {
    DeviceHeatAbstract.call(this, name);

    var off_signal = on_signal ? 0 : 1;
    this.applyStateChange = function () {
        this._send_to_wb(this._isEnabled ? (this._isOn ? on_signal : off_signal) : 0);
    };
}

function DeviceFloorHeatSourceValve(name, on_signal) {
    DeviceHeatAbstract.call(this, name);

    var isPumpOn = false;
    var off_signal = on_signal ? 0 : 1;

    this.applyStateChange = function () {
        this._send_to_wb(this._isEnabled ? (this._isOn && isPumpOn ? on_signal : off_signal) : 0);
    };

    this.setPumpOn = function() {
        isPumpOn = true;
    };

    this.setPumpOff = function() {
        isPumpOn = false;
    };

    this.isOn = function () {
        return this._isOn && isPumpOn;
    }
}

function DeviceHeatSource(name, on_timeout) {
    DeviceHeatAbstract.call(this, name);

    var self = this;
    var on_timer;
    var last_value = -1;
    this.applyStateChange = function () {
        var new_value = this._isOn ? 1 : 0;
        if (new_value !== last_value) {
            if (new_value === 1) {
                on_timer = setTimeout(function () {
                    self._send_to_wb(1);
                    on_timer = false;
                }, on_timeout);
            } else {
                self._send_to_wb(new_value);
                if (on_timer) {
                    clearTimeout(on_timer);
                    on_timer = false;
                }
            }
        }
        last_value = new_value;
    };
}

BoilerPump = new DeviceHeatSource("BOILER_SWITCH", 300000);
FloorPump =  new DeviceHeatSource("FLOOR_PUMP", 300000);
FloorDevicesHeatSource  = new DeviceFloorHeatSourceValve("VALVE_STORE", 1);

// StoreHeater =       new DeviceHeatValve("VALVE_STORE",              0);
Towel2Heater =      new DeviceHeatValve("VALVE_TOWEL2",             1);
Towel1Heater =      new DeviceHeatValve("VALVE_TOWEL1",             1);
PlayroomHeater =    new DeviceHeatValve("VALVE_PLAYROOM",           1);
BedroomHeater =     new DeviceHeatValve("VALVE_BEDROOM",            1);
LivingWallHeater =  new DeviceHeatValve("VALVE_LIVING_WALLHEATER",  1);
LivingFloorHeater = new DeviceHeatValve("VALVE_LIVING_FLOORHEATER", 1);

LaundryFloorHeater =     new DeviceHeatValve("VALVE_FLOOR_LAUNDRY",     0);
KitchenFloorHeater =     new DeviceHeatValve("VALVE_FLOOR_KITCHEN",     0);
BathroomFloorHeater =    new DeviceHeatValve("VALVE_FLOOR_BATHROOM",    0);
LivingTableFloorHeater = new DeviceHeatValve("VALVE_FLOOR_LIVINGTABLE", 1);
LivingWallFloorHeater =  new DeviceHeatValve("VALVE_FLOOR_LIVINGWALL",  1);

function HeatControllerFn() {

    var heaters = [
        // StoreHeater,
        Towel2Heater,
        Towel1Heater,
        PlayroomHeater,
        BedroomHeater,
        LivingWallHeater,
        LivingFloorHeater,
        FloorDevicesHeatSource
    ];

    var floor_heaters = [
        LaundryFloorHeater,
        KitchenFloorHeater,
        BathroomFloorHeater,
        LivingTableFloorHeater,
        LivingWallFloorHeater
    ];

    heaters.isOn = floor_heaters.isOn = function () {
        return this.reduce(function (acc, elem) {return acc || elem.isOn() }, false);
    };
    
    heaters.disable = floor_heaters.disable = function () {
        this.forEach(function (dev) {dev.disable()});
    };

    heaters.enable = floor_heaters.enable = function () {
        this.forEach(function (dev) {dev.enable()});
    };

    heaters.apply = floor_heaters.apply = function () {
        this.forEach(function (dev) {dev.applyStateChange()});
    };

    this.applyStateChange = function() {
        if (floor_heaters.isOn()) {
            FloorPump.on();
            FloorDevicesHeatSource.setPumpOn();
            floor_heaters.enable();
        } else {
            FloorPump.off();
            FloorDevicesHeatSource.setPumpOff();
            floor_heaters.disable();
        }
        if (heaters.isOn()) {
            BoilerPump.on();
            heaters.enable();
        } else {
            BoilerPump.off();
            heaters.disable();
        }
        heaters.apply();
        floor_heaters.apply();
        FloorPump.applyStateChange();
        BoilerPump.applyStateChange();
    };
}

HeatController = new HeatControllerFn();

function AvgTemperatureCalc(interval) {
    var values = [];  // слишком большой массив за 30 минут!! много дублей
    this.add = function (temperature) {
        var ts = (new Date()).getTime() / 1000;
        values.push({
            'time': ts,
            'temperature': temperature
        });
        while (values.length > 1 && values[1].time <= ts - interval) {
            values.shift();
        }
        if (values.length > 1) {
            var result = values.reduce(function (acc, value) {
                var summ = 0;
                var delta = 0;
                if (acc !== null) {
                    var dt = value.time - Math.max(ts - interval, acc.prev.time)
                    summ = acc.summ + acc.prev.temperature * dt
                    delta = acc.delta + dt
                }
                return {
                    'summ': summ,
                    'delta': delta,
                    'prev': value
                }
            }, null);
            return result.summ / result.delta
        } else {
            return values[0].temperature;
        }
    }
}

setTimeout(function () {

    var t_in = "28-8000001f1806";
    var t_on = 34;
    var t_off = 36;
    var avg_calc = new AvgTemperatureCalc(30*60)
    var first_run = true

    defineRule("floor_temperature_control", {
        whenChanged: "wb-w1/" + t_in,
        then: function(newValue, devName, cellName) {
            var in_temp = avg_calc.add(dev["wb-w1"][t_in]);
            log('floor avg temp: ' + in_temp);

            if (first_run) {
                first_run = false;
                if (in_temp < (t_on + t_off)/2) {
                    FloorDevicesHeatSource.on();
                } else {
                    FloorDevicesHeatSource.off();
                }
            } else {
                if (in_temp < t_on) {
                    FloorDevicesHeatSource.on();
                }
                if (in_temp > t_off) {
                    FloorDevicesHeatSource.off();
                }
            }
            HeatController.applyStateChange();
        }
    });
}, 1000);