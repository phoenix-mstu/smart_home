/**
 * Created by gkuzovnikov on 29/11/17.
 */

door_sensors = {
    entrance: 'magnet_158d0001b74835_status'
};

first_floor_lights = [
    "LIGHT_LIVING_WALL", "LIGHT_LIVING_TABLE", "LIGHT_LIVING_KITCHEN_BL", "LIGHT_LIVING_KITCHEN", "LIGHT_LIVING_CENTER",
    "LIGHT_LAUNDRY_MAIN", "LIGHT_HALL1", "LIGHT_LAUNDRY_MIRROR"
];
second_floor_lights = [
    "LIGHT_BEDROOM_CENTER", "LIGHT_HALL2_MAIN", "LIGHT_HALL2_PICTURE", "LIGHT_PLAYROOM_CENTER", "LIGHT_PLAYROOM_LINE",
    "LIGHT_BEDROOM_SECOND", "LIGHT_BATHROOM_MAIN", "LIGHT_BATHROOM_MIRROR", "LIGHT_STORE"
];

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

makeLightRule("2", "SWITCH_LAUNDRY_EXT1", "LIGHT_LAUNDRY_MAIN");
makeLightRule("3", "SWITCH_HALL2_STAIRS2", "LIGHT_HALL2_MAIN");
makeLightRule("3_1", "SWITCH_HALL2_STAIRS1", "LIGHT_HALL2_PICTURE");
makeLightRule("20", "SWITCH_BEDROOM3", "LIGHT_BEDROOM_CENTER");
makeLightRule("21", "SWITCH_HALL1_DOOR1", "LIGHT_HALL1");
makeLightRule("22", "SWITCH_PLAYROOM4", "LIGHT_PLAYROOM_CENTER");
makeLightRule("24", "SWITCH_PLAYROOM3", "LIGHT_PLAYROOM_LINE");
makeLightRule("25", "SWITCH_BEDROOM4", "LIGHT_BEDROOM_SECOND");
makeLightRule("27", "SWITCH_BATHROOM_EXT1", "LIGHT_BATHROOM_MAIN");
makeLightRule("29", "SWITCH_BATHROOM_IN", "LIGHT_BATHROOM_MIRROR");
makeLightRule("30", "SWITCH_STORE", "LIGHT_STORE");
makeLightRule("32", "SWITCH_LAUNDRY_IN", "LIGHT_LAUNDRY_MIRROR");

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