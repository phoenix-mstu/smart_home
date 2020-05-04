
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
FloorDevicesHeatSource  = new DeviceFloorHeatSourceValve("VALVE_FLOOR_LIVINGWALL", 1);

StoreHeater =       new DeviceHeatValve("VALVE_STORE",              0);
Towel2Heater =      new DeviceHeatValve("VALVE_TOWEL2",             0);
Towel1Heater =      new DeviceHeatValve("VALVE_TOWEL1",             0);
PlayroomHeater =    new DeviceHeatValve("VALVE_PLAYROOM",           1);
BedroomHeater =     new DeviceHeatValve("VALVE_BEDROOM",            1);
LivingWallHeater =  new DeviceHeatValve("VALVE_LIVING_WALLHEATER",  1);
LivingFloorHeater = new DeviceHeatValve("VALVE_LIVING_FLOORHEATER", 1);

// LivingWallFloorHeater =  new DeviceHeatValve("VALVE_FLOOR_LIVINGWALL",  1, [FloorPump]);
LaundryFloorHeater =     new DeviceHeatValve("VALVE_FLOOR_LAUNDRY",     0);
KitchenFloorHeater =     new DeviceHeatValve("VALVE_FLOOR_KITCHEN",     0);
BathroomFloorHeater =    new DeviceHeatValve("VALVE_FLOOR_BATHROOM",    0);
LivingTableFloorHeater = new DeviceHeatValve("VALVE_FLOOR_LIVINGTABLE", 0);

function HeatControllerFn() {

    var heaters = [
        StoreHeater,
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
        LivingTableFloorHeater
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

setTimeout(function () {
    var t_in = "28-8000001f1806";
    var required_t = 35;
    var t_prev = 0;

    var switchValveIfRequired = function(newValue, devName, cellName) {
        var in_temp = dev["wb-w1"][t_in];

        var t_round = Math.round(2 * in_temp) / 2;
        if (t_round < required_t) {
            FloorDevicesHeatSource.on();
            if (t_prev !== t_round) {
                log('floor on. ' + t_round)
            }
        } else {
            FloorDevicesHeatSource.off();
            if (t_prev !== t_round) {
                log('floor off. ' + t_round)
            }
        }
        t_prev = t_round;

        HeatController.applyStateChange();
    };

    switchValveIfRequired();
    defineRule("floor_temperature_control", {
        whenChanged: "wb-w1/" + t_in,
        then: switchValveIfRequired
    });

    // HeatController.applyStateChange();
}, 1000);