import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { TimelineDataVM, TimelineEventGroup, TimelineEventVM } from '../../model/view-models';
import * as d3 from 'd3';
import * as _ from 'lodash';
import * as Color from 'color';
import * as moment from 'moment';
import {TnTimelinePlayerComponent} from "../tn-timeline-player/tn-timeline-player.component";

const format = d3.timeFormat('%d %b %Y %H:%M:%S');

const MIN_ZOOM = 0.00000001;

const MAX_ZOOM = 1000000000;

const ZOOM_LEVELS = [1, 10, 15, 60, 300, 900, 1800, 3600, 14400, 43200, 86400, 604800, 604800 * 4, 31556926, 31556926 * 5];

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimelineComponent implements OnInit, OnChanges {
  /**Current time Scale Level in seconds.*/
  zoomLevel: number;
  /* data collection grouped by scale range */
  eventGroups: TimelineEventGroup[];
  /**
   * Inputs
   * */
  @Input() public data: TimelineDataVM;
  /**
   * Outputs
   * */
  @Output()
  select: EventEmitter<string[]> = new EventEmitter();
  @Output()
  unselect: EventEmitter<string[]> = new EventEmitter();
  @Output()
  hoverIn: EventEmitter<string[]> = new EventEmitter();
  @Output()
  hoverOut: EventEmitter<string[]> = new EventEmitter();
  formatMillisecond = d3.timeFormat('%S.%L');
  formatSecond = d3.timeFormat('%S');
  formatMinute = d3.timeFormat('%H:%M:%S');
  formatHour = d3.timeFormat('%H:%M');
  formatDay = d3.timeFormat('%a %d');
  formatWeek = d3.timeFormat('%b %d');
  formatMonth = d3.timeFormat('%B');
  formatYear = d3.timeFormat('%Y');
  multiFormat = (date) => {
    const formats = [
      this.formatMillisecond(date),
      this.formatSecond(date),
      this.formatMinute(date),
      this.formatMinute(date),
      this.formatMinute(date),
      this.formatHour(date),
      this.formatHour(date),
      this.formatHour(date),
      this.formatHour(date),
      this.formatHour(date),
      this.formatDay(date),
      this.formatWeek(date),
      this.formatMonth(date),
      this.formatYear(date),
      this.formatYear(date)
    ];

    return formats[ZOOM_LEVELS.indexOf(this.zoomLevel)];
  };
  /*
  * Access to View Template
  * */
  @ViewChild(TnTimelinePlayerComponent) private player: TnTimelinePlayerComponent;
  @ViewChild('container') private chartContainer: ElementRef;
  @ViewChild('svg') private svgElement: ElementRef;
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
  /*
    * 1 Event - 5 pixels
    * 2-5 Events - 10 pixels
    * 5-10 Events - 15 pixels
    * 10+ Event - 20 pixels
  */
  private radiusScale = d3.scaleThreshold()
    .domain([2, 6, 11])
    .range([5, 10, 15, 20]);
  private zoomConversionScale = d3.scaleQuantile()
    .domain(ZOOM_LEVELS)
    .range(ZOOM_LEVELS);
  private margin: any = {top: 0, bottom: 0, left: 0, right: 0};
  private brushHandleLabels: any;
  private brushDurationLabel: any;
  private progressCircle: any;
  private PROGRESS_CIRCLE_ARC: any;
  private visibleGroups: TimelineEventGroup[];

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['data'];
    if (change && change.currentValue) {
      setTimeout(
        () => {
          this.invalidateProperties();
          this.fitAllEvents();
        }, 1000
      )
    }
  }

  /*
  * Ng Hooks
  * */
  ngOnInit() {
    this.buildTimeline();
    this.invalidateProperties();
    this.fitAllEvents();
  }

  /*
  * Public interface methods
  * */
  addEvents(items: TimelineEventVM[]) {
    this.data.events = _.chain(this.data.events)
      .concat(items)
      .orderBy('dateTime')
      .value();

    this.invalidateProperties();
    this.fitAllEvents();
  }

  removeEvents(ids: string[]) {
    this.data.events = this.data.events.filter(item => !ids.includes(item.id));
    this.invalidateProperties();
    this.fitAllEvents();
  }

  selectEvent(ids: string[]) {
    this.eventGroups.forEach(group => {
      const containsSelectedId: boolean = group.ids.some(id => ids.includes(id));
      if (containsSelectedId) {
        group.selected = true;
      }
    });

    this.invalidateDisplayList();
  }

  /**
   * Event Handlers
   * */
  unselectEvent(ids: string[]) {
    this.eventGroups.forEach(group => {
      const containsUnSelectedId: boolean = group.ids.some(id => ids.includes(id));
      if (containsUnSelectedId) {
        group.selected = false;
      }
    });

    this.invalidateDisplayList();
  }

  onSelectEventByIndex(index: number) {
    this.clearSelection();
    const group: TimelineEventGroup = this.eventGroups[index];
    this.handleClick(group);
  }

  /**
   * Highlight event circle while playing
   * @param i: playing group index in list of grouped events
   * */
  onHighlightPlayingEvent(i: number) {
    // Unselect Previous
    if (i > 0) {
      this.unselect.emit(this.eventGroups[i - 1].ids);
    }

    // Select active playing event
    if (i < this.eventGroups.length) {
      const group: TimelineEventGroup = this.eventGroups[i];
      group.play = true;
      this.centerEvent(group);
      this.animatePlayingCircle(group);
      this.select.emit(group.ids);
    }

    this.invalidateDisplayList();

    this.hideNeedle(); // Temporary before not implemeted next TODO:
    // TODO: move needle to that point
  }

  onZoomChanged(zoomLvl: number) {
    const newZoomScale = this.convertZoomLevelToK(zoomLvl);
    this.zoomProgramatic(newZoomScale);
  }

  convertZoomLevelToK(zoomlevel: number): number {
    const magicNumber = 8.5;
    const prefferedNumTicks = Math.floor(this.width / 150);

    const i0 = this.rescaledX().invert(0).getTime();
    const i1 = this.rescaledX().invert(this.width).getTime();
    const delta = (i1 - i0) / 1000; // seconds

    // somewhat stable during zooming
    const k = this.zoomTransform && this.zoomTransform.k || 1;
    const zoomDeltaKoef = (delta / prefferedNumTicks) * k;

    const newDelta = zoomlevel * magicNumber;


    const newK = zoomDeltaKoef / (newDelta / prefferedNumTicks);

    return newK;
  }

  calculateCurrentZoomLevel(): number {
    const magicNumber = 8.5;

    const i0 = this.rescaledX().invert(0).getTime();
    const i1 = this.rescaledX().invert(this.width).getTime();

    const delta = (i1 - i0) / 1000; // seconds

    const zoomLevel = delta / magicNumber;
    // rounding
    return this.zoomConversionScale(zoomLevel);
  }

  zoomProgramatic(k: number) {
    // this.zoom.scaleTo(this.svg, k);
    this.svg
      .transition().duration(700)
      .call(this.zoom.scaleTo, k);

  }

  public fitAllEvents(): void {
    const transform1 = d3.zoomIdentity.scale(1);

    this.svg
      // .transition().duration(10)
      .call(this.zoom.transform, transform1);

    const minRangeDuration = 0.00027 * 31536000000;
    // this.xScale.domain([this.eventGroups[0].dateTime.getTime(),
    //   this.eventGroups[0].dateTime.getTime() + minRangeDuration]);

    if (this.data.events.length < 2) {
      if (this.eventGroups.length > 0) {
        // zoomlevel for 1 event


        // only 1 event make sure its visible
        this.onZoomChanged(720000);
        setTimeout(() => {
          this.centerEvent(this.eventGroups[0]);
        }, 700);

      }
      return;
    }

    // first reset zoom to 0,0,1

    const min = d3.min(this.data.events, (e: TimelineEventGroup) => e.dateTime);
    const max = d3.max(this.data.events, (e: TimelineEventGroup) => e.dateTime);

    const rangeDuration = Math.max(4 * minRangeDuration, max.getTime() - min.getTime());
    const paddingDuration = Math.floor(rangeDuration / 10);


    const newMin = new Date(min.getTime() - paddingDuration);
    const newMax = new Date(max.getTime() + paddingDuration);
    // this.centerEvent(this.eventGroups[0]);
    const averageDate = new Date(newMax.getTime() / 2 + newMin.getTime() / 2);

    this.onZoomChanged(rangeDuration / 5000);

    setTimeout(() => {

      this.centerDate(averageDate);
    }, 2000);

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
    this.svg.append('rect')
      .attr('width', 3)
      .attr('height', 90)
      .attr('fill', '#fcfcff')
      .attr('x', -2 + this.width / 2);
    this.PROGRESS_CIRCLE_ARC = d3.arc()
      .innerRadius(5)
      .outerRadius(20);

    this.progressCircle = this.svg.append('path')
      .datum({endAngle: 0, startAngle: 0})
      .style('fill', '#999999')
      .attr('opacity', 0)
      .attr('transform', `translate(${this.width / 2}, 61)`)
      .attr('d', this.PROGRESS_CIRCLE_ARC);

    d3.interval(() => {
      function degToRad(degrees) {
        return degrees * Math.PI / 180;
      }

// Returns a tween for a transition’s "d" attribute, transitioning any selected
// arcs from their current angle to the specified new angle.
      const arcTween = (newAngle, angle) => {
        return (d) => {
          const interpolate = d3.interpolate(d[angle], newAngle);
          return (t) => {
            d[angle] = interpolate(t);
            return this.PROGRESS_CIRCLE_ARC(d);
          };
        };
      };

      this.progressCircle.datum({endAngle: 0, startAngle: 0});

      this.progressCircle.transition()
        .duration(250)
        .attrTween('d', arcTween(degToRad(360), 'endAngle'));

      this.progressCircle.transition()
        .delay(300)
        .duration(250)
        .attrTween('d', arcTween(degToRad(360), 'startAngle'));
    }, 500);

    // Define the div for the tooltip
    this.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    this.timeline = this.svg.append('g')
      .attr('class', 'timeline')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + 15})`)
      .on('mouseover', () => this.needle.style('display', null))
      .on('mouseout', () => this.hideNeedle())
      .on('mousemove', () => this.updateNeedleOnMouseMove());

    this.drawNeedle();

    this.addAxisX();

    this.buildBrush();

    this.handleTimelineZoom();

    this.dataGroup = this.timeline.append('g')
      .attr('class', 'datagroup');
  }

  private updateNeedleOnMouseMove() {
    if (this.player.isPlaying) {
      this.hideNeedle();
      return;
    }

    const needleX = d3.mouse(this.timeline.node())[0];
    const selection = d3.brushSelection(d3.select('.brush').node());
    const [start, end] = selection || [0, 0];
    const needleIsOverBrush = start < needleX && needleX < end;

    d3.selectAll('.needle-text')
      .text(format(this.rescaledX().invert(needleX)));
    this.needle
      .style('cursor', 'none')
      .style('display', needleIsOverBrush ? 'none' : 'initial')
      .attr('transform', `translate(${needleX}, 0)`);
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
      .on('end', () => {
      })
      .on('zoom', () => {
        this.hideNeedle();
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') {
          return;
        }
        const selection = d3.brushSelection(d3.select('.brush').node());

        this.zoomTransform = d3.event.transform;

        const rescaled = this.rescaledX();

        // this.dataGroup
          // .attr('transform', `translate(${this.zoomTransform.x}, 0) scale(1,1)`);

        this.xAxisGroup
          .call(this.xAxis.scale(rescaled));


        if (selection) {
          d3.select('.brush')
            .call(this.brush.move, this.lastSelection.map(rescaled));
        }

        this.zoomLevel = this.calculateCurrentZoomLevel();
        this.updateAxis();
        this.invalidateProperties();
      });

    this.svg
      .call(this.zoom)
      .on('wheel', function () {
        d3.event.preventDefault();
      }); // Disable browser zoom on svg
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
          this.brushDurationLabel.attr('display', 'none');
        } else {
          this.hideNeedle();
          this.brushHandleLabels
            .attr('display', null)
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
          this.brushDurationLabel
            .attr('display', null)
            .attr('x', () => {
              return d3.event.selection[0] / 2 + d3.event.selection[1] / 2;
            })
            .text(() => {
              const [start, end] = d3.event.selection.map(this.rescaledX().invert);
              const duration = start.getTime() - end.getTime();
              return moment.duration(duration).humanize();
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
          this.brushDurationLabel.attr('display', 'none');
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
      .attr('pointer-events', 'none')
      .attr('y', '10')
      .text('');


    this.brushDurationLabel = this.brushGroup
      .append('text')
      .attr('class', 'brush-duration')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .attr('y', '-6')
      .text('');

    this.brushGroup.call(this.brush);
  }

  private rescaledX() {
    return (this.zoomTransform && this.zoomTransform.rescaleX) ?
      this.zoomTransform.rescaleX(this.xScale)
      : this.xScale;
  }

  private addAxisX() {
    this.xScale = d3.scaleTime()
    // .domain([this.data.timeConfig.start, this.data.timeConfig.end])
      .domain([new Date(0), new Date(1e12)])
      .range([0, this.width]);
    // .clamp(true);


    this.xAxis = d3.axisBottom(this.xScale)
      .tickFormat(this.multiFormat);

    this.xAxisGroup = this.timeline.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,  46)`)
      .call(this.xAxis);
  }

  private invalidateProperties() {
    this.eventGroups = this.unionFindAlg(this.data.events); // TODO: Inject Collection into player
    this.visibleGroups = this.eventGroups.filter((event) => {
      if (this.zoomTransform) {
        const translateX = this.zoomTransform.x + this.zoomTransform.k * this.xScale(event.dateTime);
        return translateX > 0 && translateX < this.width;
      } else {
        return true;
      }
    })
    console.log(this.visibleGroups.length)
    this.invalidateDisplayList();
  }

  private invalidateDisplayList() {


    const circles = this.dataGroup.selectAll('g.circleGroup')
      .data(this.visibleGroups, (d: TimelineEventGroup) => d.hash); // unique hash to trigger redraw


    circles.exit()
      .on('click', null)
      .on('mouseover', null)
      .on('mouseout', null)
      .remove();

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
      .attr('transform', (d: TimelineEventGroup) => {
        const scalex = this.zoomTransform ? this.zoomTransform.k : 0.001;
        const translateX = (this.zoomTransform ? this.zoomTransform.x : 0) + scalex * this.xScale(d.dateTime);
        return 'translate(' + translateX + ',' + 0 + ')';
      });

    circleGroupMerge.select('rect')
      .attr('width', (d: TimelineEventGroup) => {
        return 2 * (this.radiusScale(d.groupedEvents.length) + (d.hovered ? 5 : 0));
      })
      .attr('x', (d: TimelineEventGroup) => {
        return -(this.radiusScale(d.groupedEvents.length) + (d.hovered ? -2.5 : 0));
      })
      .style('cursor', 'none')
      .style('opacity', 0);

    circleGroupMerge.select('circle')
      .attr('r', (d: TimelineEventGroup, i, j) => {

        return this.radiusScale(d.groupedEvents.length) + (d.hovered ? 5 : 0);
      })
      .style('fill', (d: TimelineEventGroup) => {
        return this.getBackgroundColorForEvent(d);
      });

  }

  private getBackgroundColorForEvent(item: TimelineEventGroup): string {
    let hexColor = '#ffffff';
    if (item.selected || item.hovered || item.play) {
      hexColor = item.color;
      if (item.play) {
        hexColor = '#000000'; // TODO: animation
      } else if (item.hovered) {
        // Change color of hovered event to 10% lighter
        hexColor = Color(item.color).lighten(0.1).hex();
      }
    }
    return hexColor;
  }

  private handleClick(group: TimelineEventGroup) {
    group.selected = !group.selected;

    group.selected
      ? this.select.emit(group.ids)
      : this.unselect.emit(group.ids);

    this.invalidateDisplayList();
  }

  private handleMouseOver(group: TimelineEventGroup) {
    group.hovered = true;
    group.invalidate();

    this.invalidateDisplayList();
    this.showTooltip(group);

    this.hoverIn.emit(group.ids);
  }

  private showTooltip(item: TimelineEventGroup) {
    this.tooltip.html(item.name);

    const tooltipBounds: any = this.tooltip.node().getBoundingClientRect();
    const target = d3.event.target;
    const {x, y, width, height} = target.getBoundingClientRect();
    const margin = 30;


    this.tooltip
      .style('opacity', .9)
      .style('left', (x + width / 2 - tooltipBounds.width / 2) + 'px')
      .style('top', (y + height / 2 - tooltipBounds.height - margin) + 'px');
  }

  private handleMouseOut(group: TimelineEventGroup) {
    group.hovered = false;
    group.invalidate();

    this.invalidateDisplayList();
    this.hideTooltip();

    const ids: string[] = group.groupedEvents.map(item => item.id);
    this.hoverOut.emit(ids);
  }


  private hideTooltip() {
    this.tooltip
      .style('opacity', 0);
  }

  private clearSelection() {
    this.eventGroups.forEach((d) => {
      if (d.selected) {
        this.unselect.emit(d.ids);
      }
      d.selected = false;
    });
    this.invalidateDisplayList();
  }

  private updateBrushSelection(dateRange: Date[]) {
    const [start, end] = dateRange.map(a => a.getTime());

    // single notification to unselect previous selected events
    this.unselect.emit(this.getSelectedEventsListIds());
    // Select items in that time range
    this.eventGroups.forEach((item: TimelineEventGroup) =>
      item.selected = (item.dateTime.getTime() >= start && item.dateTime.getTime() <= end)
    );
    // single notification to select just selected events
    this.select.emit(this.getSelectedEventsListIds());

    this.invalidateDisplayList();
  }

  private getSelectedEventsListIds(): string[] {
    return this.eventGroups.reduce((list: string[], item: TimelineEventGroup) =>
        list.concat(item.selected ? item.ids : [])
      ,
      []
    );
  }

  private unionFindAlg(events: TimelineEventVM[]): TimelineEventGroup[] {
    const GROUPING_THRESHOLD = 20; // pixel, less than this goes to 1 group

    // start by creating group for each event
    const results = events.map((event: TimelineEventVM) => new TimelineEventGroup(event));

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

    results.forEach((group: TimelineEventGroup) => group.invalidate());

    return results;
  }

  private centerEvent(groupEvent: TimelineEventGroup) {
    this.centerDate(groupEvent.dateTime);
  }

  private centerDate(dateTime: Date) {
    const {x, y, k} = this.zoomTransform || d3.zoomIdentity;
    const itemCurrentX = this.rescaledX()(dateTime);
    const delta = (+this.width / 2 - itemCurrentX) / k;

    this.svg
      .transition().duration(500)
      .call(this.zoom.translateBy, delta, 0);
  }

  private animatePlayingCircle(group: TimelineEventGroup) {
    const period: number = this.player.convertSpeedIntoMilliseconds(this.player.speed);
    setTimeout(() => {
      const radius = this.radiusScale(group.groupedEvents.length) + (group.hovered ? 5 : 0);
      this.progressCircle
        .attr('opacity', .5)
        .attr('transform', `translate(${this.width / 2}, 61) scale(${ (radius + 5) / 20})`);
      setTimeout(() => {
        this.progressCircle.attr('opacity', 0);
      }, period / 2);
    }, period / 2);
  }

  private updateAxis() {
    this.xAxis.ticks(
      [
        d3.timeSecond.every(1),
        d3.timeSecond.every(10),
        d3.timeSecond.every(15),
        d3.timeSecond.every(60),
        d3.timeMinute.every(5),
        d3.timeMinute.every(15),
        d3.timeMinute.every(30),
        d3.timeHour.every(1),
        d3.timeHour.every(4),
        d3.timeHour.every(12),
        d3.timeHour.every(24),
        d3.timeWeek.every(1),
        d3.timeMonth.every(1),
        d3.timeYear.every(1),
        d3.timeYear.every(5)
      ][ZOOM_LEVELS.indexOf(this.zoomLevel)]
    );
  }
}
