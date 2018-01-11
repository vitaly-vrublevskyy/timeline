import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TnTimelinePlayerComponent} from './tn-timeline-player/tn-timeline-player.component';
import {TnTimelineComponent} from './tn-timeline/tn-timeline.component';
import {TnTimelineZoomComponent} from './tn-timeline-zoom/tn-timeline-zoom.component';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    TnTimelinePlayerComponent,
    TnTimelineZoomComponent,
    TnTimelineComponent
  ],
  exports: [
    TnTimelineComponent
  ]
})
export class TnTimelineModule { }
