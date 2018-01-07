import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './timeline/timeline.component';
import { PlayerComponent } from './player/player.component';
import { ZoomComponent } from './zoom/zoom.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    PlayerComponent,
    TimelineComponent,
    ZoomComponent
  ],
  exports: [
    TimelineComponent
  ]
})
export class GenericModule { }
