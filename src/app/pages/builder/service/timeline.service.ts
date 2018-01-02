import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {TimelineDataVM} from "../../../model/view-models";

@Injectable()
export class TimelineService {

  data = {
    timeZone: 'UTC',
    timeConfig: {
      start: new Date('2016-05-01T00:00:00.000Z'),
      end:  new Date('2016-09-04T00:00:00.000Z'),
    },
    events: [
      {
        dateTime:  new Date('2016-06-01T00:00:00.000Z'),
        id: 1,
        style: 'circle-red'
      },
      {
        dateTime:  new Date('2016-06-02T00:00:00.000Z'),
        id: 2,
        style: 'circle-red'
      },
      {
        dateTime:  new Date('2016-06-03T00:00:00.000Z'),
        id: 3,
        style: 'circle-blue'
      },
      {
        dateTime:  new Date('2016-06-10T00:00:00.000Z'),
        id: 4,
        style: 'circle-red'
      },
      {
        dateTime:  new Date('2016-06-25T00:00:00.000Z'),
        id: 5,
        style: 'circle-blue'
      },
      {
        dateTime:  new Date('2016-08-02T00:00:00.000Z'),
        id: 6,
        style: 'circle-red'
      }
    ]
  };

  constructor() {
  }

  dataSource(): Observable<TimelineDataVM> {
    return Observable.of(this.data);
  }
}
