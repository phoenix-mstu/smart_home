// function HeaterPump(valve, on_timeout) {
//     var heaters = [];
//     var on_heaters_counter = 0;
//     var on_timer;
//
//     this.addDependentHeater = function (heater) {
//         heaters[heaters.length] = heater;
//     };
//     this.incOnHeaters = function () {
//         on_heaters_counter++;
//         if (on_heaters_counter === 1) {
//             heaters.forEach(function(heater) {heater.enable()});
//             on_timer = setTimeout(function () {
//                 dev["wb-gpio"][valve] = 1;
//                 log("Boiler " + valve + " on");
//                 on_timer = false;
//             }, on_timeout);
//         }
//     };
//     this.decOnHeaters = function () {
//         on_heaters_counter--;
//         if (on_heaters_counter === 0) {
//             heaters.forEach(function(heater) {heater.disable()});
//             dev["wb-gpio"][valve] = 0;
//             log("Boiler " + valve + " off");
//             if (on_timer) {
//                 clearTimeout(on_timer);
//                 on_timer = false;
//             }
//         }
//     };
//
//     // INIT
//     setTimeout(function () {
//         if (on_heaters_counter === 0 || on_timer) {
//             dev["wb-gpio"][valve] = 0;
//         } else {
//             dev["wb-gpio"][valve] = 1;
//         }
//     }, 1000);
// }
//
// function Heater(valve, on_signal, pumps) {
//     var self = this;
//     var off_signal = on_signal ? 0 : 1;
//
//     var on_sources = {};
//     var enable_counter = 0;
//     var last_valve_state = -1;
//
//     var applyStateChange = function () {
//         var is_on = Object.keys(on_sources).length;
//         var new_valve_state = (enable_counter === pumps.length) ? (is_on ? on_signal : off_signal) : 0;
//         if (last_valve_state !== new_valve_state) {
//             log('Change state ' + valve + ' ' + new_valve_state.toString());
//             last_valve_state = new_valve_state;
//             if (valve.charAt(0) != '_') {
//                 dev["wb-gpio"][valve] = new_valve_state;
//             }
//         }
//     };
//     this.on = function (source) {
//         source = typeof source !== 'undefined' ? source : 'default';
//         if (on_sources.hasOwnProperty(source)) return;
//         on_sources[source] = 1;
//         if (Object.keys(on_sources).length === 1) {
//             log('on ' + valve);
//             pumps.forEach(function (pump) {
//                 pump.incOnHeaters()
//             });
//             applyStateChange();
//         }
//     };
//     this.off = function (source) {
//         source = typeof source !== 'undefined' ? source : 'default';
//         if (!on_sources.hasOwnProperty(source)) return;
//         delete on_sources[source];
//         if (Object.keys(on_sources).length === 0) {
//             log('off ' + valve);
//             pumps.forEach(function (pump) {
//                 pump.decOnHeaters()
//             });
//             applyStateChange();
//         }
//     };
//     this.enable = function () {
//         enable_counter++;
//         applyStateChange();
//     };
//     this.disable = function () {
//         enable_counter--;
//         applyStateChange();
//     };
//     this.isOn = function (source) {
//         return on_sources.hasOwnProperty(source);
//     };
//
//     // INIT
//     pumps.forEach(function(pump) {pump.addDependentHeater(self)});
//     setTimeout(function () {
//         applyStateChange();
//     }, 1000);
// }
//
// function FloorHeatController(heatSource, t_in, required_t, heaters) {
//     var subscriptions = ["wb-w1/" + t_in];
//     for (var i in heaters) {
//         if (!heaters.hasOwnProperty(i)) continue;
//         subscriptions.push("wb-w1/" + heaters[i][1]);
//         heaters[i][0].on();
//     }
//
//     var t_prev = 0;
//     var switchValveIfRequired = function(newValue, devName, cellName) {
//         var in_temp = dev["wb-w1"][t_in];
//
//         var t_round = Math.round(2 * in_temp) / 2;
//         if (t_round < required_t) {
//             heatSource.on();
//             if (t_prev !== t_round) {
//                 log('floor on. ' + t_round)
//             }
//         } else {
//             heatSource.off();
//             if (t_prev !== t_round) {
//                 log('floor off. ' + t_round)
//             }
//         }
//         t_prev = t_round;
//     };
//
//     switchValveIfRequired();
//     defineRule(getNewRuleName(), {
//         whenChanged: subscriptions,
//         then: switchValveIfRequired
//     });
// }
//
// BoilerPump = new HeaterPump("BOILER_SWITCH", 300000); //300000
// FloorPump =  new HeaterPump("FLOOR_PUMP", 300000);
// FloorDevicesHeatSource  = new Heater("VALVE_FLOOR_LIVINGWALL", 1, [BoilerPump]);
//
// StoreHeater =       new Heater("VALVE_STORE",              0, [BoilerPump]);
// Towel2Heater =      new Heater("VALVE_TOWEL2",             0, [BoilerPump]);
// Towel1Heater =      new Heater("VALVE_TOWEL1",             0, [BoilerPump]);
// PlayroomHeater =    new Heater("VALVE_PLAYROOM",           1, [BoilerPump]);
// BedroomHeater =     new Heater("VALVE_BEDROOM",            1, [BoilerPump]);
// LivingWallHeater =  new Heater("VALVE_LIVING_WALLHEATER",  1, [BoilerPump]);
// LivingFloorHeater = new Heater("VALVE_LIVING_FLOORHEATER", 1, [BoilerPump]);
//
// // LivingWallFloorHeater =  new Heater("VALVE_FLOOR_LIVINGWALL",  1, [FloorPump]);
// LaundryFloorHeater =     new Heater("VALVE_FLOOR_LAUNDRY",     0, [FloorPump]);
// KitchenFloorHeater =     new Heater("VALVE_FLOOR_KITCHEN",     0, [FloorPump]);
// BathroomFloorHeater =    new Heater("VALVE_FLOOR_BATHROOM",    0, [FloorPump]);
// LivingTableFloorHeater = new Heater("VALVE_FLOOR_LIVINGTABLE", 0, [FloorPump]);
//
// setTimeout(function () {
//     FloorHeatController(FloorDevicesHeatSource, "28-8000001f1806", 35, [
//         // [LivingWallFloorHeater, "28-8000001f1c19"],
//         [LaundryFloorHeater, "28-8000001f1bdb"],
//         // [KitchenFloorHeater, "28-0316a11e67ff"],
//         [BathroomFloorHeater, "28-8000001f17db"]
//         // [LivingTableFloorHeater, "28-8000001f1e18"]
//     ]);
// }, 1000);
//
// // if (cellName === t_in) {
// //     var now = Date.now();
// //     if (typeof this.in === 'undefined') {
// //         // this.last_t = now;
// //         this.in = [];
// //     } else {
// //         this.in.push([now, newValue]);
// //         if (now - this.in[0][0] > 5*60000 && this.in.length > 2) {
// //             this.in.shift();
// //             var sum = 0;
// //             for (var i = 1; i < this.in.length; i++) {
// //                 sum += (this.in[i][0] - this.in[i - 1][0]) * this.in[i][1];
// //             }
// //             this.t_in_avg = sum / (now - this.in[0][0]);
// //             log('=========== ' + this.t_in_avg);
// //         }
// //     }
// // }
// // if (this.t_in_avg && cellName !== t_in) {
// //     log(cellName + ' ' + (this.t_in_avg - newValue));
// // }