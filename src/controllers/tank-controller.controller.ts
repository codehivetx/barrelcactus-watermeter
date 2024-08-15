import {
  Request,
  RestBindings,
  get,
  response,
  ResponseObject,
} from '@loopback/rest';

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
                description: 'unit of measurement',
              },
            },
          },
        },
      },
    },
  },
};



export class TankControllerController {
  constructor() {}

  // Map to `GET /ping`
  @get('/tank')
  @response(200, TANK_RESPONSE)
  tank(): object {
    throw Error('foo')
    // Reply with a greeting, the current time, the url, and request headers
    return {
      level: 123.456,
      max: 999.000,
      unit: 'gallons',
    };
  }
}
