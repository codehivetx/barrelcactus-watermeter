import {
  Request,
  RestBindings,
  get,
  response,
  ResponseObject,
} from '@loopback/rest';


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
            },
          },
        },
      },
    },
  },
};



export class FlowControllerController {
  constructor() {}

  @get('/flow')
  @response(200, FLOW_RESPONSE)
  flow(): object {
    return {
      reading: 123.456,
      unit: 'gallons',
    };
  }
}
