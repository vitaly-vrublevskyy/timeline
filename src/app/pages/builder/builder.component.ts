import {Component, OnInit, ViewEncapsulation} from "@angular/core";
import {TimelineService} from "./service/timeline.service";
import {TimeEventVM, TimelineDataVM} from "../../model/view-models";

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
  logs: string[] = [];

  constructor(private service: TimelineService) {
  }

  ngOnInit(): void {
    this.service.dataSource()
      .subscribe((model: TimelineDataVM) => this.timelineData = model);
  }

  onToggleSelect(item: TimeEventVM): void {
    const state: string = item && item.selected ? 'Select' : 'UnSelect';
    this.logInfo(`${state}  Event`);
  }

  onHoverEvent(item: TimeEventVM) {
    this.logInfo(`${item}  Event`);
  }

  private logInfo(message: string) {
    const line: string = `[INFO] - ${new Date().toTimeString()}: ${message}`;
    this.logs.push(line);
  }

}
