import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { TimelineEventVM, TimelineDataVM } from '../../model/view-models';
import * as d3 from 'd3';


@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit, OnChanges {
  /**
   * Inputs
   * */
  @Input() public data: TimelineDataVM;

  @Input() private selection: TimelineEventVM[];

  /**
   * Outputs
   * */

  /* Notify about Click / Unclick */
  @Output()
  select: EventEmitter<TimelineEventVM> = new EventEmitter();

  @Output()
  hoverIn: EventEmitter<TimelineEventVM> = new EventEmitter();

  @Output()
  hoverOut: EventEmitter<TimelineEventVM> = new EventEmitter();

  /*
  * Access to View Template
  * */
  @ViewChild('container')
  private chartContainer: ElementRef;

  @ViewChild('svg')
  private svgElement: ElementRef;
  /*
  * D3 related properties
  * */
  private svg: any;
  private timeline: any;
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

  constructor() {
  }

  /*
  * Ng Hooks
  * */
  ngOnInit() {
    this.buildTimeline();

    this.invalidateDisplayList();

    // this.startPlayer(-3); // Test
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (this.timeline) {
      this.invalidateDisplayList();
    }

    if (changes['data'] && changes['data'].currentValue &&  !changes['data'].isFirstChange()) {
      console.log('Data Source was changed');
      // TODO: force rebuild timeline
    }
  }




  /*
  * Public methods
  * */
  addEvents(items: TimelineEventVM[]) {
    this.data.events = this.data.events.concat(items);
    this.invalidateDisplayList();
    // TODO: Calculate (and change if required) best scale for given events on timeline
  }

  removeEvents(ids: number[]) {
    this.data.events = this.data.events.filter(item => !ids.includes(item.id));
    this.invalidateDisplayList();
    // TODO: Calculate (and change if required) best scale for given events on timeline
  }

  selectEvent(item: TimelineEventVM) {
    // TODO:
  }



  private buildTimeline() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.select(this.svgElement.nativeElement)
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    this.timeline = this.svg.append('g')
      .attr('class', 'timeline')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + 15})`);

    this.xScale = d3.scaleTime()
      .domain([this.data.timeConfig.start, this.data.timeConfig.end])
      .range([0, this.width]);
    this.xAxis = d3.axisBottom(this.xScale);
    this.xAxisGroup = this.timeline.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,  46)`)
      .call(this.xAxis);

    this.brushGroup = this.timeline.append('g')
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

    this.dataGroup = this.timeline.append('g')
      .attr('class', 'datagroup');
  }

  private invalidateDisplayList() {
    const points = this.data.events;

    this.circles = this.dataGroup.selectAll('circle')
      .data(points, (d) => d.id);

    const radius = 5;

    this.circles.enter()
      .append('circle')
      .attr('cy', (d) => 46)
      .attr('r', radius)
      .attr('fill', d => d.color)
      .on('click', (item: TimelineEventVM) => this.handleClick(item))
      .on('mouseover', (item: TimelineEventVM) => this.handleMouseOver(item))
      .on('mouseout', (item: TimelineEventVM) => this.handleMouseOut(item))
      .merge(this.circles)
      .style('fill', d => {
        if (d.selected || d.hovered) {
          return d.hovered ? 'lightgrey' : d.color; // TODO: Change color of hovered event to 10% lighter
        }
        return '#ffffff';
      })
      .attr('cx', (d: TimelineEventVM) => {
        const scalex = this.zoomTransform ? this.zoomTransform.k : 1;
        return scalex * this.xScale(d.dateTime);
      })
      .transition()
      .duration(300)
      .attr('r', (d) => d.hovered ? radius + 5 : radius);
    this.circles.exit().remove();
  }


  /*
  * Event Handlers
  * */
  highlightPoint(index: number) {
    this.data.events.forEach((item: TimelineEventVM, i: number) => item.selected = i === index);
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

  private handleClick(item: TimelineEventVM) {
    item.selected = !item.selected; // Toggle
    item.hovered = false;
    this.select.emit(item);
    this.invalidateDisplayList();
  }

  private handleMouseOver(item: TimelineEventVM) {
    item.hovered = true;
    this.hoverIn.emit(item);
    this.invalidateDisplayList();
    // TODO: show tooltip
  }

  private handleMouseOut(item: TimelineEventVM) {
    item.hovered = false;
    this.hoverOut.emit(item);
    this.invalidateDisplayList();
    // TODO: hide tooltip
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
