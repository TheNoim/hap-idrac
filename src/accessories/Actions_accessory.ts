import {
    Accessory,
    AccessoryEventTypes,
    Characteristic,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    Service,
    uuid,
    VoidCallback
} from 'hap-nodejs';
import {PowerActions} from 'idrac6/dist';
import {iDracData} from "../idrac";

const accessories: Accessory[] = [];

const actions = [
    {
        name: 'Force Shutdown',
        action: PowerActions.OFF
    },
    {
        name: 'NMI',
        action: PowerActions.NMI
    },
    {
        name: "Restart",
        action: PowerActions.RESTART
    },
    {
        name: "Reset",
        action: PowerActions.RESET
    },
    {
        name: 'Turn on',
        action: PowerActions.ON,
    },
];

for (const action of actions) {
    const actionUUID = uuid.generate(
        'hap-nodejs:accessories:idrac:action:' + action.action
    );

    const accessory = new Accessory(action.name, actionUUID);

    accessory
        .getService(Service.AccessoryInformation)!
        .setCharacteristic(Characteristic.Manufacturer, 'Dell')
        .setCharacteristic(Characteristic.Model, 'idrac6');

    accessory.on(
        AccessoryEventTypes.IDENTIFY,
        (paired: boolean, callback: VoidCallback) => {
            console.log('Identified ' + action.action + ' action.');
            callback();
        }
    );

    accessory
        .addService(Service.Switch)!
        .getCharacteristic(Characteristic.On)!
        .on(
            CharacteristicEventTypes.SET,
            async (callback: CharacteristicSetCallback) => {
                await iDracData.shared.sendAction(action.action);
                callback(null);

                [500, 1000, 1500].map(timeout => {
                    setTimeout(() => {
                        accessory.getService(Service.Switch)!
                            .getCharacteristic(Characteristic.On)!
                            .updateValue(false);
                    }, timeout);
                });


            }
        )
        .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
            callback(null, false);
        });

    accessories.push(accessory);
}

export default accessories;
