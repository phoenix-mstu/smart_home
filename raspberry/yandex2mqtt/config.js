module.exports = {

    mqtt: {
        host: process.env.MQTT_HOST,
        port: 1883,
        user: process.env.MQTT_USER,
        password: process.env.MQTT_PASS
    },

    http: {
        host: '0.0.0.0',
        port: 1800
    },

    clients: [
    {
        id: '1',
        name: 'Yandex',
        clientId: 'yandex-smarthome12345',
        clientSecret: 'secret12345',
        isTrusted: false
        }
    ],

    users: [{
            id: '1',
            username: 'admin',
            password: 'admin',
            name: 'Administrator'
        },
        {
            id: '2',
            username: 'root',
            password: 'root',
            name: 'Administrator'
        }
    ],

    devices: [
    //_______________Первое устройство______________//
        {
            name: 'Свет',
            room: 'Комната',
            type: 'devices.types.light',
            mqtt: [
                 {
                    type: 'on',
                    set: '/devices/yandex/controls/light1/on',
                    stat: '/devices/yandex/controls/light1'
                }
            ],
            capabilities: [
                {
                    type: 'devices.capabilities.on_off',
                    retrievable: true,
                    state: {
                        instance: 'on',
                        value: true
                    }
                },
            ]
        },
    //__________Конец первого устройства__________//
    ]
}
