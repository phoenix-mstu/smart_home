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
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        isTrusted: false
        }
    ],

    users: [{
            id: '1',
            username: process.env.CLIENT_USER_NAME,
            password: process.env.CLIENT_USER_PASS,
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
                    set: '/light/LIVING_TABLE/state',
                    stat: '/light/LIVING_TABLE/state'
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
