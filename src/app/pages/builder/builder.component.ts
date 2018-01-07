import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TimelineService } from './service/timeline.service';
import { TimelineDataVM, TimelineEventVM } from '../../model/view-models';
import * as _ from 'lodash';
import { TimelineComponent } from '../../generic/timeline/timeline.component';

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
  timelineData: TimelineDataVM;
  /**
   * Logger Info
   */
  showLogs: boolean;
  logs: string[] = [];
  /*
  * Timeline component reference
  * */
  @ViewChild(TimelineComponent) private timeline: TimelineComponent;
  @ViewChild('scrollContent') private scrollContainer: ElementRef;


  constructor(private service: TimelineService) {
  }

  ngOnInit(): void {
    this.service.dataSource()
      .subscribe((model: TimelineDataVM) => this.timelineData = model);
  }

  /*
  * Builder Event handlers (Util methods only for the demo achieved goals)
  * */
  onCreateEvent() {
    const items = [
      {
        id: _.uniqueId(),
        name: 'Dynamically added first event',
        color: 'red',
        dateTime: new Date('2016-06-05T00:00:00.000Z')
      }, {
        id: _.uniqueId(),
        name: 'Dynamically second event',
        color: 'red',
        dateTime: new Date('2016-06-06T00:00:00.000Z')
      }
    ];
    this.timeline.addEvents(items);
  }

  onRemoveOddEvent() {
    const ids: string[] = this.timelineData.events
      .map(item => item.id)
      .filter((item, index: number) => index % 2 === 0);

    this.timeline.removeEvents(ids);
  }

  onSelectEvenEvent() {
    const ids: string[] = this.timelineData.events
      .map(item => item.id)
      .filter((item, index: number) => index % 2 === 1);

    this.timeline.selectEvent(ids);
  }

  onUnSelectEvenEvent() {
    const ids: string[] = this.timelineData.events
      .map(item => item.id)
      .filter((item, index: number) => index % 2 === 1);

    this.timeline.unselectEvent(ids);
  }

  /*
  * Timeline Event Handlers
  * */
  onSelectEvent(item: TimelineEventVM): void {
    const state: string = item && item.selected ? 'Select' : 'UnSelect';
    this.logInfo(`${state} Event: ${item.id}`);
  }

  onHoverInEvent(item: TimelineEventVM) {
    this.logInfo(`Hover In: ${item.id}`);
  }

  onHoverOutEvent(item: TimelineEventVM) {
    this.logInfo(`Hover Out: ${item.id}`);
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
