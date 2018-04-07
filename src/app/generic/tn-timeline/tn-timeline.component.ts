import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from "@angular/core";
import * as vis from "vis";
import * as _ from "lodash";
import {TnTimelineZoomComponent} from "../tn-timeline-zoom/tn-timeline-zoom.component";
import {TimelineItem} from "vis";

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
  select: EventEmitter<number[]> = new EventEmitter();

  @Output()
  unselect: EventEmitter<number[]> = new EventEmitter();

  @Output()
  hoverIn: EventEmitter<number> = new EventEmitter();

  @Output()
  hoverOut: EventEmitter<number> = new EventEmitter();

  dataSet: vis.DataSet<TimelineItem>;

  @ViewChild('timelineContainer')
  private container: ElementRef;

  zoomLevel: number; // in seconds

  private timeline: vis.Timeline;

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
    height: '94px',
    maxHeight: '94px',
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


  ngOnInit() {
    // create visualization
    this.dataSet = new vis.DataSet();
  }

  public setData(items: any[]) {
    if (this.timeline) {
      this.dataSet.clear();
    }
    // TODO: Adapter into TimelineItem
    this.dataSet.add(items);

    if (this.timeline) {
      this.timeline.fit({animation: {duration: 100, easingFunction: 'linear'}});
    } else {
      this.timeline = new vis.Timeline(this.container.nativeElement, this.dataSet, this.options);
      this.handleTimelineEvents();
    }
  }

  /**
   * API methods
   * */

  public addEvents(items: TimelineItem[]) {
    this.dataSet.add(items);
    this.timeline.fit();
  }

  public removeEvents(ids: number[]) {
    this.dataSet.remove(ids);
    this.timeline.fit();
  }

  public selectEvents(...ids: number[]) {
    this.timeline.setSelection(ids, {focus: true});
    this.select.emit(ids);
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
   * @param {Number} percentage
   */
  zoomIn(percentage: number) {
    this.timeline.zoomIn(percentage);
  }

  zoomOut(percentage: number) {
    this.timeline.zoomOut(percentage);
  }


  /* Event Listeners */
  onZoomChanged(zoomLevel: number) {
    // sync zoomLevel in sec into this.timeline.setWindow({start:, end:});
  }

  onSelectEventById(id: number) {
    this.unselectAll();
    this.selectEvents(id);
  }

  fitAllEvents() {
    this.timeline.fit();
    this.unselectAll();
    this.timeline.setSelection([]);
  }

  /**
   * Private
   * */

  private handleTimelineEvents() {
    /* Select */
    this.timeline.on('select', (properties: any) => this.select.emit(properties.items));
    /* Mouse Over */
    this.timeline.on('itemover', (properties: any) => this.hoverIn.emit(properties.item));
    /* Mouse Out */
    this.timeline.on('itemout', (properties: any) => this.hoverOut.emit(properties.item));
    /* Range Changed */
    this.timeline.on('rangechanged', (properties: any) => this.onRangeChanged(properties));
  }

  private unselectAll() {
    const ids: number[] = this.timeline.getSelection();
    if (!_.isEmpty(ids)) {
      this.unselect.emit(ids);
    }
  }

  private onRangeChanged(properties): void {
    // TODO: handle zoom: console.log("Range", properties);
  }
}


