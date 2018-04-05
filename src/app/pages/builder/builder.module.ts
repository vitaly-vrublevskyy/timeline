import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {BuilderComponent} from "./builder.component";
import {BuilderRoutingModule} from "./builder-routing.module";
import {TimelineService} from "./service/timeline.service";
import {TnTimelineModule} from "../../generic/tn-timeline.module";

@NgModule({
  imports: [
    CommonModule,
    BuilderRoutingModule,
    TnTimelineModule
  ],
  declarations: [BuilderComponent],
  providers: [TimelineService]
})
export class BuilderModule {
}
