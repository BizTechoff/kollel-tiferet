import { Component, OnInit } from '@angular/core';
import { remult } from 'remult';
import { RouteHelperService } from '../../common-ui-elements';
import { resetDateTime } from '../../common/dateFunc';
import { terms } from '../../terms';
import { UserMenuComponent } from '../../users/user-menu/user-menu.component';
import { VisitController } from '../visitController';
import { VisitsChartComponent } from '../visits-chart/visits-chart.component';
import { VisitsFinishedMessagesComponent } from '../visits-finished-messages/visits-finished-messages.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-visits-finished-summary',
  templateUrl: './visits-finished-summary.component.html',
  styleUrls: ['./visits-finished-summary.component.scss']
})
export class VisitsFinishedSummaryComponent implements OnInit {

  query = new VisitController()
  selectedDate!: Date

  constructor(
    private routeHelper: RouteHelperService,
    private route: ActivatedRoute) {
  }
  terms = terms;
  remult = remult;

  count = [] as { branch: string, tenants: number, delays: number, visits: number, missings: number }[]
  countSum = { tenants: 0, delivers: 0, visits: 0, missings: 0 }


  async ngOnInit(): Promise<void> {
    this.selectedDate = new Date(this.route.snapshot.paramMap.get('date') ?? '');
    this.query.fdate = this.selectedDate// firstDateOfWeek(date)
    this.query.tdate = this.selectedDate//lastDateOfWeek(date)
    this.count = await this.query.getWeeklyCounters()
    for (const c of this.count) {
      this.countSum.tenants += c.tenants
      this.countSum.delivers += c.delays
      this.countSum.visits += c.visits
      this.countSum.missings += c.missings
    }
  }

  async ok() {
    this.routeHelper.navigateToComponent(VisitsChartComponent)
  }

  back() {
    this.routeHelper.navigateToComponent(VisitsFinishedMessagesComponent)
  }

  rootmenu() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

}
