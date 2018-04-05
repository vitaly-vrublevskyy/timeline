import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {TimelineComponent} from "./timeline/timeline.component";
import {TnTimelineZoomComponent} from "./tn-timeline-zoom/tn-timeline-zoom.component";
import {TnTimelineComponent} from "./tn-timeline/tn-timeline.component";
import {TnTimelinePlayerComponent} from "./tn-timeline-player/tn-timeline-player.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    TnTimelinePlayerComponent,
    TimelineComponent,
    TnTimelineZoomComponent,
    TnTimelineComponent
  ],
  exports: [
    TimelineComponent,
    TnTimelineComponent,
  ]
})
export class TnTimelineModule {
}
