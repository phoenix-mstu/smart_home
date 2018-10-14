function HeaterPump(valve) {
    var heaters = [];
    var on_heaters_counter = 0;

    this.addDependentHeater = function (heater) {
        heaters[heaters.length] = heater;
    };
    this.incOnHeaters = function () {
        on_heaters_counter++;
        if (on_heaters_counter === 1) {
            heaters.forEach(function(heater) {heater.enable()});
            dev["wb-gpio"][valve] = 1;
            log("Boiler on");
        }
    };
    this.decOnHeaters = function () {
        on_heaters_counter--;
        if (on_heaters_counter === 0) {
            heaters.forEach(function(heater) {heater.disable()});
            dev["wb-gpio"][valve] = 0;
            log("Boiler off");
        }
    };

    ////////////
    // INIT
    setTimeout(function () {
        if (on_heaters_counter === 0) {
            dev["wb-gpio"][valve] = 0;
        } else {
            dev["wb-gpio"][valve] = 1;
        }
    }, 1000);
}


function Heater(valve, on_signal, pumps) {
    var self = this;
    var off_signal = on_signal ? 0 : 1;

    var is_on = false;
    var enable_counter = 0;
    var last_valve_state = -1;

    var applyStateChange = function () {
        var new_valve_state = (enable_counter === pumps.length) ? (is_on ? on_signal : off_signal) : 0;
        if (last_valve_state !== new_valve_state) {
            log('Change state ' + valve + ' ' + new_valve_state.toString());
            last_valve_state = new_valve_state;
            dev["wb-gpio"][valve] = new_valve_state;
        }
    };
    this.on = function () {
        if (is_on) return; is_on = true;
        log('on ' + valve);
        pumps.forEach(function(pump) {pump.incOnHeaters()});
        applyStateChange();
    };
    this.off = function () {
        if (!is_on) return; is_on = false;
        log('off ' + valve);
        pumps.forEach(function(pump) {pump.decOnHeaters()});
        applyStateChange();
    };
    this.enable = function () {
        enable_counter++;
        applyStateChange();
    };
    this.disable = function () {
        enable_counter--;
        applyStateChange();
    };

    ////////////
    // INIT
    pumps.forEach(function(pump) {pump.addDependentHeater(self)});
    setTimeout(function () {
        applyStateChange();
    }, 1000);
}

BoilerPump = new HeaterPump("BOILER_SWITCH");
FloorPump =  new HeaterPump("FLOOR_PUMP");

StoreHeater =       new Heater("VALVE_STORE",              1, [BoilerPump]);
Towel2Heater =      new Heater("VALVE_TOWEL2",             0, [BoilerPump]);
Towel1Heater =      new Heater("VALVE_TOWEL1",             0, [BoilerPump]);
PlayroomHeater =    new Heater("VALVE_PLAYROOM",           1, [BoilerPump]);
BedroomHeater =     new Heater("VALVE_BEDROOM",            1, [BoilerPump]);
LivingWallHeater =  new Heater("VALVE_LIVING_WALLHEATER",  1, [BoilerPump]);
LivingFloorHeater = new Heater("VALVE_LIVING_FLOORHEATER", 1, [BoilerPump]);

LivingWallFloorHeater =  new Heater("VALVE_FLOOR_LIVINGWALL",  1, [BoilerPump, FloorPump]);
LaundryFloorHeater =     new Heater("VALVE_FLOOR_LAUNDRY",     0, [BoilerPump, FloorPump]);
KitchenFloorHeater =     new Heater("VALVE_FLOOR_KITCHEN",     0, [BoilerPump, FloorPump]);
BathroomFloorHeater =    new Heater("VALVE_FLOOR_BATHROOM",    0, [BoilerPump, FloorPump]);
LivingTableFloorHeater = new Heater("VALVE_FLOOR_LIVINGTABLE", 0, [BoilerPump, FloorPump]);
