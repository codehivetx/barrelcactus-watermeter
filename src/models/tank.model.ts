import {Model, model, property} from '@loopback/repository';

@model()
export class Tank extends Model {
  @property({
    type: 'number',
    required: true,
  })
  diameterInches: number;

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
  minInches: number;

  @property({
    type: 'number',
    required: true,
  })
  maxInches: number;

  @property({
    type: 'number',
    required: true,
  })
  curInches: number;

  @property({
    type: 'number',
    required: true,
  })
  maxGallons: number;

  @property({
    type: 'number',
    required: true,
  })
  curGallons: number;


  constructor(data?: Partial<Tank>) {
    super(data);
  }
}

export interface TankRelations {
  // describe navigational properties here
}

export type TankWithRelations = Tank & TankRelations;
