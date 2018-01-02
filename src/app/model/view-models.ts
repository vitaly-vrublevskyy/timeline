export interface TimelineDataVM {
  timeConfig: TimeConfigVM;
  events: TimeEventVM[];
  timeZone: string; // moment.Timezone
}

export interface TimeConfigVM {
  id?: number;
  start: Date;
  end: Date;
}


export interface TimeEventVM {
  id?: number;
  dateTime: Date;
  style: string; // redundunt
  color?: number; // #Hex
  /**
   * Internal properties
   * */
  selected?: boolean; // Indicate selected event (Click / Unclick )
}
