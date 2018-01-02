import {Component, DoCheck, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation} from "@angular/core";
import {TimeEventVM, TimelineDataVM} from "../../model/view-models";
import * as d3 from 'd3';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  // According to requirements: Don’t use angular view encapsulation
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit, DoCheck {

  /**
   * INPUTS
   * */
  @Input() private data: TimelineDataVM;

  @Input() private selection: TimeEventVM[];

  /**
   * OUTPUTS
   * */

  /* Notify about Click / Unclick on event */
  @Output()
  select: EventEmitter<TimeEventVM> = new EventEmitter();

  /* Hover event */
  @Output()
  hover: EventEmitter<TimeEventVM|null> = new EventEmitter();

  @ViewChild('container')
  private chartContainer: ElementRef;

  /*
  * D3 related properties
  * */
  private svg: any;

  private chart: any; // TODO: rename timeline

  private width: number;
  private height: number;

  constructor() { }

  ngOnInit() {
    const element = this.chartContainer.nativeElement;

    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    const margin = 10;
    this.chart = this.svg.append('g')
      .attr('class', 'timeline')
      .attr('transform', `translate(${margin}, ${margin})`);

    this.resizeToFitContent();
  }

  ngDoCheck() {
    this.resizeToFitContent();
  }


  resizeToFitContent() {
    const margin = 10;
    const element = this.chartContainer.nativeElement;
    if (this.width !== element.offsetWidth || this.height !== element.offsetHeight) {
      this.width = element.offsetWidth;
      this.height = element.offsetHeight;
      this.svg
        .attr('width', this.width)
        .attr('height', this.height);
    }
  }
}
