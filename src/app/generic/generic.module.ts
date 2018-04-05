import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './timeline/timeline.component';
import { PlayerComponent } from './player/player.component';
import { ZoomComponent } from './zoom/zoom.component';
import { TimelineVisComponent } from './timeline-vis/timeline-vis.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    PlayerComponent,
    TimelineComponent,
    ZoomComponent,
    TimelineVisComponent,
  ],
  exports: [
    TimelineVisComponent,
    TimelineComponent,
  ]
})
export class GenericModule { }
