


function makeLightRule(name, detector_control, relay_control, timeout) {
  var timer = false;
  defineRule(name, {
      whenChanged: "wb-gpio/" + detector_control,
      then: function(newValue, devName, cellName) {
          if (newValue) {
              log('switch ' + detector_control + ' - ' + relay_control);

              var is_on = dev["wb-gpio"][relay_control];
              dev["wb-gpio"][relay_control] = is_on ? 0 : 1;

              if (timer) {
                  clearTimeout(timer);
                  timer = false;
              }
              if (timeout && !is_on) {
                  timer = setTimeout(function () {
                      dev["wb-gpio"][relay_control] = 0;
                      timer = false;
                  }, timeout * 1000);
              }
          }
      }
  });
}

function makeLightSceneRule(name, detector_control, relay_to_set_array) {
  defineRule(name, {
      whenChanged: "wb-gpio/" + detector_control,
      then: function(newValue, devName, cellName) {
          if (newValue) {
              var changed = false;
              for (var i in relay_to_set_array) {
                  if (dev["wb-gpio"][i] !== relay_to_set_array[i]) {
                      dev["wb-gpio"][i] = relay_to_set_array[i];
                      changed = true;
                  }
              }
          }
      }
  });
}

function switchArray(devices, value) {
    for (var i in devices) {
        if (devices.hasOwnProperty(i)) dev["wb-gpio"][devices[i]] = value;
    }
}

var floor_on = false;
var heaters_on = false;

function processBoilerStatus() {
    if (heaters_on || floor_on) {
        log('boiler on');
        dev["wb-gpio"]["BOILER_SWITCH"] = 1;
        if (floor_on) {
            log('floor on');
            dev["wb-gpio"]["FLOOR_PUMP"] = 1;
        } else {
            log('floor off');
            dev["wb-gpio"]["FLOOR_PUMP"] = 0;
        }
    } else {
        log('boiler off');
        log('floor off');
        dev["wb-gpio"]["BOILER_SWITCH"] = 0;
        dev["wb-gpio"]["FLOOR_PUMP"] = 0;
    }
}

defineRule("temperature", {
    whenChanged: [
	    "xiaomi/sensor_ht_158d00010bec80_temperature",
	    "xiaomi/sensor_ht_158d00010becc6_temperature",
	    "xiaomi/sensor_ht_158d00010bed71_temperature"
    ],
    then: function(newValue, devName, cellName) {
        var rooms = {
            bedroom: {
                sensor: "sensor_ht_158d00010bec80_temperature", // bedroom
                plus_valves: ["VALVE_BEDROOM"],
                minus_valves: [],
                temp_min: 2400,
                temp_max: 2500
            },
            playroom: {
                sensor: "sensor_ht_158d00010becc6_temperature", // playroom
                plus_valves: ["VALVE_PLAYROOM"],
                minus_valves: [],
                temp_min: 2400,
                temp_max: 2500
            },
            living: {
                sensor: "sensor_ht_158d00010bed71_temperature", // living
                plus_valves: ["VALVE_LIVING_WALLHEATER"],
                minus_valves: [],
                temp_min: 2300,
                temp_max: 2400
            }
        };
        var need_boiler = false;
        log('==== temp ====');
        for (var name in rooms) {
            if (rooms.hasOwnProperty(name)) {
                var room = rooms[name];
                var temp = dev["xiaomi"][room.sensor];
                if (temp < room.temp_min) {
                    log(name + ' on - ' + temp);
                    switchArray(room.plus_valves, 1);
                    switchArray(room.minus_valves, 0);
                    need_boiler = true;
                } else {
                    log(name + ' off - ' + temp);
                    switchArray(room.plus_valves, 0);
                    switchArray(room.minus_valves, 1);
                }
            }
        }
        heaters_on = need_boiler;
        processBoilerStatus();
        log('==============');
    }
});

defineRule("floor_heating", {
    when: cron("@every 20m"),
    then: function () {
        log('==== floor_cron ====');
        var valves = ["VALVE_FLOOR_KITCHEN", "VALVE_FLOOR_LAUNDRY", "VALVE_FLOOR_BATHROOM", "VALVE_TOWEL1", "VALVE_TOWEL2"];
        var valves_off = ["VALVE_FLOOR_LIVINGTABLE", "VALVE_FLOOR_LIVINGWALL"];
        switchArray(valves_off, 1); // выключаем всегда
        floor_on = !floor_on;
        switchArray(valves, floor_on ? 0 : 1);
        processBoilerStatus();
        log('==============');
    }
});

