import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {BuilderComponent} from './builder.component';

const routes: Routes = [
  {
    path: 'builder',
    component: BuilderComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BuilderRoutingModule {
}
