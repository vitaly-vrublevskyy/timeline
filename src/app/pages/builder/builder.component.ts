import {Component, ElementRef, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";
import {TimelineService} from "./service/timeline.service";
import {TimelineEventVM, TimelineDataVM} from "../../model/view-models";

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

  @ViewChild('scrollContent') private scrollContainer: ElementRef;


  constructor(private service: TimelineService) {
  }

  ngOnInit(): void {
    this.service.dataSource()
      .subscribe((model: TimelineDataVM) => this.timelineData = model);
  }

  onToggleSelect(item: TimelineEventVM): void {
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
