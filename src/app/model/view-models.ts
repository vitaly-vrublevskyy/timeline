export interface TimelineDataVM {
  timeConfig: TimeConfigVM;
  events: TimelineEventVM[];
  timeZone: string; // moment.Timezone
}

export interface TimeConfigVM {
  id?: number;
  start: Date;
  end: Date;
}

export interface TimelineEventVM {
  id?: number;
  dateTime: Date;
  color?: string | number; // #Hex
  /**
   * Internal properties
   * */
  selected?: boolean; // Indicate selected event (Click / Unclick )
}