makeLightSceneRule("big_0", "SWITCH_LIVING_BIG0", {
LIGHT_LIVING_WALL: 0, // wall
LIGHT_LIVING_TABLE: 0, // table
LIGHT_LIVING_KITCHEN_BL: 0, // kitchen
LIGHT_LIVING_KITCHEN: 0, // kitchen+
LIGHT_LIVING_CENTER: 0 // center
});
makeLightSceneRule("big_1", "SWITCH_LIVING_BIG1", {
LIGHT_LIVING_WALL: 0,
LIGHT_LIVING_TABLE: 1,
LIGHT_LIVING_KITCHEN_BL: 1,
LIGHT_LIVING_KITCHEN: 0,
LIGHT_LIVING_CENTER: 0
});
makeLightSceneRule("big_2", "SWITCH_LIVING_BIG2", {
LIGHT_LIVING_WALL: 1,
LIGHT_LIVING_TABLE: 1,
LIGHT_LIVING_KITCHEN_BL: 1,
LIGHT_LIVING_KITCHEN: 0,
LIGHT_LIVING_CENTER: 0
});
makeLightSceneRule("big_3", "SWITCH_LIVING_BIG3", {
LIGHT_LIVING_WALL: 1,
LIGHT_LIVING_TABLE: 0,
LIGHT_LIVING_KITCHEN_BL: 0,
LIGHT_LIVING_KITCHEN: 1,
LIGHT_LIVING_CENTER: 0
});
makeLightSceneRule("big_4", "SWITCH_LIVING_BIG4", {
LIGHT_LIVING_WALL: 1,
LIGHT_LIVING_TABLE: 1,
LIGHT_LIVING_KITCHEN_BL: 1,
LIGHT_LIVING_KITCHEN: 1,
LIGHT_LIVING_CENTER: 1
});




// old big light
// makeLightRule("23n", "SWITCH_LIVING_BIG1", "LIGHT_LIVING_TABLE");
// makeLightRule("23_1n", "SWITCH_LIVING_BIG1", "LIGHT_LIVING_KITCHEN_BL");
// makeLightRule("1n", "SWITCH_LIVING_BIG2", "LIGHT_LIVING_WALL");
// makeLightRule("26n", "SWITCH_LIVING_BIG3", "LIGHT_LIVING_KITCHEN");
// makeLightRule("31n", "SWITCH_LIVING_BIG4", "LIGHT_LIVING_CENTER");

makeLightRule("2", "SWITCH_LAUNDRY_EXT1", "LIGHT_LAUNDRY_MAIN");
makeLightRule("3", "EXT5_DR12", "EXT1_K4");

//makeLightRule("4", "EXT2_DR13", "EXT1_K1");
//makeLightRule("5", "EXT2_DR13", "LIGHT_LIVING_KITCHEN_BL");
//makeLightRule("6", "EXT2_DR13", "EXT1_K3");
//makeLightRule("7", "EXT2_DR13", "EXT1_K4");
//makeLightRule("8", "EXT2_DR13", "EXT1_K5");
//makeLightRule("9", "EXT2_DR13", "EXT1_K6");
//makeLightRule("10", "EXT2_DR13", "BOILER_SWITCH");
//makeLightRule("10", "EXT2_DR13", "EXT1_K7");
//makeLightRule("11", "EXT2_DR13", "EXT1_K8");
//makeLightRule("12", "EXT2_DR13", "LIGHT_LAUNDRY_MAIN");
//makeLightRule("13", "EXT2_DR13", "LIGHT_LIVING_WALL");
//makeLightRule("14", "EXT2_DR13", "EXT1_K11");
//makeLightRule("15", "EXT2_DR13", "LIGHT_LIVING_KITCHEN");
//makeLightRule("16", "EXT2_DR13", "LIGHT_LIVING_CENTER");
//makeLightRule("17", "EXT2_DR13", "LIGHT_LIVING_TABLE");
//makeLightRule("18", "EXT2_DR13", "EXT1_K15");
//makeLightRule("19", "EXT2_DR13", "EXT1_K16");

makeLightRule("20", "EXT5_DR6", "EXT3_K7");
makeLightRule("21", "SWITCH_HALL1_DOOR1", "LIGHT_HALL1");
makeLightRule("22", "EXT2_DR8", "EXT3_K6");

makeLightRule("24", "EXT2_DR7", "EXT1_K5");
makeLightRule("25", "EXT5_DR5", "EXT1_K11");



makeLightRule("27", "EXT5_DR10", "EXT4_R3A5");
makeLightRule("28", "EXT5_DR9", "EXT1_K1");
makeLightRule("29", "EXT2_DR16", "EXT4_R3A1");
makeLightRule("30", "EXT5_DR11", "EXT1_K8");


makeLightRule("32", "SWITCH_LAUNDRY_IN", "LIGHT_LAUNDRY_MIRROR");

// fan works half an hour
makeLightRule("33", "SWITCH_LAUNDRY_EXT2", "FAN_LAUNDRY", 30*60);
