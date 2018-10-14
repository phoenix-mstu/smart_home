/**
 * Created by gkuzovnikov on 10/01/2018.
 */

function Fan(name) {
    var timer = false;
    var timeout = 30*60;

    var is_in_manual_mode = false;
    var is_auto_on = false;

    var setAutoStatus = function() {
        dev["wb-gpio"][name] = is_auto_on ? 1 : 0;
    };

    this.manualToggle = function () {
        is_in_manual_mode = true;

        dev["wb-gpio"][name] = dev["wb-gpio"][name] ? 0 : 1;

        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            is_in_manual_mode = false;
            setAutoStatus();
        }, timeout * 1000);
    };

    this.autoRun = function () {
        if (!is_auto_on) {
            is_auto_on = true;
            if (!is_in_manual_mode) {
                setAutoStatus();
            }
        }
    };

    this.autoStop = function () {
        if (is_auto_on) {
            is_auto_on = false;
            if (!is_in_manual_mode) {
                setAutoStatus();
            }
        }
    };
}

LaundryFan = new Fan('FAN_LAUNDRY');
BathroomFan = new Fan('FAN_BATHROOM');

// fan works half an hour
makeCallFunctionRule("33", "SWITCH_LAUNDRY_EXT2", LaundryFan.manualToggle);
makeCallFunctionRule("28", "SWITCH_BATHROOM_EXT2", BathroomFan.manualToggle);