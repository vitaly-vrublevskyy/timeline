import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {TimelineEventVM} from '../../model/view-models';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlayerComponent implements OnInit, OnDestroy {

  @Input()
  events: TimelineEventVM[];

  /*
  * Change player cursor
  * */
  @Output()
  change: EventEmitter<number> = new EventEmitter<number>();

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

  /**
   * Player related properties
   * */
  private playbackSubscription: Subscription;

  constructor() { }

  ngOnInit() {
  }

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
      this.startPlayer();
    } else if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }
  }

  startPlayer(speed: number = 1) {
    if (speed < 0) {
      speed = Math.abs(1 / speed);
    }
    if (this.playbackSubscription) {
      this.playbackSubscription.unsubscribe();
    }
    const period = 1000 / speed;
    // TODO: detect start point
    const times: number = this.events.length + 1;
    this.playbackSubscription = TimerObservable.create(0, period)
      .take(times)
      .subscribe(index => this.handlePlayback(index, times));
  }

  /*
  * Needle Position
  * */
  goToPrevious() {
    if (this.needleIndex > 0) {
      this.change.emit(--this.needleIndex);
    }
  }

  goToNext() {
    if (this.needleIndex < this.events.length - 1) {
      this.change.emit(++this.needleIndex);
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
  private handlePlayback(index: number, times: number) {
    const isLastPoint: boolean = index === times - 1;
    if (isLastPoint) {
      this.isPlaying = false;
      this.needleIndex = -1;
    } else {
      this.needleIndex = index;
    }
    this.change.emit(index);
  }

}
