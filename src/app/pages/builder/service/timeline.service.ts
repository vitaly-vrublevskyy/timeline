import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TimelineDataVM } from '../../../tn-timeline/model/view-models';
import * as _ from 'lodash';

@Injectable()
export class TimelineService {

  data = {
    timeZone: 'UTC',
    timeConfig: {
      id: _.uniqueId(),
      start: new Date('2016-05-01T00:00:00.000Z'),
      end: new Date('2016-09-04T00:00:00.000Z'),
    },
    events: [
      {
        id: _.uniqueId(),
        name: 'event 2',
        dateTime: new Date('2016-06-01T00:00:00.000Z'),
        color: '#5093E1'
      },
      {
        id: _.uniqueId(),
        name: 'event 3',
        dateTime: new Date('2016-06-02T00:00:00.000Z'),
        color: '#5093E1'
      },
      // Three dots in one day
      {
        id: _.uniqueId(),
        name: 'event 4',
        dateTime: new Date('2016-06-03T01:00:00.000Z'),
        color: '#98B877'
      },
      {
        id: _.uniqueId(),
        name: 'event 5',
        dateTime: new Date('2016-06-03T02:00:00.000Z'),
        color: '#5093E1'
      },
      {
        id: _.uniqueId(),
        name: 'event 6',
        dateTime: new Date('2016-06-03T03:00:00.000Z'),
        color: '#98B877'
      },
      {
        id: _.uniqueId(),
        name: 'event 7',
        dateTime: new Date('2016-06-10T00:00:00.000Z'),
        color: '#5093E1'
      },
      {
        id: _.uniqueId(),
        name: 'event 8',
        dateTime: new Date('2016-06-25T00:00:00.000Z'),
        color: '#98B877'
      },
      {
        id: _.uniqueId(),
        name: 'event 9',
        dateTime: new Date('2016-08-02T00:00:00.000Z'),
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
