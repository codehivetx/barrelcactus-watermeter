import {
  get,
  response,
  ResponseObject
} from '@loopback/rest';

import {getTankIo} from '../gpio/tankgpio.js';

const TANK_RESPONSE: ResponseObject = {
  description: 'Tank Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'TankResponse',
        properties: {
          tank: {
            type: 'object',
            properties: {
              level: {
                type: 'number',
                description: 'tank level'
              },
              max: {
                type: 'number',
                description: 'max tank level'
              },
              unit: {
                type: 'string',
                description: 'volume unit of measurement',
              },
              lunit: {
                type: 'string',
                description: 'level unit of measurement',
              },
              when: {
                type: 'string',
                description: 'when data was received',
              }
            },
          },
        },
      },
    },
  },
};



export class TankControllerController {
  constructor() { }

  @get('/tank')
  @response(200, TANK_RESPONSE)
  async tank(): Promise<object> {
    const t = getTankIo();
    await t.setup(); // make sure it's setup.

    if (!t.tankTime) throw Error(`No data yet`);

    return {
      level: t.tankHeight,
      volume: t.tankVolume,
      max: t.tankVolumeMax,
      unit: t.tankVolumeUnit,
      lunit: t.tankHeightUnit,
      when: t.tankTime.toISOString(),
    };
  }
}
