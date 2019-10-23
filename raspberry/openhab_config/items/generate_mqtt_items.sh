#!/bin/bash

readonly=$(echo $(timeout 2s mosquitto_sub -h wb.home -t /# -v | grep -oP '^[^ ]+meta/readonly 1' | cut -d ' ' -f 1))
readonly=$(echo ${readonly} | grep -oP '[^ ]+(?=/meta/readonly)' | sort | uniq)

Number temperature "temp [%.1f]" {mqtt="<[mqtt:/devices/xiaomi/controls/sensor_ht_158d00010bec80_temperature:state:default]"}

echo ${readonly}