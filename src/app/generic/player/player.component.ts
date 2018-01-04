import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from "@angular/core";
import * as d3 from 'd3';
import {TimelineEventVM} from "../../model/view-models";
import {TimerObservable} from "rxjs/observable/TimerObservable";
import {Subscription} from "rxjs/Subscription";

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
  speed: number;

  isPlaying: boolean;

  /**
   * Player related properties
   * */
  private playbackSubscription: Subscription;

  constructor() { }

  ngOnInit() {
    this.speed = 1;
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
}
