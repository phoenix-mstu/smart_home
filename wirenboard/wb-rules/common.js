/**
 * Created by gkuzovnikov on 18/01/2018.
 */

function makeCallFunctionRule(name, detector_control, fn) {
    defineRule(name, {
        whenChanged: "wb-gpio/" + detector_control,
        then: function(newValue, devName, cellName) {
            if (newValue) {
                fn();
            }
        }
    });
}

function buildWhenChanged(detector_controls) {
    var whenChanged = [];
    if (detector_controls.isArray) {
        for (var i in detector_controls) {
            if (detector_controls.hasOwnProperty(i)) {
                whenChanged[i] = "wb-gpio/" + detector_controls[i];
            }
        }
    } else {
        whenChanged[0] = "wb-gpio/" + detector_controls;
    }
    return whenChanged;
}

function checkIsOn(detector_controls) {
    if (detector_controls.isArray) {
        for (var i in detector_controls) {
            if (detector_controls.hasOwnProperty(i)) {
                if (!dev["wb-gpio"][detector_controls[i]]) return false;
            }
        }
        return true;
    } else {
        return dev["wb-gpio"][detector_controls];
    }
}

function makeLongPressRule(name, detector_controls, timeout, callback) {
    var timer = false;
    defineRule(name, {
        whenChanged: buildWhenChanged(detector_controls),
        then: function(newValue, devName, cellName) {
            if (timer) {
                clearTimeout(timer);
                timer = false;
            }
            if (checkIsOn(detector_controls)) {
                timer = setTimeout(callback, timeout * 1000);
            }
        }
    });
}

function switchArray(devices, value) {
    for (var i in devices) {
        if (!devices.hasOwnProperty(i)) continue;
        dev["wb-gpio"][devices[i]] = value;
    }
}

var lastRuleId = 0;
function getNewRuleName() {
    return 'rule' + lastRuleId;
}