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
  changeCursor: EventEmitter<number> = new EventEmitter<number>();

  isPlaying: boolean;

  /**
   * Current speed index
   * */
  speedIndex: number;

  private speedMultipliersList: number[] = [-3, -2.5, -2, -1.5, 1, 1.5, 2, 2.5, 3];

  get speed(): number {
    return this.speedMultipliersList[this.speedIndex];
  }

  /**
   * Player related properties
   * */
  private playbackSubscription: Subscription;

  constructor() { }

  ngOnInit() {
    this.speedIndex = 4;
  }

  ngOnDestroy() {
    // Unsubscribe timer
    this.playbackSubscription.unsubscribe();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startPlayer();
    } else {
      if (this.playbackSubscription) {
        this.playbackSubscription.unsubscribe();
      }
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
      .subscribe(index => this.changeCursor.emit(index));
  }

  increaseSpeed(): void {
    if (this.speedIndex < this.events.length) {
      this.speedIndex ++;
    }
    // TODO: invalidate current timer
  }

  decreaseSpeed(): void {
    if (this.speedIndex > 0) {
      this.speedIndex --;
    }
    // TODO: invalidate current timer
  }

}
