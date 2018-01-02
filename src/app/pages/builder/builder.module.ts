import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuilderComponent } from './builder.component';
import {BuilderRoutingModule} from './builder-routing.module';

@NgModule({
  imports: [
    CommonModule,
    BuilderRoutingModule
  ],
  declarations: [BuilderComponent]
})
export class BuilderModule { }
