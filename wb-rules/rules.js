economy_mode = false;
service_mode = false;
service_floor_on = true;
disable_floor = true;


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
                valve: BedroomHeater,
                temp_min: economy_mode ? 1600 : 2200
            },
            playroom: {
                sensor: "sensor_ht_158d00010becc6_temperature", // playroom
                valve: PlayroomHeater,
                temp_min: economy_mode ? 1600 : 2500
            },
            living: {
                sensor: "sensor_ht_158d00010bed71_temperature", // living
                valve: LivingWallHeater,
                temp_min: economy_mode ? 1600 : 2500
            },
            // living_floor: {
            //     sensor: "sensor_ht_158d00010bed71_temperature", // living
            //     valves: ["VALVE_FLOOR_LAUNDRY", "VALVE_FLOOR_LIVINGTABLE", "VALVE_FLOOR_LIVINGWALL", "VALVE_FLOOR_KITCHEN"],
            //     temp_min: economy_mode ? 1000 : 2400
            // }
        };
        log('==== temp ====');
        for (var name in rooms) {
            if (rooms.hasOwnProperty(name)) {
                var room = rooms[name];
                var temp = dev["xiaomi"][room.sensor];
                if (temp < room.temp_min) {
                    log(name + ' on - ' + temp);
                    room.valve.on();
                } else {
                    log(name + ' off - ' + temp);
                    room.valve.off();
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









