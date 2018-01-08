export interface TimelineDataVM {
  timeConfig: TimeConfigVM;
  events: TimelineEventVM[];
  timeZone: string; // moment.Timezone
}

export interface TimeConfigVM {
  id: string;
  start: Date;
  end: Date;
}

export interface TimelineEventVM {
  id: string;
  name: string;
  dateTime: Date;
  color: string; // #Hex
  // Internal properties binded in timeline
  selected?: boolean; // Indicate selected event (Click / Unclick )
  hovered?: boolean;
}

// TODO: refactor to encapsulate all related logic, like: export class ... with constructor and invalidate() methods
export interface TimelineEventGroup {
  id: string; // TODO: refactor ids: string[] =  groupedEvents.map(id => id)
  name: string;
  dateTime: Date;
  color: string; // #Hex
  // Internal properties binded in timeline
  selected?: boolean; // Indicate selected event (Click / Unclick )
  hovered?: boolean;
  groupedEvents: TimelineEventVM[];
}
