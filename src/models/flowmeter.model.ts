import {Model, model, property} from '@loopback/repository';

@model()
export class Flowmeter extends Model {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  name: string;

  @property({
    type: 'number',
    required: true,
  })
  curGallons: number;


  constructor(data?: Partial<Flowmeter>) {
    super(data);
  }
}

export interface FlowmeterRelations {
  // describe navigational properties here
}

export type FlowmeterWithRelations = Flowmeter & FlowmeterRelations;
