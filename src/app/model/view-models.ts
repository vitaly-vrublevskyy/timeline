export interface TimelineDataVM {
  timeConfig: TimeConfigVM;
  events: TimelineEventVM[];
  timeZone: string; // moment.Timezone
}

export interface TimeConfigVM {
  id: number;
  start: Date;
  end: Date;
}

export interface TimelineEventVM {
  id: number;
  name: string;
  dateTime: Date;
  color: string; // #Hex
  // Internal properties binded in timeline
  selected?: boolean; // Indicate selected event (Click / Unclick )
  hovered?: boolean;
}
