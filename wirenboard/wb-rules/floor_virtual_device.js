
setTimeout(function(){

    var devices = {
        laundry: LaundryFloorHeater,
        kitchen: KitchenFloorHeater,
        bathroom: BathroomFloorHeater,
        living_table: LivingTableFloorHeater,
        living_wall: LivingWallFloorHeater
    };

    var cells = {};
    Object.keys(devices).forEach(function (name) {
        cells[name] = {
            type: 'switch',
            value: false
        }
    });
    defineVirtualDevice('floor_controls', {
        title: "Floor controls",
        cells: cells
    });

    function applyState() {
        Object.keys(devices).forEach(function (name) {
            if (dev["floor_controls"][name]) {
                devices[name].on('floor_controls');
            } else {
                devices[name].off('floor_controls');
            }
        });
        HeatController.applyStateChange();
    }

    defineRule("floor_virtual_devices", {
        whenChanged: Object.keys(devices).map(function (name) {return "floor_controls/" + name}),
        then: applyState
    });

    applyState();

}, 1000);