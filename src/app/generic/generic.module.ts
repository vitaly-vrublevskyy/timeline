import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './timeline/timeline.component';
import { PlayerComponent } from './player/player.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    PlayerComponent,
    TimelineComponent
  ],
  exports: [
    TimelineComponent
  ]
})
export class GenericModule { }
