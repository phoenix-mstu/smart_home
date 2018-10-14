
defineVirtualDevice("heater_watchdog", {
    title: "Heater watchdog",
    cells: {
        status : {
            type : "value",
            value : "not_set",
        },
        last_update : {
            type : "value",
            value : 0,
        },
    }
});