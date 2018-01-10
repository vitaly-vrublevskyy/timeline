import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {TimelineEventGroup, TimelineEventVM} from '../../model/view-models';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {Subscription} from 'rxjs/Subscription';
import * as _ from 'lodash';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlayerComponent implements OnDestroy {

  @Input()
  events: TimelineEventGroup[];

  /*
  * Change player cursor (needle)
  * */
  @Output()
  change: EventEmitter<number> = new EventEmitter<number>();
  
  @Output()
  endPlaying: EventEmitter<void> = new EventEmitter();
  
  /*
  * Select Event using prev or next buttons
  * */
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

  get speed(): number {
    return this.speedMultipliersList[this.speedIndex];
  }

  
  get selectedEventIndex (): number {
    return _.findIndex(this.events, {selected: true});
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

  startPlayer(speed: number = 1) {
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }

    const offset: number = (this.selectedEventIndex !== -1) ? this.selectedEventIndex : 0;
    const times: number = (this.events.length - offset) + 1;
    const delay: number = this.convertSpeedIntoMilliseconds(speed);
    this.playbackSubscription = TimerObservable.create(0, delay)
      .take(times)
      .subscribe(index => this.handlePlayback(index + offset, times));
  }
  
  private convertSpeedIntoMilliseconds(speed: number): number {
    if (speed < 0) {
      speed = Math.abs(1 / speed);
    }
    return 1000 / speed;
  }
  
  /*
  * Needle Position
  * */
  goToPrevious() {
    this.needleIndex = this.selectedEventIndex;
    if (this.needleIndex > 0) {
      this.select.emit(--this.needleIndex);
    }
  }

  goToNext() {
    this.needleIndex = this.selectedEventIndex;
    if (this.needleIndex < this.events.length - 1) {
      this.select.emit(++this.needleIndex);
    }
  }

  /*
  * Speed
  * */
  increaseSpeed(): void {
    if (this.speedIndex < this.speedMultipliersList.length) {
      this.speedIndex++;
    }
    // TODO: invalidate current timer
  }

  decreaseSpeed(): void {
    if (this.speedIndex > 0) {
      this.speedIndex--;
    }
    // TODO: invalidate current timer
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
    }
    this.change.emit(nextNeedleIndex);
  }

}
