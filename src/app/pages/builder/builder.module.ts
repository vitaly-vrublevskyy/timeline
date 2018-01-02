import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuilderComponent } from './builder.component';
import {BuilderRoutingModule} from './builder-routing.module';
import {GenericModule} from "../../generic/generic.module";

@NgModule({
  imports: [
    CommonModule,
    BuilderRoutingModule,
    GenericModule
  ],
  declarations: [BuilderComponent]
})
export class BuilderModule { }
