import {setTimeout} from 'node:timers/promises';
import {init} from 'raspi';
import {DigitalInput, DigitalOutput, HIGH, LOW, PULL_UP} from 'raspi-gpio';

/** little shim for delay, for documentation */
async function delay(n: number) {
    await setTimeout(n);
}

/** this is reflected in 'local-config.json' at the root. */
export class TankConfig {
    /** tank: CS for mcp3201 (e.g. GPIO18) */
    tank_cs: number;
    /** tank: DOUT for mcp3201 */
    tank_dout: number;
    /** tank: CLK for mcp3201 */
    tank_clk: number;
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
    flow_vpc: number;
    /* flow: unit per click eg 'gallons' */
    flow_vunit: string;
};

export const tankConfig: TankConfig = require('../../local-config.json');

export class TankIo {
    constructor() { }

    public tankTime?: Date;
    public flowTime?: Date;

    public tankHeight?: number;
    public tankVolume?: number;

    private setupPromise?: Promise<boolean>;
    // private pollTank: NodeJS.Timeout;

    private cs: DigitalOutput;
    private dout: DigitalInput;
    private clk: DigitalOutput;
    private vpc: DigitalInput;

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
        this.cs.write(HIGH);
        await delay(dtim);
        this.clk.write(HIGH);
        await delay(dtim);
        this.cs.write(LOW);
        await delay(dtim);

        let i1 = 14;
        let binData = 0;
        while (i1 >= 0) {
            this.clk.write(LOW);
            await delay(dtim);
            let bitDOUT = this.dout.read();
            this.clk.write(HIGH);
            await delay(dtim);
            bitDOUT = bitDOUT << i1;
            binData |= bitDOUT;
            i1 -= 1;
        }

        this.cs.write(HIGH);
        await delay(dtim);
        // done with i/o

        binData &= 0xFFF; // mask
        const res = vRef * binData / 4096.0;

        // TODO: read config here
        const ins = ((res - 0.574) / 0.0264);
        this.tankHeight = ins;
        this.tankVolume = this.tankHeight * tankConfig.tank_vph;
        this.tankTime = new Date();

        console.log(`${this.tankTime} : ${this.tankHeight}", ${this.tankVolume}g/${this.tankVolumeMax}g`);
    }

    private async doPoll() {
        await this.doTankPoll();
    }

    private schedulePoll() {
        const t = this;
        new Promise(async (resolve, reject) => {
            console.log('delaying..');
            await delay(tankConfig.tank_poll_sec);
            console.log('polling');
            t.doPoll().then(() => t.schedulePoll(), (e) => console.error(e));
        });
    }

    private async pinSetup() {
        console.dir({tankConfig});
        this.cs = new DigitalOutput({
            pin: tankConfig.tank_cs,
        });
        this.dout = new DigitalInput({
            pin: tankConfig.tank_dout,
        });
        this.clk = new DigitalOutput({
            pin: tankConfig.tank_clk,
        });
        if (false) {
            // need to cutover
            this.vpc = new DigitalInput({
                pin: tankConfig.flow_vpc,
                pullResistor: PULL_UP,
            });
        }

        // now set them up
        this.cs.write(LOW);
        this.clk.write(LOW);
    }

    async setup() {
        const t = this;
        this.setupPromise = this.setupPromise ?? new Promise((resolve, reject) => {
            init(() => {
                try {
                    t.pinSetup().then(() => {
                        t.schedulePoll();
                        resolve(true);
                    }, reject);
                } catch (e) {
                    return reject(e);
                }
            });

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
