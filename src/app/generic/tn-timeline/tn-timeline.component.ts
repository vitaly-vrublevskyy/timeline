import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from "@angular/core";
import * as vis from 'vis';
import * as _ from 'lodash';
import {TnTimelineZoomComponent} from "../tn-timeline-zoom/tn-timeline-zoom.component";
import {log} from "util";

@Component({
  selector: 'tn-timeline-component',
  templateUrl: './tn-timeline.component.html',
  styleUrls: ['./tn-timeline.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TnTimelineComponent implements OnInit, OnDestroy {


  @Input()
  public showPlayer: boolean;

  @Output()
  select: EventEmitter<string[]> = new EventEmitter();

  @Output()
  unselect: EventEmitter<string[]> = new EventEmitter();

  @Output()
  hoverIn: EventEmitter<string[]> = new EventEmitter();

  @Output()
  hoverOut: EventEmitter<string[]> = new EventEmitter();

  zoomLevel: number; // in seconds

  private timeline: any;

  private minorLabels =  {
    millisecond:'SSS',
    second:     's',
    minute:     'h:mm a',
    hour:       'h:mm a',
    weekday:    'ddd D',
    day:        'D MMM',
    week:       'w',
    month:      'MMM',
    year:       'YYYY'
  };

  private majorLabels =  {
    millisecond:'h:mm:ss a',
    second:     'D MMM h:mm a',
    minute:     'ddd D MMM',
    hour:       'ddd D MMM',
    weekday:    'MMM YYYY',
    day:        'MMM YYYY',
    week:       'MMM YYYY',
    month:      'YYYY',
    year:       ''
  };

  private options = {
    editable: false,
    zoomKey: 'ctrlKey',
    height: '95px',
    maxHeight: '354px',
    min: new Date(2010, 0, 1),    // lower limit of visible
    max: new Date(2025, 0, 1),    // up limit of visible
    zoomMin: 10 * 1000, // 1 sec
    // zoomMax: _.max(this.zoomLevelValues) * 1000,
    horizontalScroll: true,
    showCurrentTime: false,
    multiselect: true,
    format: {
      minorLabels: this.minorLabels,
      majorLabels: this.majorLabels
    }
  };

  private zoomLevelValues = TnTimelineZoomComponent.zoomLevels.map(item => item.value);

  private data: vis.DataSet;

  ngOnInit() {
    // create visualization
    this.data = new vis.DataSet();
  }

  public setData(items: any[]) {
    this.data.add(items);
    if (this.timeline) {
      this.timeline.destroy();
    }

    const container = document.getElementById('timeline');
    this.timeline = new vis.Timeline(container, this.data, this.options);
    this.handleTimelineEvents();
  }


  /**
   * API methods
   * */

  public addEvents(items: any) {
    // TODO: adapter
    this.data.add(items);
    this.timeline.fit();
  }

  public removeEvents(ids: number[]) {
    this.data.remove(ids);
    this.timeline.fit();
  }

  public selectEvents(ids: number[]) {
    this.timeline.setSelection(ids, {focus: true});
  }

  public resetSelection() {
    this.timeline.setSelection([]);
  }


  ngOnDestroy(): void {
    this.timeline.destroy();
  }



  /**
   * Move the timeline a given percentage to left or right
   * @param {Number} percentage   For example 0.1 (left) or -0.1 (right)
   */
  move(percentage: number) {
    const range = this.timeline.getWindow();
    const interval = range.end - range.start;

    this.timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage
    });
  }


  /**
   * Zoom the timeline a given percentage in or out
   * @param {Number} percentage   For example 0.1 (zoom out) or -0.1 (zoom in)
   */
  zoom(percentage: number) {
    const range = this.timeline.getWindow();
    const interval = range.end - range.start;

    this.timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() + interval * percentage
    });
  }

  /* Event Listeners */
  onZoomChanged(zoomLevel: number) {
    // sync zoomLevel in sec into this.timeline.setWindow({start:, end:});
  }

  /**
   * Private
   * */
  private handleTimelineEvents() {
    this.timeline.on('rangechanged', (properties: any) => this.onRangeChanged(properties));
    this.timeline.on('select', (properties: any) => this.select.emit(properties.items));
  }



  onRangeChanged(properties): void {
    // TODO: handle zoom: console.log("Range", properties);
  }

  //FIXME: BoxItem.prototype.repositionY
}


