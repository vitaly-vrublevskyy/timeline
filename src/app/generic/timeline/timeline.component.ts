import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { TimeEventVM, TimelineDataVM } from '../../model/view-models';
import * as d3 from 'd3';
import { Subscription } from 'rxjs/Subscription';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

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
  /* Notify about Click / Unclick on event */
  @Output()
  select: EventEmitter<TimeEventVM> = new EventEmitter();
  /**
   * OUTPUTS
   * */
  /* Hover event */
  @Output()
  hover: EventEmitter<TimeEventVM | null> = new EventEmitter();
  @Input() private selection: TimeEventVM[];
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
    this.buildTimeline();

    this.invalidateDisplayList();

    this.addEventListeners();

    // this.startPlayer(-3); // Test
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart) {
      this.invalidateDisplayList();
    }
  }

  ngOnDestroy() {
    // Unsubscribe timer
    this.playbackSubscription.unsubscribe();
  }

  /*
  * Event Handlers
  * */

  onEventClick(item: TimeEventVM) {
    item.selected = !item.selected; // Toggle
    this.select.emit(item);
    this.invalidateDisplayList();
  }

  private invalidateDisplayList() {
    const points = this.data.events;

    this.circles = this.dataGroup.selectAll('circle')
      .data(points, (d) => d.id);

    this.circles.enter()
      .append('circle')
      .attr('cy', (d) => 46)
      .attr('r', 5)
      .attr('fill', d => d.color)
      .on('click', (item: TimeEventVM) => this.onEventClick(item))
      .merge(this.circles)
      .style('fill', d => d.selected ? d.color : '#ffffff')
      .attr('cx', (d: TimeEventVM) => {
        const scalex = this.zoomTransform ? this.zoomTransform.k : 1;
        return scalex * this.xScale(d.dateTime);
      });
    this.circles.exit().remove();
  }

  private buildTimeline() {
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
          this.clearSelection();
          return;
        }// Ignore empty selections.
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
          return;
        }// ignore brush-by-zoom
        const selectionDateRange = d3.event.selection.map(this.xScale.invert),
          // rounded
          d1 = selectionDateRange.map(d3.timeDay.round);

        this.updateBrushSelection(selectionDateRange);

        this.lastSelection = selectionDateRange;
        d3.select('.brush').transition().call(d3.event.target.move, selectionDateRange.map(this.xScale));
      });

    this.brushGroup.call(this.brush);

    this.dataGroup = this.chart.append('g')
      .attr('class', 'datagroup');
  }

  private addEventListeners() {
    // TODO: click / mouse over / out

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
      speed = Math.abs(1 / speed);
    }
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }
    const period = 1000 / speed;
    const times: number = this.data.events.length + 1;
    this.playbackSubscription = TimerObservable.create(0, period)
      .take(times)
      .subscribe(index => this.highlightPoint(index));
  }


  private highlightPoint(index: number) {
    this.data.events.forEach((item: TimeEventVM, i: number) => item.selected = i === index);
    this.invalidateDisplayList();
    if (index > 0) {
      // Unselect prev
      this.select.emit(this.data.events[index - 1]);
    }
    if (index < this.data.events.length) {
      // Select current item
      this.select.emit(this.data.events[index]);
    }
  }

  private clearSelection() {
    this.data.events.forEach((d) => {
      d.selected = false;
    });
    this.invalidateDisplayList();
  }

  private updateBrushSelection(dateRange: Date[]) {
    const [start, end] = dateRange.map(a => a.getTime());

    this.data.events.forEach((d) => {
      d.selected = start <= d.dateTime.getTime()
        && d.dateTime.getTime() <= end;
    });

    this.invalidateDisplayList();
  }
}
