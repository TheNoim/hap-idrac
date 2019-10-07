import {
    Accessory,
    Characteristic,
    CharacteristicEventTypes,
    CharacteristicValue,
    NodeCallback,
    Service,
    uuid
} from 'hap-nodejs';
import { config, iDracData } from '../idrac';

const tempUUID = uuid.generate(
    'hap-nodejs:accessories:idrac:temperature:' + config.hap.displayName
);

const accessory = new Accessory(
    config.hap.displayName + ' Temperature',
    tempUUID
);

accessory
    .addService(Service.TemperatureSensor)!
    .getCharacteristic(Characteristic.CurrentTemperature)!
    .on(
        CharacteristicEventTypes.GET,
        (callback: NodeCallback<CharacteristicValue>) => {
            // return our current value
            callback(null, iDracData.shared.getTemperature());
        }
    );

iDracData.shared.on('update:temp', () => {
    accessory
        .getService(Service.TemperatureSensor)!
        .setCharacteristic(
            Characteristic.CurrentTemperature,
            iDracData.shared.getTemperature()
        );
});

export default accessory;
