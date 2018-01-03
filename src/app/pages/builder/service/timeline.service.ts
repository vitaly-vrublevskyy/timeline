import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TimelineDataVM } from '../../../model/view-models';
import * as _ from 'lodash';

@Injectable()
export class TimelineService {

  data = {
    timeZone: 'UTC',
    timeConfig: {
      start: new Date('2016-05-01T00:00:00.000Z'),
      end: new Date('2016-09-04T00:00:00.000Z'),
    },
    events: [
      {
        dateTime: new Date('2016-06-01T00:00:00.000Z'),
        id: _.uniqueId(),
        color: '#5093E1'
      },
      {
        dateTime: new Date('2016-06-02T00:00:00.000Z'),
        id: _.uniqueId(),
        color: '#5093E1'
      },
      // Three dots in one day
      {
        dateTime: new Date('2016-06-03T01:00:00.000Z'),
        id: _.uniqueId(),
        color: '#98B877'
      },
      {
        dateTime: new Date('2016-06-03T02:00:00.000Z'),
        id: _.uniqueId(),
        color: '#5093E1'
      },
      {
        dateTime: new Date('2016-06-03T03:00:00.000Z'),
        id: _.uniqueId(),
        color: '#98B877'
      },
      {
        dateTime: new Date('2016-06-10T00:00:00.000Z'),
        id: _.uniqueId(),
        color: '#5093E1'
      },
      {
        dateTime: new Date('2016-06-25T00:00:00.000Z'),
        id: _.uniqueId(),
        color: '#98B877'
      },
      {
        dateTime: new Date('2016-08-02T00:00:00.000Z'),
        id: _.uniqueId(),
        color: '#5093E1'
      }
    ]
  };

  constructor() {
  }


  dataSource(): Observable<TimelineDataVM> {
    return Observable.of(this.data);
  }
}
