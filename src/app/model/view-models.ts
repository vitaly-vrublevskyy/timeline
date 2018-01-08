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
}

export class TimelineEventGroup {
  ids: string[];
  groupedEvents: TimelineEventVM[];

  name: string;
  dateTime: Date;
  color: string; // #Hex

  // Internal properties binded in timeline
  selected: boolean; // Indicate selected event (Click / Unclick )
  hovered: boolean;
  play: boolean;


  constructor(event: TimelineEventVM) {
    this.name = event.name;
    this.dateTime = event.dateTime;
    this.color = event.color;
    this.selected = false;
    this.hovered = false;
    this.play = false;
    this.groupedEvents = [event];
  }

  invalidate() {
    this.ids = this.groupedEvents.map(event => event.id);
    // name merged with <br> to display in html tooltip
    // this.name = this.groupedEvents.reduce((accumulator, {name}) => (accumulator + name + '<br>'), '');
    this.name = this.groupedEvents.map(item => item.name).join('\n');
  }

  toString(): string {
    return (this.ids.join('') + this.hovered + this.selected);
  }
}
