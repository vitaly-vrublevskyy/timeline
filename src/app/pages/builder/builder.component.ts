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
        dateTime: new Date('2016-12-05T00:00:00.000Z')
      }, {
        id: _.uniqueId(),
        name: 'Dynamically second event',
        color: 'red',
        dateTime: new Date('2016-11-06T00:00:00.000Z')
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
  
  forceSelectEvent() {
    this.timeline.selectEvent(['2', '7', '9']);
  }
  
  forceUnSelectEvenEvent() {
    this.timeline.unselectEvent(['2', '7', '9']);
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

  onHoverInEvent(ids: string[]) {
    this.logInfo(`Hover In: ${ids.join(', ')}`);
  }

  onHoverOutEvent(ids: string[]) {
    this.logInfo(`Hover Out: ${ids.join(', ')}`);
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
