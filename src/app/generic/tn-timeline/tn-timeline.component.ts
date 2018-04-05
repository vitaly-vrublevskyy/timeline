import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from "@angular/core";
import * as vis from 'vis';
import * as _ from 'lodash';
import {TnTimelineZoomComponent} from "../tn-timeline-zoom/tn-timeline-zoom.component";

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
    millisecond:'HH:mm:ss',
    second:     'D MMMM HH:mm',
    minute:     'ddd D MMMM',
    hour:       'ddd D MMMM',
    weekday:    'MMMM YYYY',
    day:        'MMMM YYYY',
    week:       'MMMM YYYY',
    month:      'YYYY',
    year:       ''
  };

  private zoomLevelValues = TnTimelineZoomComponent.zoomLevels.map(item => item.value);

  mock() {
    const a = [];
    for (let i = 1; i < 10; i++) {
      a.push({
        id: +_.uniqueId(),
        content: '',
        title: 'Normal text',
        start: new Date(2018, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 29), Math.floor(Math.random() * 24)),
        className: 'radius-5',
        type: 'point',
        visible: false
      });

    }
    return a;

  }

  ngOnInit() {
    // create a dataset with items
    const items = new vis.DataSet(this.mock());

    // create visualization
    const container = document.getElementById('visualization');
    const options = {
      editable: false,
      zoomKey: 'ctrlKey',
      height: '95px',
      maxHeight: '354px',
      min: new Date(2000, 0, 1),    // lower limit of visible
      zoomMin: 1000, //_.min(this.zoomLevelValues) * 1000,
      // zoomMax: _.max(this.zoomLevelValues) * 1000,
      horizontalScroll: true,
      showCurrentTime: false,
      format: {
        minorLabels: this.minorLabels,
        majorLabels: this.majorLabels
      }
    };

    this.timeline = new vis.Timeline(container);
    this.timeline.setOptions(options);
    this.timeline.setItems(items);

    this.timeline.on('rangechanged',  (properties) => this.onRangeChanged(properties));

  }

  ngOnDestroy(): void {
  }

  /**
   * API methods
   * */
  selectEvent(ids: string[]) {
    // Set Selection
    //this.timeline.setSelection(ids, {focus: focus.checked});
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
  // sync zoomLevel in sec into this.timeline.setWindow({start:, end:});
  onZoomChanged(zoomLevel: number) {

  }

  onRangeChanged(properties): void {
    console.log("Range", properties);
  }

  //FIXME: BoxItem.prototype.repositionY
}


