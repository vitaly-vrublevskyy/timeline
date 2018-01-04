import {Component, ElementRef, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";
import * as d3 from 'd3';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlayerComponent implements OnInit {

  speed: number = 1;

  playing: boolean;

  constructor() { }

  ngOnInit() {

  }

  togglePlay() {
    this.playing = !this.playing;
  }

}
