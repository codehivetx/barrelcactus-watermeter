import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
/** input obj for writeTank */
export interface TankUpdate {
  tankHeight?: number;
  tankVolume?: number;
  tankTime?: Date;
  tankHeightUnit?: string;
  tankVolumeUnit?: string;
  tankVolumeMax?: number;
};

export interface FlowUpdate {
  flowTime?: Date;
  flowVolume?: number;
  flowVolumeUnit?: string;
};

export class TankData {
  path: string;
  constructor(path: string) {
    this.path = path;
    if (mkdirSync(this.path, {recursive: true})) {
      console.log(`* Created dir ${this.path}`);
    }
  }
  /** write a newline delimited json entry */
  private writeNdjson(p: string, o: any) {
    const s = JSON.stringify(o).trim();
    writeFileSync(p, s + '\n', {
      encoding: 'utf-8',
      flag: 'a+',
    });
  }

  writeTank(d: TankUpdate) {
    const o = {
      tt: d.tankTime?.toISOString(),
      v: d.tankVolume,
      vu: d.tankVolumeUnit,
      vm: d.tankVolumeMax,
      h: d.tankHeight,
      hu: d.tankHeightUnit,
    };
    this.writeNdjson(this.tankFile, o);
  }

  // TODO: tank could have hysteresis (read last good val).
  get tankFile() {
    return join(this.path, 'tank.log');
  }


  writeFlow(d: FlowUpdate) {
    const o = {
      ft: d.flowTime?.toISOString(),
      fv: d.flowVolume,
      fvu: d.flowVolumeUnit,
    };
    this.writeNdjson(this.flowFile, o);
  }

  get flowFile() {
    return join(this.path, 'flow.log');
  }
  readFlow(): FlowUpdate | undefined {
    try {
      const s = readFileSync(this.flowFile, 'utf-8').trim().split('\n').slice(-1)[0];
      const o = JSON.parse(s);

      // translate compact form back to FlowUpdate
      return {
        flowTime: o.ft ? new Date(o.ft) : undefined,
        flowVolume: o.fv,
        flowVolumeUnit: o.fvu,
      };
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
}
