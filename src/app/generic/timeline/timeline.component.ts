import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { TimelineDataVM, TimelineEventVM } from '../../model/view-models';
import * as d3 from 'd3';
import * as _ from 'lodash';


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

  /* Whole Items */
  @Input() public data: TimelineDataVM;

  // TODO: collection of grouped items by some range
  /* Notify about Click / Unclick */
  @Output()
  select: EventEmitter<TimelineEventVM> = new EventEmitter();

  /**
   * Outputs
   * */
  @Output()
  hoverIn: EventEmitter<TimelineEventVM> = new EventEmitter();
  @Output()
  hoverOut: EventEmitter<TimelineEventVM> = new EventEmitter();
  @Input() private selection: TimelineEventVM[];
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
  private tooltip: any;

  private margin: any = {top: 0, bottom: 0, left: 0, right: 0};

  constructor() {
  }

  /*
  * Ng Hooks
  * */
  ngOnInit() {
    this.buildTimeline();

    this.invalidateDisplayList();
  }


  ngOnChanges(changes: SimpleChanges): void {
    /*
    if (this.timeline) {
      this.invalidateDisplayList();
    }

    if (changes['data'] && changes['data'].currentValue &&  !changes['data'].isFirstChange()) {
      console.log('Data Source was changed');
      // TODO: force rebuild timeline
    }
    */
  }

  /*
  * Public methods
  * */
  addEvents(items: TimelineEventVM[]) {
    this.data.events = _.chain(this.data.events)
      .concat(items)
      .orderBy('dateTime')
      .value();

    this.invalidateDisplayList();
    // TODO: Calculate (and change if required) best scale for given events on timeline
  }

  removeEvents(ids: number[]) {
    this.data.events = this.data.events.filter(item => !ids.includes(item.id));
    this.invalidateDisplayList();
    // TODO: Calculate (and change if required) best scale for given events on timeline
  }

  selectEvent(ids: number[]) {
    ids.forEach(id => {
      const event: TimelineEventVM = _.find(this.data.events, {id: id});
      if (event) {
        event.selected = true;
      }
    });

    this.invalidateDisplayList();
  }

  unselectEvent(ids: number[]) {
    ids.forEach(id => {
      const event: TimelineEventVM = _.find(this.data.events, {id: id});
      if (event) {
        event.selected = false;
      }
    });
    this.invalidateDisplayList();
  }

  /*
  * Event Handlers
  * */
  highlightPoint(index: number) {
    this.data.events.forEach((item: TimelineEventVM, i: number) => item.selected = i === index);

    this.invalidateDisplayList();

    // UnSelect prev
    if (index > 0) {
      this.select.emit(this.data.events[index - 1]);
    }
    // Select current item
    if (index < this.data.events.length) {
      this.select.emit(this.data.events[index]);
    }
    // TODO: indicate and animate active point
  }

  private buildTimeline() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this.svg = d3.select(this.svgElement.nativeElement)
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // Define the div for the tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    this.timeline = this.svg.append('g')
      .attr('class', 'timeline')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + 30})`);

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
      .handleSize(1.5)
      .extent([[0, 0], [this.width, this.height-30]])
      .filter(() => {
        // Brush only without [Ctlr]
        return !d3.event.ctrlKey;
      })
      .on('end', () => {
        if (!d3.event.sourceEvent) {
          return;
        }// Only transition after input.
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
          return;
        }// ignore brush-by-zoom
        if (!d3.event.selection) {
          // this.clearSelection();
          return;
        }// Ignore empty selections.

        const rescaledX = this.zoomTransform ?
          this.zoomTransform.rescaleX(this.xScale)
          : this.xScale;

        const selectionDateRange = d3.event.selection.map(rescaledX.invert),
          // rounded
          d1 = selectionDateRange.map(d3.timeDay.round);

        this.updateBrushSelection(selectionDateRange);

        this.lastSelection = selectionDateRange;
        d3.select('.brush').transition().call(d3.event.target.move, d3.event.selection);
      });

    this.brushGroup.call(this.brush);

    this.zoom = d3.zoom()
      .filter(() => {
        // Zoom only with [Ctlr]
        return d3.event.ctrlKey;
      })
      .scaleExtent([1, 5])
      // .on('zoom', null)
      // .translateExtent([[-100, 0], [this.width + 90, 0]])
      .on('zoom', () => {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') {
          return;
        }
        const selection = d3.brushSelection(d3.select('.brush').node());

        this.zoomTransform = d3.event.transform;

        const rescaled = this.zoomTransform.rescaleX(this.xScale);


        this.dataGroup
          .attr('transform', `translate(${this.zoomTransform.x}, 0) scale(1,1)`);

        this.xAxisGroup
          .call(this.xAxis.scale(d3.event.transform.rescaleX(this.xScale)));

        // this.xScale = rescaled;

        if (selection) {

          console.log(selection, this.lastSelection.map(rescaled));
          d3.select('.brush').call(this.brush.move,
            this.lastSelection.map(rescaled));
        }


        // this.brushGroup.call(this.brush.move, null);
        this.invalidateDisplayList();

      });

    this.svg.call(this.zoom);


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

    // show tooltip
    this.tooltip
      .transition()
      .duration(200)
      .style('opacity', .9);

    const options = {hour: 'numeric', minute: 'numeric', second: 'numeric'};
    this.tooltip
      .html(`${item.dateTime.toLocaleTimeString('en-US', options)}<br/>ID:${item.id}`)
      .style('left', (d3.event.pageX) + 'px')
      .style('top', (d3.event.pageY - 55) + 'px');
  }

  private handleMouseOut(item: TimelineEventVM) {
    item.hovered = false;
    this.hoverOut.emit(item);
    this.invalidateDisplayList();
    // hide tooltip
    this.tooltip
      .transition()
      .duration(500)
      .style('opacity', 0);
  }


  private clearSelection() {
    this.data.events.forEach((d) => d.selected = false);
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
