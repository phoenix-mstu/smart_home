// что нужно выставить чтобы открыть клапан
valve_polarity = {
    VALVE_FLOOR_LAUNDRY: 0,
    VALVE_FLOOR_BATHROOM: 0,
    VALVE_TOWEL1: 0,
    VALVE_TOWEL2: 0,
    VALVE_STORE: 1,
    VALVE_FLOOR_LIVINGTABLE: 0,
    VALVE_FLOOR_LIVINGWALL: 1,
    VALVE_FLOOR_KITCHEN: 0,
    
    VALVE_BEDROOM: 1,
    VALVE_PLAYROOM: 1,
    VALVE_LIVING_WALLHEATER: 1,
    VALVE_LIVING_FLOORHEATER: 1
};

economy_mode = false;
service_mode = false;
service_floor_on = true;
disable_floor = true;

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

function switchValves(devices, value) {
    if (service_mode) {
        value = 1;
    }
    for (var i in devices) {
        if (!devices.hasOwnProperty(i)) continue;
        var on = valve_polarity[devices[i]];
        var off = (on === 1) ? 0 : 1;
        dev["wb-gpio"][devices[i]] = (value === 1) ? on : off;
    }
}

var floor_on = false;
var heaters_on = false;

function processBoilerStatus() {
    if (service_mode) {
        heaters_on = false;
        floor_on = service_floor_on;
    }
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
                valves: ["VALVE_BEDROOM"],
                temp_min: economy_mode ? 1600 : 2500
            },
            playroom: {
                sensor: "sensor_ht_158d00010becc6_temperature", // playroom
                valves: ["VALVE_PLAYROOM"],
                temp_min: economy_mode ? 1600 : 2500
            },
            living: {
                sensor: "sensor_ht_158d00010bed71_temperature", // living
                valves: ["VALVE_LIVING_WALLHEATER", "VALVE_LIVING_FLOORHEATER"],
                temp_min: economy_mode ? 1600 : 2500
            },
            // living_floor: {
            //     sensor: "sensor_ht_158d00010bed71_temperature", // living
            //     valves: ["VALVE_FLOOR_LAUNDRY", "VALVE_FLOOR_LIVINGTABLE", "VALVE_FLOOR_LIVINGWALL", "VALVE_FLOOR_KITCHEN"],
            //     temp_min: economy_mode ? 1000 : 2400
            // }
        };
        var need_boiler = false;
        log('==== temp ====');
        for (var name in rooms) {
            if (rooms.hasOwnProperty(name)) {
                var room = rooms[name];
                var temp = dev["xiaomi"][room.sensor];
                if (temp < room.temp_min) {
                    log(name + ' on - ' + temp);
                    switchValves(room.valves, 1);
                    need_boiler = true;
                } else {
                    log(name + ' off - ' + temp);
                    switchValves(room.valves, 0);
                }
            }
        }
        heaters_on = need_boiler;
        processBoilerStatus();

        // -10 => 55k
        //   0 => 32k
        //  10 => 19k
        //  20 => 12k
        //  30 => 8k
        // set boiler temperature ~50C
        // dev["wb-w1"]["2c-00000002ceb5"] = 70000;
        var v = 30000; // 50
        // var v = 70000; // 78
        // var v = 100000;
        dev["wb-w1"]["2c-00000002ceb5"] = 100000 - v;

        log('==============');
    }
});

defineRule("floor_heating", {
    when: cron("@every 5m"),
    then: function () {
        log('==== floor_cron ====');
        var valves = ["VALVE_FLOOR_LAUNDRY", "VALVE_FLOOR_BATHROOM", "VALVE_TOWEL2", "VALVE_STORE"];

        floor_on = !economy_mode && !disable_floor;

        switchValves(valves, floor_on ? 1 : 0);
        processBoilerStatus();
        log('==============');
    }
});


