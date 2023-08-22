import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Fields, getFields, remult } from 'remult';
import { RouteHelperService } from '../../common-ui-elements';
import { DataControl } from '../../common-ui-elements/interfaces';
import { UIToolsService } from '../../common/UIToolsService';
import { dateDiff, resetDateTime } from '../../common/dateFunc';
import { uploader } from '../../common/uploader';
import { JobController } from '../../jobs/jobController';
import { NewsController } from '../../news/newsController';
import { terms } from '../../terms';
import { UserMenuComponent } from '../../users/user-menu/user-menu.component';
import { Visit } from '../visit';
import { VisitComponent } from '../visit/visit.component';
import { VisitController } from '../visitController';
import { VisitStatus } from '../visitStatus';
import { VisitsFinishedBlessingComponent } from '../visits-finished-blessing/visits-finished-blessing.component';

@Component({
  selector: 'app-visits',
  templateUrl: './visits.component.html',
  styleUrls: ['./visits.component.scss']
})
export class VisitsComponent implements OnInit {

  visits = [] as Visit[]
  query = new VisitController()
  jobs = new JobController()
  weeklyQuestion = ''
  locked = false
  diffDaysFromToday = 0

  @DataControl<VisitsComponent, Date>({
    valueChange: async (row, col) => await row.retrieve()
  })
  @Fields.dateOnly<VisitsComponent>({ caption: ' ' })
  selectedDate = resetDateTime(new Date())
  // selectedDay = ''
  $ = getFields(this)

  constructor(
    private routeHelper: RouteHelperService,
    private ui: UIToolsService,
    private route: ActivatedRoute) {
  }
  terms = terms;
  remult = remult;
  Math = Math;

  async ngOnInit(): Promise<void> {

    if (this.route.snapshot.paramMap.has('date')) {
      this.selectedDate = new Date(this.route.snapshot.paramMap.get('date')!);
    }
    if (!this.selectedDate) {
      this.selectedDate = new Date()
    }
    this.selectedDate = resetDateTime(this.selectedDate)

    remult.user!.lastComponent = VisitsComponent.name
    // await this.jobs.getLastWeeklyVisitsRun()
    // let date = this.jobs.lastJobRun
    // console.log('this.jobs.lastJobRun', this.jobs.lastJobRun)

    let news = new NewsController()
    let content = (await news.getWeeklyQuestion())?.content
    if (content?.trim().length) { }
    else {
      content = 'אין'
    }
    content = content.trim()
    this.weeklyQuestion = content
    // this.weeklyQuestion = 'היי בוקר טוב יש למלא את כל הטפסים ששלחנו לכם כל אחד לפי הצוות שלו ולעדכן חזרה את הראש כולל לא לשכוח זאת תודה ופסח כשר ושמח'
    // this.weeklyQuestion += this.weeklyQuestion 

    await this.retrieve()
  }

  async uploadImage() {
    alert('uploadImage coming soon..')
  }

  async onFileInput(e: any, target: string) {

    let s3 = new uploader(
      false,
      undefined!,
      undefined!,
      undefined!,
      undefined!,
      this.selectedDate)

    const res = await s3.loadFiles(e.target.files) //, target)
    console.log('res', res?.length ?? -1)
    if (res?.length) {
      this.ui.info('ההעלאה הצליחה')
      await this.retrieve()
    }
  }

  presentsCount() {
    return this.visits.filter(
      itm => [VisitStatus.delayed.id, VisitStatus.visited.id].includes(itm.status.id))
      .length
  }

  totalCount() {
    return this.visits.length
  }

  async gotoToday() {
    // alert('gotoToday')
    await this.dateChanged(
      resetDateTime(new Date())
    )
  }

  async dateChanged(date: Date) {
    // console.log('event','dateChanged')
    console.log('dateChanged', date)
    this.selectedDate = date
    await this.retrieve()
  }

  retrieving = false
  async retrieve(days = 0) {
    if (!this.retrieving) {
      this.retrieving = true
      this.selectedDate = resetDateTime(this.selectedDate, days)
      this.setDiffDays()
      this.query.fdate = this.selectedDate // firstDateOfWeek(today)
      this.query.tdate = this.selectedDate // lastDateOfWeek(today)
      this.query.selected = this.selectedDate
      var res = await this.query.getVisits()
      this.visits = res.visits
      this.locked = res.locked //|| true
      this.retrieving = false
    }
  }

  setDiffDays() {
    this.diffDaysFromToday = dateDiff(
      resetDateTime(this.selectedDate),
      resetDateTime(new Date()),
      false
    )
    console.log('diffDaysFromToday', this.diffDaysFromToday)
  }

  async prevDay() {
    await this.retrieve(-1)
  }

  async nextDay() {
    await this.retrieve(+1)
  }

  isNone(v: Visit) {
    return v?.status?.id === VisitStatus.none.id
  }

  isDelayed(v: Visit) {
    return v?.status?.id === VisitStatus.delayed.id
  }

  isVisited(v: Visit) {
    return v?.status?.id === VisitStatus.visited.id
  }

  curUser() {
    return JSON.stringify(remult.user)
  }

  back() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

  async call(e: any, mobile = '') {
    e?.stopPropagation()
    if (mobile?.trim().length) {
      window.open(`tel:${mobile}`, '_blank')
    }
  }

  async search() {
    let vols = this.visits.map(v => ({ id: v.id, caption: v.tenant.name }))
    let id = ''
    await this.ui.selectValuesDialog({
      allowAdd: false,
      title: `חיפוש דיווח לפי ${this.query.group.single}`,
      values: vols,
      onSelect: (v) => { id = v.id }
    })
    if (id?.trim().length) {
      this.edit(id)
    }
  }

  async searchAddress() {
    let vols = this.visits.map(v => ({ id: v.id, caption: v.tenant.address }))
    let id = ''
    await this.ui.selectValuesDialog({
      allowAdd: false,
      title: 'חיפוש דיווח לפי כתובת',
      values: vols,
      onSelect: (v) => { id = v.id }
    })
    if (id?.trim().length) {
      this.edit(id)
    }
  }

  async finished() {
    if (!this.locked) {
      let count = await this.query.getOpenVisitsCount()
      if (count > 0) {
        let yes = await this.ui.yesNoQuestion(`עדיין נותרו דיווחים פתוחים,\nלהמשיך בכל זאת`)
        if (yes) {
          this.routeHelper.navigateToComponent(VisitsFinishedBlessingComponent, { date: this.selectedDate })
        }
      }
      else {
        this.routeHelper.navigateToComponent(VisitsFinishedBlessingComponent, { date: this.selectedDate })
      }
    }
  }

  async addTenant() {
    this.routeHelper.navigateToComponent(VisitComponent)
  }

  async edit(id = '') {
    if (!this.locked) {
      this.routeHelper.navigateToComponent(VisitComponent, { id: id, date: this.selectedDate })
    }
  }

  async addVisit() {
    this.routeHelper.navigateToComponent(VisitComponent)
  }

  rootmenu() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

}
