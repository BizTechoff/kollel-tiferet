import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { BranchGroup } from '../../branches/branchGroup';
import { firstDateOfMonth, firstDateOfWeek, lastDateOfMonth, lastDateOfWeek, resetDateTime } from '../../common/dateFunc';
import { VisitController } from '../visitController';

@Component({
  selector: 'app-visits-report',
  templateUrl: './visits-report.component.html',
  styleUrls: ['./visits-report.component.scss']
})
export class VisitsReportComponent implements OnInit, OnChanges {

  @Input() group = BranchGroup.all

  visits = [] as { branch: string, /*rows: Visit[],*/ summary: { count: number, delayed: number, visited: number } }[]
  query = new VisitController()
  summary = { count: 0, delayed: 0, visited: 0 }

  constructor() { }

  async ngOnInit(): Promise<void> {
    // this.query.group = this.group
    await this.retrieve()
  }

  async ngOnChanges() {
    // console.log(`VisitsReportComponent: { ngOnChanges: { this.query.group: ${this.query.group.id}, this.group: ${this.group.id} } }`)
    if (this.query.group !== this.group) {
      this.summary = { count: 0, delayed: 0, visited: 0 }
      this.visits = [] as { branch: string, /*rows: Visit[],*/ summary: { count: number, delayed: number, visited: number } }[]
      this.query.group = this.group
      await this.retrieve()
    }
  }

  async retrieve() {
    // console.log(`VisitsReportComponent: { Retrieving group: ${this.group.id}}`)
    let today = resetDateTime(new Date())
    this.query.fdate =firstDateOfMonth(today)
      this.query.tdate = lastDateOfMonth(today)
    this.visits = await this.query.getVisitsByBranch()
    this.summary = { count: 0, delayed: 0, visited: 0 }
    // console.log(`Initialize: ${this.summary.count}`)
    for (const v of this.visits) {
      this.summary.count += v.summary.count
      this.summary.delayed += v.summary.delayed
      this.summary.visited += v.summary.visited
      // console.log(`Add ${v.summary.count} = ${this.summary.count}`)
    }
  }

}
