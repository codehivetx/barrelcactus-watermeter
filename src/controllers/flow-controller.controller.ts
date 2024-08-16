import {
  get,
  response,
  ResponseObject
} from '@loopback/rest';
import {getTankIo} from '../gpio/tankgpio';



const FLOW_RESPONSE: ResponseObject = {
  description: 'Flow Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'FlowResponse',
        properties: {
          flow: {
            type: 'object',
            properties: {
              reading: {
                type: 'number',
                description: 'number of units consumed. counts up.'
              },
              unit: {
                type: 'string',
                description: 'unit of measurement',
              },
              when: {
                type: 'string',
                description: 'time of measurement',
              },
            },
          },
        },
      },
    },
  },
};



export class FlowControllerController {
  constructor() { }

  @get('/flow')
  @response(200, FLOW_RESPONSE)
  async flow(): Promise<object> {
    const t = getTankIo();
    await t.setup(); // make sure it's setup.

    if (!t.flowTime) throw Error(`No data yet`);

    return {
      reading: t.flowVolume,
      unit: t.flowVolumeUnit,
      when: t.flowTime.toISOString(),
    };
  }
}
