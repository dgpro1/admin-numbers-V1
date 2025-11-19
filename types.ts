export interface BaseEntity {
  id: string;
  created_at: string;
  user_id?: string;
}

export interface SalesNumber extends BaseEntity {
  number: string;
  product: string;
  status: string;
  addedToKommoSources: 'Sí' | 'No';
  channelType: string;
  activeCountries: string[];
  phoneNumberLabel: string;
  positionLabel: string;
}

export interface Product extends BaseEntity {
  name: string;
  order?: number;
}

export interface Status extends BaseEntity {
  name: string;
  order?: number;
}

export interface PhoneNumberLabel extends BaseEntity {
  name: string;
  order?: number;
}

export interface PositionLabel extends BaseEntity {
  name: string;
  order?: number;
}

export interface ChannelType extends BaseEntity {
  name: string;
  order?: number;
}

export interface ActivityLog extends BaseEntity {
  actionType: string;
  recordType: string;
  description: string;
}

export interface Note extends BaseEntity {
  text: string;
  sales_number_id: string;
}

export interface ColumnDefinition {
  id: string;
  name: string;
  key: keyof SalesNumber | 'actions';
  type: 'text' | 'status' | 'kommo' | 'array' | 'actions';
}