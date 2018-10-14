/**
 * Created by gkuzovnikov on 29/11/17.
 */

temp_sensors = {
    bedroom: "sensor_ht_158d00010bec80",
    playroom: "sensor_ht_158d00010becc6",
    living: "sensor_ht_158d00010bed71",
    laundry: "sensor_ht_158d0001c2a1dd",
    bathroom: "sensor_ht_158d0001b1d55f",

    floor_laundry: "28-8000001f1bdb",
    floor_living_w: "28-8000001f1c19",
    floor_living_t: "28-8000001f1806",

    foutdoor: "28-8000001f1cf4",
    ffloor_in: "28-8000001f1806",
    fboiler: "28-8000001f1dc0",
    fkitchen: "28-0316a11e67ff"


};

// 2c-00000002ceb5 70168
//
// 28-8000001f1806
// 34 °C
// 28-8000001f17db
// 24.562 °C
// 28-8000001f1e18
// 24.75 °C
// 28-8000001f1bdb
// 27.125 °C
// 28-8000001f1cf4
// 5.875 °C
// 28-8000001f1dc0
// 47.625 °C
// 28-0316a11e67ff
// 26.437 °C
// 28-8000001f1c19
// 28.25 °C

function getTemperature(room)
{
    return dev["xiaomi"][temp_sensors[room] + "_temperature"] / 100;
}

function getHumidity()
{
    return dev["xiaomi"][temp_sensors[room] + "_humidity"];
}

var cells = {};
for (room in temp_sensors) {
    if (temp_sensors.hasOwnProperty(room)) {
        cells[room + '_current'] = {
            type: "value",
            value: getTemperature(room),
            readonly: true
        }
        cells[room + '_desired'] = {
            type: "range",
            max: 30,
            min: 10,
            value: getTemperature(room)
        }
    }
}
defineVirtualDevice("room_temp", {
    title: "Rooms temperature",
    cells: cells
});

function buildWhenTempHumidChanged(rooms, type)
{
    var whenChanged = [];
    for (var i in rooms) {
        if (rooms.hasOwnProperty(i)) {
            whenChanged[i] = "xiaomi/" + temp_sensors[rooms[i]] + "_" + type;
        }
    }
    return whenChanged;
}

defineRule("987987", {
    whenChanged: buildWhenTempHumidChanged(['bathroom'], 'humidity'),
    // whenChanged: "xiaomi/sensor_ht_158d0001b1d55f_temperature",
    then: function(newValue, devName, cellName) {
        log("bath humidity: " + newValue);
        if (newValue > 6500) {
            BathroomFan.autoRun();
        } else {
            BathroomFan.autoStop();
        }
    }
});

var laundry_heater_timer;
defineRule("laundry_heater_button", {
    whenChanged: "xiaomi/switch_158d0001d6abdf_status",
    then: function(newValue, devName, cellName) {
        var timeout = 2 * 60 * 60;
        if (laundry_heater_timer) {
            clearTimeout(laundry_heater_timer);
        }
        Towel1Heater.on();
        log("laundry heater on");
        laundry_heater_timer = setTimeout(function () {
            Towel1Heater.off();
            laundry_heater_timer = false;
            log("laundry heater off");
        }, timeout * 1000);
    }
});
var bath_heater_timer;
defineRule("bath_heater_button", {
    whenChanged: "xiaomi/switch_158d0001b195a2_status",
    then: function(newValue, devName, cellName) {
        var timeout = 2 * 60 * 60;
        if (bath_heater_timer) {
            clearTimeout(bath_heater_timer);
        }
        Towel2Heater.on();
        log("bath heater on");
        bath_heater_timer = setTimeout(function () {
            Towel2Heater.off();
            bath_heater_timer = false;
            log("bath heater off");
        }, timeout * 1000);
    }
});
