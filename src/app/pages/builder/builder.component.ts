import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TimelineService } from './service/timeline.service';
import { TimelineDataVM } from '../../model/view-models';
import * as _ from 'lodash';
import { TimelineComponent } from '../../generic/timeline/timeline.component';
import {TnTimelineComponent} from "../../generic/tn-timeline/tn-timeline.component";

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.scss'],
  // According to requirements: Don’t use angular view encapsulation
  encapsulation: ViewEncapsulation.None
})
export class BuilderComponent implements OnInit {

  /**
   * Data Source for timeline control
   * */
  timelineData: any; //TimelineDataVM;
  /**
   * Logger Info
   */
  showLogs: boolean;
  logs: string[] = [];
  /*
  * Timeline component reference
  * */
  @ViewChild(TnTimelineComponent) private timeline: TnTimelineComponent;
  @ViewChild('scrollContent') private scrollContainer: ElementRef;


  constructor(private service: TimelineService) {
  }

  ngOnInit(): void {
    this.timelineData = this.mock();
    this.service.dataSource()
      .subscribe((model: TimelineDataVM) => this.timeline.setData(this.timelineData));

  }

  /*
  * Builder Event handlers (Util methods only for the demo achieved goals)
  * */
  onCreateEvent() {
    this.timeline.addEvents(this.mock(3));
  }

  mock(count: number = 10) {
    const a = [];
    for (let i = 0; i < count; i++) {
      a.push({
        id: +_.uniqueId(),
        content: '',
        title: 'Dynamically added first event',
        start: new Date(2018, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 29), Math.floor(Math.random() * 24)),
        className: 'radius-5',
        type: 'point',
        visible: false
      });
    }
    return _.orderBy(a, 'start');
  }

  onRemoveOddEvent() {
    const ids: number[] = this.timelineData
      .map(item => item.id)
      .filter((item, index: number) => index % 2 === 0);

    this.timeline.removeEvents(ids);
  }

  forceSelectEvent() {
    const ids: number[] = this.timelineData
      .map(item => item.id)
      .filter((item, index: number) => index % 2 === 1);

    this.timeline.selectEvents(...ids);
  }

  forceUnSelectEvenEvent() {
    this.timeline.resetSelection();
  }

  /*
  * Timeline Event Handlers
  * */
  onSelectEvent(ids: string[]): void {
    this.logInfo(`Select Event: ${ids}`);
  }

  onUnSelectEvent(ids: string[]): void {
    this.logInfo(`UnSelect Event: ${ids}`);
  }

  onHoverInEvent(id: string) {
    this.logInfo(`Hover In: ${id}`);
  }

  onHoverOutEvent(id: string) {
    this.logInfo(`Hover Out: ${id}`);
  }

  datasetclick(option: number) {
    this.timelineData = this.service['data' + option];
  }

  private logInfo(message: string) {
    const options = {hour: 'numeric', minute: 'numeric', second: 'numeric'};
    const timestamp = new Date().toLocaleTimeString('en-US', options);
    const line = `[INFO] - ${timestamp}: ${message}`;
    this.logs.push(line);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }, 0);
  }
}
