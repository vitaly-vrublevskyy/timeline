import {Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation} from "@angular/core";
import {TimerObservable} from "rxjs/observable/TimerObservable";
import {Subscription} from "rxjs/Subscription";
import * as _ from "lodash";
import {TimelineItem} from "vis";

@Component({
  selector: 'tn-timepline-player',
  templateUrl: './tn-timeline-player.component.html',
  styleUrls: ['./tn-timeline-player.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TnTimelinePlayerComponent implements OnDestroy {

  @Input()
  items: TimelineItem[]; // TODO: Grouped

  @Input()
  selectedEventIds: number[];

  @Output()
  endPlaying: EventEmitter<void> = new EventEmitter();

  @Output()
  select: EventEmitter<number> = new EventEmitter<number>();

  isPlaying: boolean;

  /*
  * Current playback needle index
  * */
  needleIndex = -1; // TODO:  Getter base on first selected point

  /**
   * Current speed index
   * */
  private speedMultipliersList: number[] = [-3, -2.5, -2, -1.5, 1, 1.5, 2, 2.5, 3];

  private speedIndex = 4;

  get events() {
    return _.orderBy(this.items, 'start');
  }

  get speed(): number {
    return this.speedMultipliersList[this.speedIndex];
  }



  get isLastPoint(): boolean {
    return this.needleIndex === this.events.length - 1;
  }

  /**
   * Player related properties
   * */
  private playbackSubscription: Subscription;


  ngOnDestroy() {
    // Unsubscribe timer
    this.playbackSubscription.unsubscribe();
    this.playbackSubscription = null;
  }

  /*
  * Event Handlers
  * */
  togglePlay() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.startPlayer(this.speed);
    } else if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }
  }

  startPlayer(speed: number = 1, offset: number = -1) {
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }

    if (offset === -1) {
      const id: number = _.first(this.selectedEventIds);
      const activeEventIndex: number = _.findIndex(this.events, {id: id});
      offset = (activeEventIndex !== -1) ? activeEventIndex : 0;
    }

    const times: number = (this.events.length - offset) + 1;
    const delay: number = this.convertSpeedIntoMilliseconds(speed);
    this.playbackSubscription = TimerObservable.create(0, delay)
      .take(times)
      .subscribe(index => this.handlePlayback(index + offset, times));
  }

  convertSpeedIntoMilliseconds(speed: number): number {
    if (speed < 0) {
      speed = Math.abs(1 / speed);
    }
    return 1.5 * 1000 / speed;
  }

  /*
  * Needle Position
  * */
  goToPrevious() {
    if (this.needleIndex > 0) {
      this.sendNotification(--this.needleIndex);
    }
  }

  goToNext() {
    if (this.needleIndex < this.events.length - 1) {
      this.sendNotification(++this.needleIndex);
    }
  }

  /*
  * Speed
  * */
  increaseSpeed(): void {
    if (this.speedIndex < this.speedMultipliersList.length - 1) {
      this.speedIndex++;
      this.startPlayer(this.speed, this.needleIndex);
    }
  }

  decreaseSpeed(): void {
    if (this.speedIndex > 0) {
      this.speedIndex--;
      this.startPlayer(this.speed, this.needleIndex);
    }
  }


  /*
  * Playback
  * */
  private handlePlayback(nextNeedleIndex: number, times: number) {
    if (this.isLastPoint) {
      this.isPlaying = false;
      this.needleIndex = -1;
      this.endPlaying.emit();
    } else {
      this.needleIndex = nextNeedleIndex;
      this.sendNotification(nextNeedleIndex);
    }
  }

  private sendNotification(i: number) {
    const eventId: number = this.events[i].id;
    this.select.emit(eventId);
  }
}
