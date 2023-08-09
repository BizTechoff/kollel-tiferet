import { Component, OnInit } from '@angular/core';
import { remult } from 'remult';
import { RouteHelperService } from '../../common-ui-elements';
import { terms } from '../../terms';
import { UserMenuComponent } from '../../users/user-menu/user-menu.component';
import { VisitsFinishedSummaryComponent } from '../visits-finished-summary/visits-finished-summary.component';
import { VisitsComponent } from '../visits/visits.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-visits-finished-blessing',
  templateUrl: './visits-finished-blessing.component.html',
  styleUrls: ['./visits-finished-blessing.component.scss']
})
export class VisitsFinishedBlessingComponent implements OnInit {

  selectedDate!: Date

  constructor(
    private routeHelper: RouteHelperService,
    private route: ActivatedRoute) {
  }
  terms = terms;
  remult = remult;

  ngOnInit(): void {
    this.selectedDate = new Date(this.route.snapshot.paramMap.get('date') ?? '');
  }

  async thanks() {
    this.routeHelper.navigateToComponent(VisitsFinishedSummaryComponent, { date: this.selectedDate })
  }

  back() {
    this.routeHelper.navigateToComponent(VisitsComponent)
  }

  rootmenu() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

}
