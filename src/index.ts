import {
	Bridge,
	uuid,
	VoidCallback,
	AccessoryEventTypes,
	Categories,
} from 'hap-nodejs';
import storage from 'node-persist';
import OnOff from './accessories/OnOff_accessory';
import Actions_accessory from './accessories/Actions_accessory';
import Temperature from './accessories/Temperature_accessory';
import {iDracData, config} from "./idrac";

storage.initSync();

iDracData.shared.on('init', () => {
	const bridge = new Bridge(
		config.hap.displayName,
		uuid.generate('idrac6 Bridge')
	);

	bridge.on(
		AccessoryEventTypes.IDENTIFY,
		(paired: boolean, callback: VoidCallback) => {
			console.log(`${config.hap.displayName} identified. Paired: ${paired}`);
			callback(); // success
		}
	);

	bridge.addBridgedAccessory(OnOff);

	bridge.addBridgedAccessory(Temperature);

	Actions_accessory.forEach(accessory => {
		bridge.addBridgedAccessory(accessory);
	});

	bridge.publish({
		username: config.hap.username,
		port: config.hap.port,
		pincode: config.hap.pin,
		category: Categories.BRIDGE
	});

	var signals = { 'SIGINT': 2, 'SIGTERM': 15 } as Record<string, number>;
	Object.keys(signals).forEach((signal: any) => {
		process.on(signal, function () {
			bridge.unpublish();
			setTimeout(function (){
				process.exit(128 + signals[signal]);
			}, 1000)
		});
	});
});
