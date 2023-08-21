import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Fields, getFields, remult } from 'remult';
import { RouteHelperService } from '../../common-ui-elements';
import { DataControl } from '../../common-ui-elements/interfaces';
import { resetDateTime } from '../../common/dateFunc';
import { UserMenuComponent } from '../../users/user-menu/user-menu.component';
import { BranchGroup } from '../branchGroup';

@Component({
  selector: 'app-branch-group',
  templateUrl: './branch-group.component.html',
  styleUrls: ['./branch-group.component.scss']
})
export class BranchGroupComponent implements OnInit {


  @Input() readonly = false
  @Input() invert = false

  @Output() groupChanged = new EventEmitter(true)
  selected = BranchGroup.fromId(remult.user?.group!)

  @Output() dateChanged = new EventEmitter<Date>(true)
  @DataControl<BranchGroupComponent, Date>({ valueChange: row => row.onDateChanged() })
  @Fields.dateOnly<BranchGroupComponent>({ caption: ' ' })
  selectedDate = resetDateTime(new Date())

  constructor(private routeHelper: RouteHelperService) { }
  remult = remult
  BranchGroup = BranchGroup

  ngOnInit(): void {
    console.log(`invert: ${this.invert}`)
  }
  $ = getFields(this)

  async onGroupChanged(group: BranchGroup) {
    remult.user!.group = group.id
    this.groupChanged.emit()
  }

  async onDateChanged() {
    this.dateChanged.emit(this.selectedDate)
  }

  async prevDay() {
    this.selectedDate = resetDateTime(
      this.selectedDate, -1)
    this.onDateChanged()
  }

  async nextDay() {
    this.selectedDate = resetDateTime(
      this.selectedDate, +1)
    this.onDateChanged()
  }

  rootmenu() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

}
