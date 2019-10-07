import {
    Accessory,
    AccessoryEventTypes,
    Characteristic,
    CharacteristicEventTypes,
    CharacteristicSetCallback,
    CharacteristicValue,
    NodeCallback,
    Service,
    uuid,
    VoidCallback
} from 'hap-nodejs';
import { config, iDracData } from '../idrac';
import { PowerActions } from 'idrac6/dist';

const onOffUUID = uuid.generate(
    'hap-nodejs:accessories:idrac:on_off:' + config.hap.displayName
);

const accessory = new Accessory(config.hap.displayName, onOffUUID);

accessory
    .getService(Service.AccessoryInformation)!
    .setCharacteristic(Characteristic.Manufacturer, 'Dell')
    .setCharacteristic(Characteristic.Model, 'idrac6');

accessory.on(
    AccessoryEventTypes.IDENTIFY,
    (paired: boolean, callback: VoidCallback) => {
        console.log('Identified On/Off Device.');
        callback();
    }
);

accessory
    .addService(Service.Outlet, config.hap.displayName) // services exposed to the user should have "names" like "Light" for this case
    .getCharacteristic(Characteristic.On)!
    .on(
        CharacteristicEventTypes.SET,
        async (
            value: CharacteristicValue,
            callback: CharacteristicSetCallback
        ) => {
            const eventValue = value as (1 | 0);
            const action = eventValue ? PowerActions.ON : PowerActions.SHUTDOWN;
            await iDracData.shared.sendAction(action);
            // Our light is synchronous - this value has been successfully set
            // Invoke the callback when you finished processing the request
            // If it's going to take more than 1s to finish the request, try to invoke the callback
            // after getting the request instead of after finishing it. This avoids blocking other
            // requests from HomeKit.
            callback();
        }
    )
    // We want to intercept requests for our current power state so we can query the hardware itself instead of
    // allowing HAP-NodeJS to return the cached Characteristic.value.
    .on(
        CharacteristicEventTypes.GET,
        async (callback: NodeCallback<CharacteristicValue>) => {
            // // const powerState = await idrac.getPowerState();
            // if (powerState === PowerState.INVALID) {
            //     callback(new Error('Invalid PowerState'));
            // } else {
            //     callback(null, powerState === PowerState.ON);
            // }
            callback(null, iDracData.shared.getPowerState());
        }
    );

iDracData.shared.on('update:power', () => {
    accessory
        .getService(Service.Outlet)!
        .getCharacteristic(Characteristic.On)!
        .updateValue(iDracData.shared.getPowerState());
});

export default accessory;
