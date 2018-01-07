import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { TimelineDataVM, TimelineEventGroup, TimelineEventVM } from '../../model/view-models';
import * as d3 from 'd3';
import * as _ from 'lodash';
import * as Color from 'color';

const format = d3.timeFormat('%d %b %Y %H:%M:%S');

const MIN_ZOOM = 0.1;

const MAX_ZOOM = 1000;

const MIN_ZOOM_LEVEL = 1;

const MAX_ZOOM_LEVEL = 604800;

const ZOOM_LEVELS = [1, 10, 15, 60, 300, 900, 1800, 3600, 14400, 43200, 86400, 604800];

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
  hoverIn: EventEmitter<string[]> = new EventEmitter();
  @Output()
  hoverOut: EventEmitter<string[]> = new EventEmitter();
  /**
   *  Current time Scale Level in seconds.
   *  According to requirements: default scale of 10 seconds
   **/
  zoomLevel: number;

  /*
  * Access to View Template
  * */
  /* Notify about Click / Unclick  multiple events ids*/
  @Input() private selection: TimelineEventVM[];
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
  //
  // * 1 Event - 5 pixels
  // * 2-5 Events - 10 pixels
  // * 5-10 Events - 15 pixels
  private needle: any;
  // * 10+ Event - 20 pixels
  private radiusScale = d3.scaleThreshold()
    .domain([2, 6, 11])
    .range([5, 10, 15, 20]);

  private zoomConversionScale = d3.scaleLinear()
    .domain([MIN_ZOOM, MAX_ZOOM])
    .range(ZOOM_LEVELS);


  private margin: any = {top: 0, bottom: 0, left: 0, right: 0};
  private brushHandleLabels: any;

  constructor() {
  }

  /*
  * Ng Hooks
  * */
  ngOnInit() {
    this.zoomLevel = 10;

    this.buildTimeline();

    this.invalidateDisplayList();

    // setTimeout(this.zoomProgramatic.bind(this), 3000, 0.1);
    // setTimeout(this.zoomProgramatic.bind(this), 6000, 5);
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

  removeEvents(ids: string[]) {
    this.data.events = this.data.events.filter(item => !ids.includes(item.id));
    this.invalidateDisplayList();
    // TODO: Calculate (and change if required) best scale for given events on timeline
  }

  selectEvent(eventIds: string[]) {
    eventIds.forEach(id => {
      const event: TimelineEventVM = _.find(this.data.events, {id: id});
      if (event) {
        event.selected = true;
      }
    });

    this.invalidateDisplayList();
  }

  /**
   * Event Handlers
   * */

  unselectEvent(eventIds: string[]) {
    eventIds.forEach(id => {
      const event: TimelineEventVM = _.find(this.data.events, {id: id});
      if (event) {
        event.selected = false;
      }
    });
    this.invalidateDisplayList();
  }

  /* HighlightPoint active | selected event  */
  highlightPoint(index: number) {
    this.data.events.forEach((item: TimelineEventVM, i: number) => item.hovered = i === index);

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

  onZoomChanged() {
    console.log('Zoom Changes to', this.zoomLevel, 's.');
    // FIXME:  Apply zoom in seconds
    this.zoomProgramatic(this.zoomConversionScale(this.zoomLevel));
  }

  zoomProgramatic(k: number) {
    // const {x, y} = this.zoomTransform || d3.zoomIdentity;
    // const tt = d3.zoomTransform;
    // let t = d3.zoomTransform(this.dataGroup.node());
    // t.scale()
    // reset this.svg.call(this.zoom.transform, d3.zoomIdentity);
    // this.svg.transition().duration(750).call(this.zoom.transform, {k, x, y});
    // this.svg.transition().duration(750).call(this.zoom.transform, t);

    // this.zoom.scaleTo(this.svg, k);
    this.svg.transition().duration(750).call(this.zoom.scaleTo, k);
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
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + 15})`)
      .on('mouseover', () => this.needle.style('display', null))
      .on('mouseout', () => this.hideNeedle())
      .on('mousemove', () => {
        const needleX = d3.mouse(this.timeline.node())[0];
        const selection = d3.brushSelection(d3.select('.brush').node());
        const [start, end] = selection || [0, 0];
        const needleIsOverBrush = start < needleX && needleX < end;
        // FIXME: indicate if hovered event (circle) as well

        d3.selectAll('.needle-text')
          .text(format(this.rescaledX().invert(needleX)));
        this.needle
          .style('cursor', 'none')
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
      .attr('transform', `translate(0, -15)`);
  }

  private handleTimelineZoom() {
    this.zoom = d3.zoom()
      .filter(() => {
        // Zoom only with [Ctlr]
        return d3.event.ctrlKey;
      })
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      // .on('zoom', null)
      // .translateExtent([[-100, 0], [this.width + 90, 0]])
      .on('zoom', () => {
        this.hideNeedle();
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') {
          return;
        }
        const selection = d3.brushSelection(d3.select('.brush').node());

        this.zoomTransform = d3.event.transform;

        const rescaled = this.rescaledX();

        this.dataGroup
          .attr('transform', `translate(${this.zoomTransform.x}, 0) scale(1,1)`);

        this.xAxisGroup
          .call(this.xAxis.scale(rescaled));

        if (selection) {
          d3.select('.brush').call(this.brush.move,
            this.lastSelection.map(rescaled));
        }

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

        const selectionDateRange = d3.event.selection.map(rescaledX.invert);
        // rounded
        // selectionDateRange = selectionDateRange.map(d3.timeDay.round);

        this.updateBrushSelection(selectionDateRange);

        this.lastSelection = selectionDateRange;
        d3.select('.brush').transition().call(d3.event.target.move, d3.event.selection);
      });

    this.brushHandleLabels = this.brushGroup.selectAll('.handle--custom')
      .data([{type: 'w'}, {type: 'e'}])
      .enter().append('text')
      .attr('class', 'handle--custom')
      .attr('y', '10')
      .text('');

    this.brushGroup.call(this.brush);
  }

  private rescaledX() {
    return (this.zoomTransform && this.zoomTransform.rescaleX) ?
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
    const points = this.unionFindAlg(this.data.events);
    const circles = this.dataGroup.selectAll('g.circleGroup')
      .data(points, (d) => (d.id + d.hovered + d.selected)); // unique hash to trigger redraw

    const circleGroupEnter = circles.enter().append('g')
      .attr('class', 'circleGroup')
      .on('click', (item: TimelineEventGroup) => this.handleClick(item))
      .on('mouseover', (item: TimelineEventGroup) => this.handleMouseOver(item))
      .on('mouseout', (item: TimelineEventGroup) => this.handleMouseOut(item));

    circleGroupEnter
      .append('rect')
      .attr('class', 'hover-target')
      .attr('height', 90);

    circleGroupEnter
      .append('circle')
      .attr('cy', 46);

    const circleGroupMerge = circleGroupEnter.merge(circles)
      .attr('transform', (d: TimelineEventVM) => {
        const scalex = this.zoomTransform ? this.zoomTransform.k : 1;
        return 'translate(' + scalex * this.xScale(d.dateTime) + ',' + 0 + ')';
      });

    circleGroupMerge.selectAll('rect')
      .attr('width', (d: TimelineEventGroup) => {
        return 2 * (this.radiusScale(d.groupedEvents.length) + (d.hovered ? 5 : 0));
      })
      .attr('x', (d: TimelineEventGroup) => {
        return -(this.radiusScale(d.groupedEvents.length) + (d.hovered ? 1 : 0));
      })
      .style('cursor', 'none')
      .style('opacity', 0);

    circleGroupMerge.selectAll('circle')
      .attr('r', (d: TimelineEventGroup) => {
        return this.radiusScale(d.groupedEvents.length) + (d.hovered ? 5 : 0);
      })
      .style('fill', (d: TimelineEventGroup) => this.getBackgroundColorForEvent(d));

    circles.exit().remove();
  }

  private getBackgroundColorForEvent(item: TimelineEventGroup): string {
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

  private handleClick(group: TimelineEventGroup) {
    group.groupedEvents.forEach((e) => {
      e.selected = !group.selected;
      e.hovered = false;
    });

    // TODO

    group.groupedEvents.forEach(item => this.select.emit(item));
    // item.hovered = false;
    // this.select.emit(item);

    this.invalidateDisplayList();
  }

  private handleMouseOver(group: TimelineEventGroup) {
    group.groupedEvents.forEach((e) => {
      e.hovered = true;
    });

    this.invalidateDisplayList();
    this.showTooltip(group);

    const ids: string[] = group.groupedEvents.map(item => item.id);
    this.hoverIn.emit(ids);
  }

  private showTooltip(item: TimelineEventGroup) {
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

  private handleMouseOut(group: TimelineEventGroup) {
    group.groupedEvents.forEach((e) => {
      e.hovered = false;
    });

    this.invalidateDisplayList();
    this.hideTooltip();

    const ids: string[] = group.groupedEvents.map(item => item.id);
    this.hoverOut.emit(ids);
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

  private unionFindAlg(events: TimelineEventVM[]): TimelineEventGroup[] {
    const GROUPING_THRESHOLD = 20; // pixel, less than this goes to 1 group

    // start by creating group for each event
    const results = events.map((event) => {
      const timelineEventGroup = <TimelineEventGroup>{...event, groupedEvents: [event]};
      return timelineEventGroup;
    });

// TODO check with empty/ 1 element data
    for (let i = 1; i < results.length; i++) {
      const pivotGroup = results[i - 1];
      const currentGroup = results[i];
      const pivotGroupX = this.rescaledX()(pivotGroup.dateTime);
      const currentGroupX = this.rescaledX()(currentGroup.dateTime);

      if (currentGroupX - pivotGroupX < GROUPING_THRESHOLD) {
        // merge 2 groups
        pivotGroup.groupedEvents = pivotGroup.groupedEvents.concat(currentGroup.groupedEvents);
        // remove current group from result
        results.splice(i, 1);
        // repeat with same prevGroup
        i--;
      }
    }


    // name merged with <br> to display in html tooltip
    // if any hovered - group is hovered
    // if all selected - group is selected
    results.forEach((group) => {
      group.id = group.groupedEvents.reduce((accumulator, {id}) => (accumulator + id), '');
      group.name = group.groupedEvents.reduce((accumulator, {name}) => (accumulator + name + '<br>'), '');
      group.selected = group.groupedEvents.reduce((accumulator, {selected}) => (accumulator && selected), true);
      group.hovered = group.groupedEvents.reduce((accumulator, {hovered}) => (accumulator || hovered), false);
    });

    return results;
  }
}
