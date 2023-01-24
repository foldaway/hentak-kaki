import axios from 'axios';
import { DateTime } from 'luxon';

export interface Response {
  area_metadata: AreaMetadatum[];
  items: Item[];
  api_info: APIInfo;
}

export interface APIInfo {
  status: string;
}

export interface AreaMetadatum {
  name: string;
  label_location: LabelLocation;
}

export interface LabelLocation {
  latitude: number;
  longitude: number;
}

export interface Item {
  update_timestamp: Date;
  timestamp: Date;
  valid_period: ValidPeriod;
  forecasts: ForecastElement[];
}

export interface ForecastElement {
  area: string;
  forecast: ForecastEnum;
}

export enum ForecastEnum {
  Cloudy = 'Cloudy',
  LightRain = 'Light Rain',
  ModerateRain = 'Moderate Rain',
}

export interface ValidPeriod {
  start: Date;
  end: Date;
}

export default async function fetchWeatherData(): Promise<Response> {
  const date = DateTime.now().toISODate();

  const response = await axios.get<Response>(
    `https://api.data.gov.sg/v1/environment/2-hour-weather-forecast?date=${date}`
  );

  return response.data;
}
