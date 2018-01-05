import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { TimelineDataVM, TimelineEventVM } from '../../model/view-models';
import * as d3 from 'd3';
import * as _ from 'lodash';
import * as Color from 'color';

const format = d3.timeFormat('%d %b %Y %H:%M:%S');

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit {
  /**
   * Inputs
   * */
  @Input() public data: TimelineDataVM;
  /* Whole Items */

  // TODO: collection of grouped items by some range
  /**
   * Outputs
   * */
    // FIXME: Refactor to list of ids
  @Output()
  select: EventEmitter<TimelineEventVM> = new EventEmitter();
  @Output()
  hoverIn: EventEmitter<TimelineEventVM> = new EventEmitter();
  @Output()
  hoverOut: EventEmitter<TimelineEventVM> = new EventEmitter();
  /* Notify about Click / Unclick  multiple events ids*/
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
  private needle: any;

  private margin: any = {top: 0, bottom: 0, left: 0, right: 0};
  private brushHandleLabels: any;

  constructor() {
  }

  /*
  * Ng Hooks
  * */
  ngOnInit() {
    this.buildTimeline();

    this.invalidateDisplayList();
  }


  /*
  * Public interface methods
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

  selectEvent(eventIds: number[]) {
    eventIds.forEach(id => {
      const event: TimelineEventVM = _.find(this.data.events, {id: id});
      if (event) {
        event.selected = true;
      }
    });

    this.invalidateDisplayList();
  }

  unselectEvent(eventIds: number[]) {
    eventIds.forEach(id => {
      const event: TimelineEventVM = _.find(this.data.events, {id: id});
      if (event) {
        event.selected = false;
      }
    });
    this.invalidateDisplayList();
  }

  /**
   * Event Handlers
   * */

  /* HighlightPoint active | selected event  */
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
    // TODO: move needle to that point
  }

  /**
   * Private Methods
   * */

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
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + 30})`)
      // .on('mouseover', () => this.needle.style('display', null))
      .on('mouseout', () => this.hideNeedle())
      .on('mousemove', () => {
        const needleX = d3.mouse(this.timeline.node())[0];
        const selection = d3.brushSelection(d3.select('.brush').node());
        const [start, end] = selection || [0, 0];
        const needleIsOverBrush = start < needleX && needleX < end;
        // FIXME: indicate if hovered event (circle) as well

        d3.selectAll('.needle-text')
          .text(format(this.rescaledX().invert(needleX)))
        this.needle
          .style('display', needleIsOverBrush ? 'none' : 'initial')
          .attr('transform', `translate(${needleX}, 0)`);
      });

    this.drawNeedle();

    this.culateScaleX();

    this.buildBrush();

    this.handleTimelineZoom();

    this.dataGroup = this.timeline.append('g')
      .attr('class', 'datagroup');
  }

  private hideNeedle() {
    this.needle.style('display', 'none');
  }

  /* Draw cursor pointer */
  private drawNeedle() {
    this.needle = this.timeline.append('g')
      .attr('class', 'needle');

    this.needle
      .append('text')
      .attr('class', 'needle-text')
      .attr('y', -1)
      .attr('x', 5)
      .text('');

    this.needle
      .append('rect')
      .attr('width', 0.5)
      .attr('height', this.height)
      .attr('fill', 'blue')
      .attr('class', 'needle-rect')
      .attr('transform', `translate(0, -30)`);
  }

  private handleTimelineZoom() {
    this.zoom = d3.zoom()
      .filter(() => {
        // Zoom only with [Ctlr]
        return d3.event.ctrlKey;
      })
      .scaleExtent([0.1, 100])
      // .on('zoom', null)
      // .translateExtent([[-100, 0], [this.width + 90, 0]])
      .on('zoom', () => {
        this.hideNeedle();
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
  }

  private buildBrush() {
    this.brushGroup = this.timeline.append('g')
      .attr('class', 'brush')
      .attr('transform', `translate(0, 0)`);

    this.brush = d3.brushX()
      .handleSize(1.5)
      .extent([[0, 0], [this.width, this.height - 30]])
      .filter(() => {
        // Brush only without [Ctlr]
        return !d3.event.ctrlKey;
      })
      .on('brush', () => {
        if (!d3.event.selection) {
          this.brushHandleLabels.attr('display', 'none');
        } else {
          this.hideNeedle();
          this.brushHandleLabels.attr('display', null)
            .attr('transform', (d, i) => {
              return `translate(${d3.event.selection[i]},0)`;
            })
            .attr('x', ({type}) => {
              return type === 'w' ? -90 : 5;
            })
            .text(({type}) => {
              const index = type === 'w' ? 0 : 1;
              return format(this.rescaledX().invert(d3.event.selection[index]));
            });

          // this.brushGroup.selectAll('.handle--custom')
        }
      })
      .on('end', () => {
        if (!d3.event.sourceEvent) {
          return;
        }// Only transition after input.
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
          return;
        }// ignore brush-by-zoom
        if (!d3.event.selection) {
          // TODO: send notification
          this.brushHandleLabels.attr('display', 'none');
          this.clearSelection();
          return;
        }// Ignore empty selections.

        const rescaledX = this.rescaledX();

        const selectionDateRange = d3.event.selection.map(rescaledX.invert),
          // rounded
          d1 = selectionDateRange.map(d3.timeDay.round);

        this.updateBrushSelection(selectionDateRange);

        this.lastSelection = selectionDateRange;
        d3.select('.brush').transition().call(d3.event.target.move, d3.event.selection);
      });

    this.brushHandleLabels = this.brushGroup.selectAll('.handle--custom')
      .data([{type: 'w'}, {type: 'e'}])
      .enter().append('text')
      .attr('class', 'handle--custom')
      .attr('y', '10')
      .text('')

    // .attr('text', (d, i) => `${d} - ${i}`);

    this.brushGroup.call(this.brush);
  }

  private rescaledX() {
    return this.zoomTransform ?
      this.zoomTransform.rescaleX(this.xScale)
      : this.xScale;
  }

  private culateScaleX() {
    this.xScale = d3.scaleTime()
      .domain([this.data.timeConfig.start, this.data.timeConfig.end])
      .range([0, this.width]);

    this.xAxis = d3.axisBottom(this.xScale);
    this.xAxisGroup = this.timeline.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,  46)`)
      .call(this.xAxis);
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
      .style('fill', (d: TimelineEventVM) => this.getBackgroundColorForEvent(d))
      .attr('cx', (d: TimelineEventVM) => {
        const scalex = this.zoomTransform ? this.zoomTransform.k : 1;
        return scalex * this.xScale(d.dateTime);
      })
      .transition()
      .duration(300)
      .attr('r', (d) => d.hovered ? radius + 5 : radius);

    this.circles.exit().remove();
  }


  private getBackgroundColorForEvent(item: TimelineEventVM): string {
    let hexColor = '#ffffff';
    if (item.selected || item.hovered) {
      hexColor = item.color;
      if (item.hovered) {
        // Change color of hovered event to 10% lighter
        hexColor = Color(item.color).lighten(0.1).hex();
      }
    }
    return hexColor;
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
    this.showTooltip(item);
  }

  private showTooltip(item: TimelineEventVM) {
    this.tooltip
      .transition()
      .duration(200)
      .style('opacity', .9);

    this.tooltip.html(item.name);
    const tooltipBounds: any = this.tooltip.node().getBoundingClientRect();
    const margin = 30;
    this.tooltip
      .style('left', (d3.event.pageX - tooltipBounds.width / 2) + 'px')
      .style('top', (d3.event.pageY - tooltipBounds.height - margin) + 'px');
  }

  private handleMouseOut(item: TimelineEventVM) {
    item.hovered = false;
    this.hoverOut.emit(item);
    this.invalidateDisplayList();
    this.hideTooltip();
  }


  private hideTooltip() {
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

    // Select items in range
    this.data.events.forEach((item: TimelineEventVM) => {
      const isSelected: boolean = (item.dateTime.getTime() >= start && item.dateTime.getTime() <= end);
      if (item.selected !== isSelected) {
        item.selected = isSelected;
        this.select.emit(item);
      }
    });

    this.invalidateDisplayList();
  }
}
