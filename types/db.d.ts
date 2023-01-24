declare namespace DB {
  type SectorStatus = 'was_cat_one' | 'now_cat_one' | 'extended' | null;

  interface SectorAPICache {
    previousForecast: string;
    latestForecast: string;
    previousForecastPeriodEnd: Date;
    previousForecastPeriodStart: Date;
    latestForecastPeriodEnd: Date;
    latestForecastPeriodStart: Date;
  }

  interface Sector {
    name: string;
    apiCache: SectorAPICache | null;
    status: SectorStatus;
  }

  interface Subscriber {
    chatId: number;
    sectorNames: string[];
  }
}
