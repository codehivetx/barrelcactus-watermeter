import {setTimeout} from 'node:timers/promises';
import {Bias, Edge, Input, Output, RaspberryPi_5B, Watch} from 'opengpio';
import {TankData} from './tankdata';
/** little shim for delay, for documentation */
async function delay(n: number) {
    await setTimeout(n);
}

/** this is reflected in 'local-config.json' at the root. */
export class TankConfig {
    /** tank: CS for mcp3201 (e.g. GPIO18) */
    tank_cs: string;
    /** tank: DOUT for mcp3201 */
    tank_dout: string;
    /** tank: CLK for mcp3201 */
    tank_clk: string;
    /** tank: bias for mcp3201 */
    tank_bias: number;
    /** tank: subtract from r */
    tank_sub: number;
    /** tank: divide (r-sub) */
    tank_div: number;
    /** tank: unit for 'level', eg 'inch' */
    tank_hunit: string;
    /** tank: volume per unit of level (ex: 100 gallons per inch). Pie are square. */
    tank_vph: number;
    /** tank: unit for volume. gallons or hogshead or whatever */
    tank_vunit: string;
    /** tank: max volume */
    tank_vmax: number;
    /** tank: poll seconds */
    tank_poll_sec: number;
    /* flow: volume per click */
    flow_vpc: string;
    /* flow: unit per click eg 'gallons' */
    flow_vunit: string;

    /* path to log / data files */
    logdir: string;
};

/** our config from local-config.json */
export const tankConfig: TankConfig = require('../../local-config.json');

/** logging and data store */
export const tdata = new TankData(tankConfig.logdir);

/** this class manages all i/o */
export class TankIo {
    constructor() {
        // read in last data
        const olddata = tdata.readFlow();
        if (olddata) {
            const {flowTime, flowVolume, flowVolumeUnit} = olddata;
            if (flowVolumeUnit != this.flowVolumeUnit) {
                throw Error(`Something is really wrong, our volume unit is ${this.flowVolumeUnit} but stored data was ${flowVolumeUnit}`);
            }
            this.flowTime = flowTime;
            this.flowVolume = flowVolume;
            console.dir({olddata});
        }
    }

    /** when was the last sucessful tank read if any */
    public tankTime?: Date;

    /** when was the last successful flow read if any. if falsy, number will be from data */
    public flowTime?: Date;

    public tankHeight?: number;
    public tankVolume?: number;

    /** current read from the meter */
    public flowVolume?: number;

    /** 'halfway' tick. */
    public flowHalf = false;

    private setupPromise?: Promise<boolean>;
    // private pollTank: NodeJS.Timeout;

    private cs: Output;
    private dout: Input;
    private clk: Output;
    private vpc: Watch;

    public get tankHeightUnit() {
        return tankConfig.tank_hunit;
    }
    public get tankVolumeUnit() {
        return tankConfig.tank_vunit;
    }
    public get tankVolumeMax() {
        return tankConfig.tank_vmax;
    }
    public get flowVolumeUnit() {
        return tankConfig.flow_vunit;
    }

    private async doTankPoll() {
        // adapted from https://www.internetdelascosas.cl/2013/03/10/usando-adc-en-raspberry-pi-mcp3201/
        const dtim = 0.1;
        const vRef = 3.28;
        this.cs.value = true;
        await delay(dtim);
        this.clk.value = true;
        await delay(dtim);
        this.cs.value = false;
        await delay(dtim);

        let i1 = 14;
        let binData = 0;
        while (i1 >= 0) {
            this.clk.value = false;
            await delay(dtim);
            let bitDOUT: number = this.dout.value ? 1 : 0; // TODO: leftover from pygpio
            this.clk.value = true;
            await delay(dtim);
            bitDOUT = bitDOUT << i1;
            binData |= bitDOUT;
            i1 -= 1;
        }

        this.cs.value = true;
        await delay(dtim);
        // done with i/o

        binData &= 0xFFF; // mask
        const res = vRef * binData / 4096.0;

        // TODO: read config here
        const ins = ((res - 0.574) / 0.0264);
        this.tankHeight = ins;
        this.tankVolume = this.tankHeight * tankConfig.tank_vph;
        this.tankTime = new Date();

        // update with latest data
        tdata.writeTank(this);

        // TODO: localise here
        console.log(`${this.tankTime} : ${this.tankHeight}", ${this.tankVolume}g/${this.tankVolumeMax}g`);
    }

    private async doPoll() {
        await this.doTankPoll();
    }

    private schedulePoll() {
        const t = this;
        return new Promise(async (resolve, reject) => {
            try {
                if (t.tankTime) {
                    // only delay after the first time. The first time through we're
                    // trying to get to our first reading.
                    // As noted elsewhere, we *could* re-read the last good tank reading.
                    await delay(tankConfig.tank_poll_sec * 1000.0);
                }
                await t.doPoll();
                t.schedulePoll();
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    private async pinSetup() {
        console.dir({tankConfig});
        this.cs = RaspberryPi_5B.output(RaspberryPi_5B.bcm.GPIO18); // TODO: tank_cs
        this.dout = RaspberryPi_5B.input(RaspberryPi_5B.bcm.GPIO23); // TODO: tank_dout
        this.clk = RaspberryPi_5B.output(RaspberryPi_5B.bcm.GPIO24); // TODO: tank_clk
        if (true) {
            this.vpc = RaspberryPi_5B.watch(RaspberryPi_5B.bcm.GPIO12, Edge.Both, {
                debounce: 20,
                bias: Bias.PullUp,
            });
            this.vpc.on('change', (value) => {
                if (value) {
                    this.flowHalf = false;
                    this.flowTime = new Date();
                    this.flowVolume = (this.flowVolume ?? 0) + 1;
                    tdata.writeFlow(this);
                    // TODO: localize here.
                    console.log(`${this.flowTime} : ${this.flowVolume} ${this.flowVolumeUnit}`);
                } else {
                    this.flowHalf = true;
                    console.log('/');
                }
            });
        } else {
            // FAKE DATA FOR TESTING
            const t = this;
            async function fire0() {
                await setTimeout(2048);
                t.flowTime = new Date();
                t.flowVolume = (t.flowVolume ?? 0) + 1;
                tdata.writeFlow(t);
            }
            async function fire1() {
                await setTimeout(4000);
                t.flowTime = new Date();
                t.flowVolume = (t.flowVolume ?? 0) + 1;
                tdata.writeFlow(t);
            }
            async function fire2() {
                await setTimeout(8000);
                t.flowTime = new Date();
                t.flowVolume = (t.flowVolume ?? 0) + 1;
                tdata.writeFlow(t);
            }
            fire0(); // don't handle
            fire1(); // don't handle
            fire2(); // don't handle
        }

        // now set them up
        this.cs.value = false;
        this.clk.value = false;
    }

    async setup() {
        const t = this;
        // TODO: without the init() we don't need this anymore, but we retain it for the singleton-ness
        this.setupPromise = this.setupPromise ?? new Promise((resolve, reject) => {
            try {
                t.pinSetup().then(() =>
                    t.schedulePoll())
                    .then(() => resolve(true),
                        (e) => reject(e));
            } catch (e) {
                return reject(e);
            }

        });
        return this.setupPromise;
    }

    async teardown() {
        if (!this.setupPromise) return;
        this.setupPromise = undefined;
        // now in the danger zone, don't call this twice!
        // if (this.pollTank) {
        //     // clearTimeout(this.pollTank);
        // }
    }
}

const io = new TankIo();

export function getTankIo() {
    return io;
}
