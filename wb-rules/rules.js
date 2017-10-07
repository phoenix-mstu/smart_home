
function makeLightRule(name, detector_control, relay_control) {
  defineRule(name, {
      whenChanged: "wb-gpio/" + detector_control,
      then: function(newValue, devName, cellName) {
          if (newValue) {
              dev["wb-gpio"][relay_control] = dev["wb-gpio"][relay_control] ? 0 : 1;
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
                  if (dev["wb-gpio"][i] != relay_to_set_array[i]) {
                      dev["wb-gpio"][i] = relay_to_set_array[i];
                      changed = true;
                  }
              }
              if (!changed) {
                  for (i in relay_to_set_array) {
                      dev["wb-gpio"][i] = 0;
                  }
              }
             
          }
      }
  });
}


defineRule("temperature", {
    whenChanged: 
    [
	"xiaomi/sensor_ht_158d00010bec80_temperature",
	"xiaomi/sensor_ht_158d00010becc6_temperature",
	"xiaomi/sensor_ht_158d00010bed71_temperature",
    ],
    then: function(newValue, devName, cellName) {
	temp1 = dev["xiaomi"]["sensor_ht_158d00010bec80_temperature"];
	temp2 = dev["xiaomi"]["sensor_ht_158d00010becc6_temperature"];
	temp3 = dev["xiaomi"]["sensor_ht_158d00010bed71_temperature"];
	min = 2300;
	max = 2500;	
	if ((temp1 < min || temp2 < min || temp3 < min) && temp1 < max && temp2 < max && temp3 < max) {
		dev["wb-gpio"]["BOILER_SWITCH"] = 1;
		dev["wb-gpio"]["FLOOR_PUMP"] = 1;
	} else {
		dev["wb-gpio"]["BOILER_SWITCH"] = 0;
		dev["wb-gpio"]["FLOOR_PUMP"] = 0;
	}
    }
});

makeLightSceneRule("big_0", "SWITCH_LIVING_BIG0", {
EXT1_K10: 0, // wall
EXT1_K14: 0, // table
EXT1_K2: 0, // kitchen
EXT1_K12: 0, // kitchen+
EXT1_K13: 0 // center
});
makeLightSceneRule("big_1", "SWITCH_LIVING_BIG1", {
EXT1_K10: 0,
EXT1_K14: 1,
EXT1_K2: 1,
EXT1_K12: 0,
EXT1_K13: 0
});
makeLightSceneRule("big_2", "SWITCH_LIVING_BIG2", {
EXT1_K10: 1,
EXT1_K14: 1,
EXT1_K2: 1,
EXT1_K12: 0,
EXT1_K13: 0
});
makeLightSceneRule("big_3", "SWITCH_LIVING_BIG3", {
EXT1_K10: 1,
EXT1_K14: 0,
EXT1_K2: 0,
EXT1_K12: 1,
EXT1_K13: 0
});
makeLightSceneRule("big_4", "SWITCH_LIVING_BIG4", {
EXT1_K10: 1,
EXT1_K14: 1,
EXT1_K2: 1,
EXT1_K12: 1,
EXT1_K13: 1
});




// old big light
// makeLightRule("23n", "SWITCH_LIVING_BIG1", "EXT1_K14");
// makeLightRule("23_1n", "SWITCH_LIVING_BIG1", "EXT1_K2");
// makeLightRule("1n", "SWITCH_LIVING_BIG2", "EXT1_K10");
// makeLightRule("26n", "SWITCH_LIVING_BIG3", "EXT1_K12");
// makeLightRule("31n", "SWITCH_LIVING_BIG4", "EXT1_K13");

makeLightRule("2", "EXT2_DR6", "EXT1_K9");
makeLightRule("3", "EXT5_DR12", "EXT1_K4");

//makeLightRule("4", "EXT2_DR13", "EXT1_K1");
//makeLightRule("5", "EXT2_DR13", "EXT1_K2");
//makeLightRule("6", "EXT2_DR13", "EXT1_K3");
//makeLightRule("7", "EXT2_DR13", "EXT1_K4");
//makeLightRule("8", "EXT2_DR13", "EXT1_K5");
//makeLightRule("9", "EXT2_DR13", "EXT1_K6");
//makeLightRule("10", "EXT2_DR13", "BOILER_SWITCH");
//makeLightRule("10", "EXT2_DR13", "EXT1_K7");
//makeLightRule("11", "EXT2_DR13", "EXT1_K8");
//makeLightRule("12", "EXT2_DR13", "EXT1_K9");
//makeLightRule("13", "EXT2_DR13", "EXT1_K10");
//makeLightRule("14", "EXT2_DR13", "EXT1_K11");
//makeLightRule("15", "EXT2_DR13", "EXT1_K12");
//makeLightRule("16", "EXT2_DR13", "EXT1_K13");
//makeLightRule("17", "EXT2_DR13", "EXT1_K14");
//makeLightRule("18", "EXT2_DR13", "EXT1_K15");
//makeLightRule("19", "EXT2_DR13", "EXT1_K16");

makeLightRule("20", "EXT5_DR6", "EXT3_K7");
makeLightRule("21", "EXT5_DR15", "EXT3_K5");
makeLightRule("22", "EXT2_DR8", "EXT3_K6");

makeLightRule("24", "EXT2_DR7", "EXT1_K5");
makeLightRule("25", "EXT5_DR5", "EXT1_K11");



makeLightRule("27", "EXT5_DR10", "EXT4_R3A5");
makeLightRule("28", "EXT5_DR9", "EXT1_K1");
makeLightRule("29", "EXT2_DR16", "EXT4_R3A1");
makeLightRule("30", "EXT5_DR11", "EXT1_K8");


makeLightRule("32", "EXT5_DR16", "EXT3_K4");
makeLightRule("33", "EXT2_DR5", "EXT4_R3A2");
