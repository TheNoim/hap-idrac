import { iDrac6 } from 'idrac6';
import { IDrac6DataTypes, PowerActions, PowerState } from 'idrac6/dist';
import { Queue } from './queue-decorator';
import PQueue from 'p-queue';
import * as schedule from 'node-schedule';
import { EventEmitter } from 'events';
import { sync as loadJsonFileSync } from 'load-json-file';
import { resolve } from 'path';

export interface Config {
    idrac: {
        username: string;
        password: string;
        address: string;
        sessionOptions?: {
            saveSession: boolean;
            path?: string;
        };
    };
    hap: {
        displayName: string;
        pin: string;
        username: string;
        port: number;
    };
}

const config: Config = loadJsonFileSync(resolve(__dirname, '../config.json'));

class iDracData extends EventEmitter {
    /**
     * Shared Data instance
     */
    public static shared: iDracData = new iDracData();

    private _lastPowerState: boolean = false;
    private _lastTemp: number = 0;
    private firmwareVersion?: string;
    private biosVersion?: string;
    private idrac: iDrac6 = new iDrac6(config.idrac);
    private initialized: boolean = false;

    private set lastPowerState(value: boolean) {
        if (this._lastPowerState !== value) this.emit('update:power');
        this._lastPowerState = value;
    }

    private get lastPowerState() {
        return this._lastPowerState;
    }

    private set lastTemp(value: number) {
        if (this._lastTemp !== value) this.emit('update:temp');
        this._lastTemp = value;
    }

    private get lastTemp() {
        return this._lastTemp;
    }

    private queue: PQueue = new PQueue({ concurrency: 1, timeout: 10000 });

    constructor() {
        super();
        this.init().then(() => {
            schedule.scheduleJob('*/7 * * * * *', () => {
                if (this.queue.size <= 4) this._update();
            });
        });
    }

    @Queue
    public async init() {
        const {
            biosVer,
            fwVersion,
            pwState,
            temperatures
        } = await this.idrac.getMultipleData([
            IDrac6DataTypes.Temperature,
            IDrac6DataTypes.PowerState,
            IDrac6DataTypes.FirmwareVersion,
            IDrac6DataTypes.BiosVersion,
            IDrac6DataTypes.HostName
        ]);
        this.lastPowerState = pwState === PowerState.ON;
        if (temperatures) {
            this.lastTemp = temperatures.temperature;
        } else {
            this.lastTemp = 0;
        }
        if (biosVer) this.biosVersion = biosVer;
        if (fwVersion) this.firmwareVersion = fwVersion;
        this.initialized = true;
        this.emit('init');
    }

    /**
     * Update local data from idrac
     * @private
     */
    @Queue
    private async _update() {
        const { pwState, temperatures } = await this.idrac.getMultipleData([
            IDrac6DataTypes.Temperature,
            IDrac6DataTypes.PowerState
        ]);
        this.lastPowerState = pwState === PowerState.ON;
        if (temperatures) {
            this.lastTemp = temperatures.temperature;
        } else {
            this.lastTemp = 0;
        }
    }

    @Queue
    public async sendAction(powerAction: PowerActions) {
        await this.idrac.sendPowerAction(powerAction);
        this._update();
    }

    public getTemperature() {
        return this.lastTemp;
    }

    public getPowerState() {
        return this.lastPowerState;
    }
}

export { config, iDracData };
