economy_mode = false;
service_mode = false;
service_floor_on = true;
disable_floor = true;


defineRule("temperature", {
    whenChanged: [
	    "xiaomi/t_bedroom_temperature",
	    "xiaomi/t_playroom_temperature",
	    "xiaomi/t_living_temperature",
        "xiaomi/t_laundry_temperature",
        "xiaomi/t_bathroom_temperature"
    ],
    then: function(newValue, devName, cellName) {
        var rooms = {
            bedroom: {
                sensor: "t_bedroom_temperature", // bedroom
                valve: BedroomHeater,
                temp_min: economy_mode ? 16.00 : 22.00
            },
            playroom: {
                sensor: "t_playroom_temperature", // playroom
                valve: PlayroomHeater,
                temp_min: economy_mode ? 16.00 : 25.00
            },
            living: {
                sensor: "t_living_temperature", // living
                valve: LivingWallHeater,
                temp_min: economy_mode ? 16.00 : 24.00
            },
            living_fl: {
                sensor: "t_living_temperature", // living
                valve: LivingFloorHeater,
                temp_min: economy_mode ? 16.00 : 24.00
            },
            laundry: {
                sensor: "t_laundry_temperature",
                valve: Towel1Heater,
                temp_min: economy_mode ? 16.00 : 24.00
            },
            bathroom: {
                sensor: "t_bathroom_temperature",
                valve: Towel2Heater,
                temp_min: economy_mode ? 16.00 : 24.00
            },
            store: {
                sensor: "t_store_temperature",
                valve: StoreHeater,
                temp_min: economy_mode ? 16.00 : 24.00
            }
        };
        log('==== temp ====');
        for (var name in rooms) {
            if (rooms.hasOwnProperty(name)) {
                var room = rooms[name];
                var temp = dev["xiaomi"][room.sensor];
                if (temp < room.temp_min) {
                    log(name + ' on - ' + temp);
                    room.valve.on('t_control');
                } else {
                    log(name + ' off - ' + temp);
                    room.valve.off('t_control');
                }
            }
        }
        // heaters_on = need_boiler;
        // processBoilerStatus();

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

// defineRule("floor_heating", {
//     when: cron("@every 5m"),
//     then: function () {
//         log('==== floor_cron ====');
//         var valves = ["VALVE_FLOOR_LAUNDRY", "VALVE_FLOOR_BATHROOM", "VALVE_TOWEL2", "VALVE_STORE"];
//
//         floor_on = !economy_mode && !disable_floor;
//
//         switchValves(valves, floor_on ? 1 : 0);
//         processBoilerStatus();
//         log('==============');
//     }
// });