sceene_config = {
    // wall - center - table - kitchen - kitchen lights
    SWITCH_LIVING_BIG0: [0, 0, 0, 0, 0],
    SWITCH_LIVING_BIG1: [0, 0, 1, 0, 1],
    SWITCH_LIVING_BIG2: [1, 0, 1, 0, 1],
    SWITCH_LIVING_BIG3: [1, 0, 0, 1, 0],
    SWITCH_LIVING_BIG4: [1, 1, 1, 1, 1]
};
for (var sw in sceene_config) {
    if (!sceene_config.hasOwnProperty(sw)) continue;
    makeLightSceneRule('scene_' + sw, sw, {
        LIGHT_LIVING_WALL: sceene_config[sw][0],
        LIGHT_LIVING_CENTER: sceene_config[sw][1],
        LIGHT_LIVING_TABLE: sceene_config[sw][2],
        LIGHT_LIVING_KITCHEN: sceene_config[sw][3],
        LIGHT_LIVING_KITCHEN_BL: sceene_config[sw][4]
    })
}

first_floor_lights = [
    "LIGHT_LIVING_WALL",
    "LIGHT_LIVING_TABLE",
    "LIGHT_LIVING_KITCHEN_BL",
    "LIGHT_LIVING_KITCHEN",
    "LIGHT_LIVING_CENTER",
    "LIGHT_LAUNDRY_MAIN",
    "LIGHT_HALL1",
    "LIGHT_LAUNDRY_MIRROR"
];

second_floor_lights = [
    "LIGHT_BEDROOM_CENTER", "LIGHT_HALL2_MAIN", "LIGHT_HALL2_PICTURE", "LIGHT_PLAYROOM_CENTER", "LIGHT_PLAYROOM_LINE", "LIGHT_BEDROOM_SECOND",
    "LIGHT_BATHROOM_MAIN", "LIGHT_BATHROOM_MIRROR", "LIGHT_STORE"
];

makeLightRule("2", "SWITCH_LAUNDRY_EXT1", "LIGHT_LAUNDRY_MAIN");
makeLightRule("3", "SWITCH_HALL2_STAIRS2", "LIGHT_HALL2_MAIN");
makeLightRule("3_1", "SWITCH_HALL2_STAIRS1", "LIGHT_HALL2_PICTURE");

makeLightRule("20", "SWITCH_BEDROOM3", "LIGHT_BEDROOM_CENTER");
makeLightRule("21", "SWITCH_HALL1_DOOR1", "LIGHT_HALL1");

makeLongPressRule("21_1", "SWITCH_HALL1_DOOR2", 2, function() {
    switchArray(first_floor_lights, 0);
    switchArray(second_floor_lights, 0);
});
makeLongPressRule("21_2", "SWITCH_BEDROOM_BED_RIGHT1", 2, function() {
    switchArray(first_floor_lights, 0)
});
makeLongPressRule("21_3", "SWITCH_BEDROOM_BED_LEFT1", 2, function() {
    switchArray(first_floor_lights, 0)
});

makeLightRule("22", "SWITCH_PLAYROOM4", "LIGHT_PLAYROOM_CENTER");

makeLightRule("24", "SWITCH_PLAYROOM3", "LIGHT_PLAYROOM_LINE");
makeLightRule("25", "SWITCH_BEDROOM4", "LIGHT_BEDROOM_SECOND");



makeLightRule("27", "SWITCH_BATHROOM_EXT1", "LIGHT_BATHROOM_MAIN");

makeLightRule("29", "SWITCH_BATHROOM_IN", "LIGHT_BATHROOM_MIRROR");
makeLightRule("30", "SWITCH_STORE", "LIGHT_STORE");


makeLightRule("32", "SWITCH_LAUNDRY_IN", "LIGHT_LAUNDRY_MIRROR");

// fan works half an hour
// makeLightRule("33", "SWITCH_LAUNDRY_EXT2", "FAN_LAUNDRY", 30*60);
// makeLightRule("28", "SWITCH_BATHROOM_EXT2", "FAN_BATHROOM", 30*60);

makeCallFunctionRule("33", "SWITCH_LAUNDRY_EXT2", LaundryFan.manualToggle);
makeCallFunctionRule("28", "SWITCH_BATHROOM_EXT2", BathroomFan.manualToggle);