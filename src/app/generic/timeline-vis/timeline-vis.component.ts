import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import * as vis from 'vis';
import * as _ from 'lodash';

@Component({
  selector: 'app-timeline-vis',
  templateUrl: './timeline-vis.component.html',
  styleUrls: ['./timeline-vis.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineVisComponent implements OnInit {

  timeline: any;

  ngOnInit() {

    // create a dataset with items
    // note that months are zero-based in the JavaScript Date object, so month 3 is April
    const items = new vis.DataSet(this.mock());

    // create visualization
    const container = document.getElementById('visualization');
    const options = {
      editable: false,
      maxHeight: '354px',
      horizontalScroll: true,
      showCurrentTime: false
    };

    this.timeline = new vis.Timeline(container);
    this.timeline.setOptions(options);
    this.timeline.setItems(items);
  }

  mock() {
    const a = [];
    for (let i = 1; i < 10; i++) {
      a.push({
        id: +_.uniqueId(),
        content: '',
        start: new Date(2018, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 29), Math.floor(Math.random() * 24)),
        className: ['radius-5'],
        type: 'point',
        visible: false
      });

    }
    return a;

  }

  clustering() {
    // this.
  }

  /**
   * Move the timeline a given percentage to left or right
   * @param {Number} percentage   For example 0.1 (left) or -0.1 (right)
   */
  move(percentage) {
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
  zoom(percentage) {
    const range = this.timeline.getWindow();
    const interval = range.end - range.start;

    this.timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() + interval * percentage
    });
  }

  // BoxItem.prototype.repositionY

}
