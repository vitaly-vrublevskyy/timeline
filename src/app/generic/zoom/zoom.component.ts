import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';

interface Option {
  value: number;
  displayValue: string;
}

@Component({
  selector: 'app-zoom',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ZoomComponent implements OnChanges {

  /**
   *  Zoom level in seconds
   **/
  @Input()
  zoom: number;

  @Output()
  zoomChange: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Active zoom index
   * */
  private zoomIndex = 1;

  /**
   *  Mapping with whole available Time Scale Level with appropriate values in seconds
   *  */
  private zoomLevels: Option[] = [
    {value: 1, displayValue: '1 Second'},
    {value: 10, displayValue: '10 Seconds'},
    {value: 15, displayValue: '15 Seconds'},
    {value: 60, displayValue: '1 Minute'},
    {value: 5 * 60, displayValue: '5 Minutes'},
    {value: 15 * 60, displayValue: '15 Minutes'},
    {value: 30 * 60, displayValue: '30 Minutes'},
    {value: 60 * 60, displayValue: '1 Hour'},
    {value: 4 * 60 * 60, displayValue: '4 Hours'},
    {value: 12 * 60 * 60, displayValue: '12 Hour'},
    {value: 24 * 60 * 60, displayValue: '1 Day'},
    {value: 7 * 24 * 60 * 60, displayValue: '1 Week'},
    {value: 4 * 7 * 24 * 60 * 60, displayValue: '1 Month'},
    {value: 31556926, displayValue: '1 Year'}
  ].reverse();


  /**
   *
   * Active Zoom level option.
   * @Return One of the option from zoomLevels map
   * */
  get zoomLevel(): Option {
    return this.zoomLevels[this.zoomIndex];
  }

  get isMinZoomLevel(): boolean {
    return this.zoomIndex === 0;
  }

  get isMaxZoomLevel(): boolean {
    return this.zoomIndex === this.zoomLevels.length - 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zoom'] && changes['zoom'].currentValue) {
      this.zoomIndex = _.findIndex(this.zoomLevels, {value: this.zoom});
    }
  }

  zoomIn() {
    if (this.zoomIndex < this.zoomLevels.length - 1) {
      this.zoomIndex++;
      this.zoomChange.emit(this.zoomLevel.value);
    }
  }

  zoomOut() {
    if (this.zoomIndex > 0) {
      this.zoomIndex--;
      this.zoomChange.emit(this.zoomLevel.value);
    }
  }
}
