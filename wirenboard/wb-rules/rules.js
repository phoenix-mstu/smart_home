economy_mode = false;
service_mode = false;
service_floor_on = true;
disable_floor = true;
min_temperature = 16;
max_temperature = 30;
default_temperature = 22;

var rooms = [
    {
        name: "bedroom",
        sensor: "t_bedroom_temperature", // bedroom
        valve: BedroomHeater,
        temp_min: economy_mode ? 16.00 : 22.00
    },
    {
        name: "playroom",
        sensor: "t_playroom_temperature", // playroom
        valve: PlayroomHeater,
        temp_min: 23.00
    },
    {
        name: "living",
        sensor: "t_living_temperature", // living
        valve: LivingWallHeater,
        temp_min: economy_mode ? 16.00 : 24.00
    },
    // {
    //     name: "",
    //     sensor: "t_living_temperature", // living
    //     valve: LivingFloorHeater,
    //     temp_min: economy_mode ? 16.00 : 24.00
    // },
    {
        name: "laundry",
        sensor: "t_laundry_temperature",
        valve: Towel1Heater,
        temp_min: economy_mode ? 16.00 : 24.00
    },
    {
        name: "bathroom",
        sensor: "t_bathroom_temperature",
        valve: Towel2Heater,
        temp_min: economy_mode ? 16.00 : 25.00
    },
    // {
    //     name: "store",
    //     sensor: "t_store_temperature",
    //     valve: StoreHeater,
    //     temp_min: economy_mode ? 16.00 : 20.00
    // }
];

var cells = {};
var cells_state = {};
rooms.forEach(function (room) {
   cells[room.name] = {
       type: 'range',
       max: max_temperature,
       value: default_temperature
   };
   cells_state[room.name] = {
       type: 'switch',
       value: false
   }
});
defineVirtualDevice('climate_controls', {
    title: "Climate controls",
    cells: cells
});
defineVirtualDevice('climate_heater_state', {
    title: "Climate heater state",
    cells: cells_state
});

defineRule("temperature", {
    whenChanged: rooms.map(function (room) {return "xiaomi/" + room.sensor})
        .concat(rooms.map(function (room) {return "climate_controls/" + room.name})),
    then: function(newValue, devName, cellName) {
        log('==== temp ====');
        rooms.forEach(function (room) {
            var temp = dev["xiaomi"][room.sensor];
            var target_temp = dev["climate_controls"][room.name];
            if (!target_temp) {
                target_temp = room.temp_min
            }
            if (temp < target_temp) {
                log(room.name + ' on - ' + temp);
                room.valve.on('t_control');
                dev["climate_heater_state"][room.name] = 1;
            } else {
                log(room.name + ' off - ' + temp);
                room.valve.off('t_control');
                dev["climate_heater_state"][room.name] = 0;
            }
        });
        HeatController.applyStateChange();
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









