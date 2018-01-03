import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild,
  ViewEncapsulation
} from "@angular/core";
import { TimeEventVM, TimelineDataVM } from '../../model/view-models';
import * as d3 from 'd3';
import {Subscription} from "rxjs/Subscription";
import {TimerObservable} from "rxjs/observable/TimerObservable";

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  // According to requirements: Don’t use angular view encapsulation
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit, OnChanges, OnDestroy {
  /**
   * INPUTS
   * */
  @Input() public data: TimelineDataVM;

  @Input() private selection: TimeEventVM[];
  /**
   * OUTPUTS
   * */
  /* Notify about Click / Unclick on event */
  @Output()
  select: EventEmitter<TimeEventVM> = new EventEmitter();
  /* Hover event */
  @Output()
  hover: EventEmitter<TimeEventVM | null> = new EventEmitter();

  /*
  * Access to Template
  * */
  @ViewChild('container')
  private chartContainer: ElementRef;

  @ViewChild('svg')
  private svgElement: ElementRef;
  /*
  * D3 related properties
  * */
  private svg: any;
  private chart: any; // TODO: rename timeline
  private width: number;
  private height: number;
  private xScale: any;
  private xAxis: any;
  private brush: any;
  private zoom: any;
  private xAxisGroup: any;
  private lastSelection: any[];
  private brushGroup: any;
  private dataGroup: any;
  private zoomTransform: any;
  private circles: any;

  private margin: any = {top: 0, bottom: 0, left: 0, right: 0};

  /**
   * Player related properties
   * */
  private playbackSubscription: Subscription;

  constructor() {
  }

  ngOnInit() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.select(this.svgElement.nativeElement)
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    this.chart = this.svg.append('g')
      .attr('class', 'timeline')
      .attr('transform', `translate(${this.margin.left + 170}, ${this.margin.top + 30})`);

    this.xScale = d3.scaleTime()
      .domain([this.data.timeConfig.start, this.data.timeConfig.end])
      .range([0, this.width]);
    this.xAxis = d3.axisBottom(this.xScale);
    this.xAxisGroup = this.chart.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,  46)`)
      .call(this.xAxis);

    this.brushGroup = this.chart.append('g')
      .attr('class', 'brush')
      .attr('transform', `translate(0, 0)`);
    this.brush = d3.brushX()
      .extent([[0, 0], [this.width, this.height - 30]])
      .on('end', () => {
        if (!d3.event.sourceEvent) {
          return;
        }// Only transition after input.
        if (!d3.event.selection) {
          return;
        }// Ignore empty selections.
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
          return;
        }// ignore brush-by-zoom
        const d0 = d3.event.selection.map(this.xScale.invert),
          // rounded
          d1 = d0.map(d3.timeDay.round);

        const selectAll = this.dataGroup.selectAll('circle');

        // selection highlights
        if (d3.event.selection === null) {
          selectAll.style('fill', 'inital');
        } else {

          selectAll.style('fill', (d) => {
            const b = d0[0].getTime() <= d.dateTime.getTime() && d.dateTime.getTime() <= d0[1].getTime();
            return b ? d.color : '#fff';
          });
        }

        this.lastSelection = d0;
        d3.select('.brush').transition().call(d3.event.target.move, d0.map(this.xScale));
      });

    this.brushGroup.call(this.brush);

    this.dataGroup = this.chart.append('g')
      .attr('class', 'datagroup');

    this.ngOnChanges(null);
  }

  highlightPoint(index: number) {
    console.log('highlightPoint, index:', index);
    // TODO: highlight logic
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy() {
    // Unsubscribe timer
    this.playbackSubscription.unsubscribe();
  }

  private updateChart() {
    const points = this.data.events;

    this.circles = this.dataGroup.selectAll('circle')
      .data(points, (d) => d.id);

    this.circles.enter()
      .append('circle')
      .attr('cy', (d) => 46)
      .attr('r', 5)
      .attr('fill', d => d.color)
      .merge(this.circles)
      .attr('cx', (d: TimeEventVM) => {
        const scalex = this.zoomTransform ? this.zoomTransform.k : 1;
        return scalex * this.xScale(d.dateTime);
      });
    this.circles.exit().remove();
  }

/**
  1. x(3)
  2. x(2.5)
  3. x(2)
  4. x(1.5)
  5. x(1) - default
  6. x(-1.5)
  7. x(-2)
  8. x(-2.5)
  9. x(-3)
 **/
  private startPlayer(speed: number = 1) {
    if (speed < 0) {
      speed = Math.abs( 1 / speed );
    }
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }

    const times: number = this.data.events.length;
    this.playbackSubscription = TimerObservable.create(0, speed * 1000)
      .take(times)
      .subscribe(t => this.highlightPoint(t));
  }
}
