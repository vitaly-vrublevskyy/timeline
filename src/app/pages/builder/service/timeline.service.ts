import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { TimelineDataVM } from '../../../model/view-models';
import * as _ from 'lodash';

@Injectable()
export class TimelineService {



  data0 = {
    timeZone: 'UTC',
    timeConfig: {
      id: _.uniqueId(),
      start: new Date('1980-05-01T00:00:00.000Z'),
      end: new Date('2016-09-04T00:00:00.000Z'),
    },
    events: [

      {
        id: _.uniqueId(),
        name: 'event 1',
        dateTime: new Date('1997-01-01T00:00:00.000Z'),
        color: '#ff0000'
      },
      {
        id: _.uniqueId(),
        name: 'event 2',
        dateTime: new Date('1998-01-01T01:00:00.000Z'),
        color: '#ffff00'
      },

      {
        id: _.uniqueId(),
        name: 'event 3',
        dateTime: new Date('1999-01-01T01:00:00.000Z'),
        color: '#5093E1'
      },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 2',
      //   dateTime: new Date('2018-01-01T01:00:00.012Z'),
      //   color: '#5093E1'
      // },



      // // Three dots in one day
      // {
      //   id: _.uniqueId(),
      //   name: 'event 4',
      //   dateTime: new Date('2016-06-03T01:00:00.000Z'),
      //   color: '#98B877'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 5',
      //   dateTime: new Date('2016-06-03T02:00:00.000Z'),
      //   color: '#5093E1'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 6',
      //   dateTime: new Date('2016-06-03T03:00:00.000Z'),
      //   color: '#98B877'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 7',
      //   dateTime: new Date('2016-06-10T00:00:00.000Z'),
      //   color: '#5093E1'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 8',
      //   dateTime: new Date('2016-06-25T00:00:00.000Z'),
      //   color: '#98B877'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 9',
      //   dateTime: new Date('2016-08-02T00:00:00.000Z'),
      //   color: '#5093E1'
      // }
    ]
  };

  data1 = {
    timeZone: 'UTC',
    timeConfig: {
      id: _.uniqueId(),
      start: new Date('1980-05-01T00:00:00.000Z'),
      end: new Date('2016-09-04T00:00:00.000Z'),
    },
    events: [
      {
        id: _.uniqueId(),
        name: 'event 01',
        dateTime: new Date('2010-01-01T00:00:00.000Z'),
        color: '#5093E1'
      },

      {
        id: _.uniqueId(),
        name: 'event 012',
        dateTime: new Date('2020-01-01T00:00:00.012Z'),
        color: '#5093E1'
      },


      // // Three dots in one day
      // {
      //   id: _.uniqueId(),
      //   name: 'event 4',
      //   dateTime: new Date('2016-06-03T01:00:00.000Z'),
      //   color: '#98B877'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 5',
      //   dateTime: new Date('2016-06-03T02:00:00.000Z'),
      //   color: '#5093E1'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 6',
      //   dateTime: new Date('2016-06-03T03:00:00.000Z'),
      //   color: '#98B877'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 7',
      //   dateTime: new Date('2016-06-10T00:00:00.000Z'),
      //   color: '#5093E1'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 8',
      //   dateTime: new Date('2016-06-25T00:00:00.000Z'),
      //   color: '#98B877'
      // },
      // {
      //   id: _.uniqueId(),
      //   name: 'event 9',
      //   dateTime: new Date('2016-08-02T00:00:00.000Z'),
      //   color: '#5093E1'
      // }
    ]
  };

  data2 = {
    timeZone: 'UTC',
    timeConfig: {
      id: _.uniqueId(),
      start: new Date('1980-05-01T00:00:00.000Z'),
      end: new Date('2016-09-04T00:00:00.000Z'),
    },
    events: [
      {
        id: _.uniqueId(),
        name: 'event 01',
        dateTime: new Date('2018-04-04T09:09:00.000Z'),
        color: '#ff4455'
      },

      {
        id: _.uniqueId(),
        name: 'event 012',
        dateTime: new Date('2018-04-04T12:12:00.000Z'),
        color: '#5093E1'
      },
    ]
  };

  constructor() {
  }


  dataSource(): Observable<TimelineDataVM> {
    return Observable.of(this.data0)
      .delay(1000);
  }
}
