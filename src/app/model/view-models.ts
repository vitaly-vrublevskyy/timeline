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
  hash: string;

  constructor(event: TimelineEventVM) {
    this.name = event.name;
    this.dateTime = event.dateTime;
    this.color = event.color;
    this._selected = false;
    this._hovered = false;
    this._play = false;
    this.groupedEvents = [event];

    this.invalidate();
  }

  // Internal properties binded in timeline
  private _selected: boolean; // Indicate selected event (Click / Unclick )

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
    this.invalidate();
  }

  private _hovered: boolean;

  get hovered(): boolean {
    return this._hovered;
  }

  set hovered(value: boolean) {
    this._hovered = value;
    this.invalidate();
  }

  private _play: boolean;

  get play(): boolean {
    return this._play;
  }

  set play(value: boolean) {
    this._play = value;
    this.invalidate();
  }

  invalidate() {
    this.ids = this.groupedEvents.map(event => event.id);
    // name merged with <br> to display in html tooltip
    // this.name = this.groupedEvents.reduce((accumulator, {name}) => (accumulator + name + '<br>'), '');
    this.name = this.groupedEvents.map(item => item.name).join('\n');
    this.hash = JSON.parse(JSON.stringify(this.hs()));
    console.log(this.hash);
  }

  toString(): string {
    return (this.ids.join('') + this._hovered + this._selected);
  }

  hs(): string {
    return '#' + this._play + this._hovered + this._selected + this.ids.join('-');
  }
}
