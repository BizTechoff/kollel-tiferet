import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { remult } from 'remult';
import { Branch } from '../../branches/branch';
import { BranchController } from '../../branches/branchController';
import { RouteHelperService } from '../../common-ui-elements';
import { UIToolsService } from '../../common/UIToolsService';
import { terms } from '../../terms';
import { ManagersComponent } from '../managers/managers.component';
import { User } from '../user';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { UserBranch } from '../userBranch';

@Component({
  selector: 'app-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss']
})
export class ManagerComponent implements OnInit {

  manager!: User
  branches = [] as Branch[]
  selectedBranch!: Branch
  selectedBranch2!: Branch
  title = 'הוספת ראש כולל חדש'

  args!: {
    id: string
  }
  constructor(
    private routeHelper: RouteHelperService,
    private route: ActivatedRoute,
    private ui: UIToolsService) {
  }
  terms = terms;
  remult = remult;

  async ngOnInit(): Promise<void> {
    remult.user!.lastComponent = ManagerComponent.name
    if (!this.args) {
      this.args = { id: '' }
    }
    this.args.id = this.route.snapshot.paramMap.get('id') ?? '';
    //console.log(`VisitComponent: {id: ${this.args.id}}`)
    if (this.args.id?.trim().length) {
      this.title = 'עדכון ראש כולל'
      await this.reloadId()
    }
    else {
      this.title = 'הוספת ראש כולל חדש'
      this.manager = remult.repo(User).create()
      this.manager.manager = true
    }
  }

  async reloadId() {
    this.manager = undefined!
    if (this.args.id?.trim().length) {
      this.manager = await remult.repo(User).findId(this.args.id)
      this.branches = await remult.repo(Branch).find({
        where: {
          id: (await remult.repo(UserBranch).find(
            {
              where: { user: this.manager },
              orderBy: { created: 'desc' }
            }))
            .map(itm => itm.branch.id)
        }
      })
    }
  }

  async save() {
    if (!this.branches.length) {
      this.ui.error('חובה לשייך כולל')
    }
    else {
      await remult.repo(User).save(this.manager)
      var ubs = (await remult.repo(UserBranch).find({ where: { user: this.manager } }));
      for (const ub of ubs) {
        await remult.repo(UserBranch).delete(ub)
      }
      for (const b of this.branches) {
        let uBranch = remult.repo(UserBranch).create()
        uBranch.user = this.manager
        uBranch.branch = b
        await remult.repo(UserBranch).save(uBranch)
      }
      this.back()
    }
  }

  back() {
    this.routeHelper.navigateToComponent(ManagersComponent)
  }

  async close() {
    this.routeHelper.navigateToComponent(ManagersComponent)
  }

  async selectBranch() {
    let vols: { caption: string, id: string }[] = [] as { caption: string, id: string }[]
    let uc = new BranchController()
    // uc.group = this.query.group
    for (const b of await uc.getBranches()) {
      vols.push({ caption: b.name, id: b.id })
    }
    await this.ui.selectValuesDialog({
      title: 'בחירת כולל',
      values: vols,
      onSelect: async (b) => { await this.addBranch(b.id, '') }
    })
  }

  async selectBranch2() {
    let vols: { caption: string, id: string }[] = [] as { caption: string, id: string }[]
    let uc = new BranchController()
    // uc.group = this.query.group
    for (const v of await uc.getBranches()) {
      vols.push({ caption: v.name, id: v.id })
    }
    await this.ui.selectValuesDialog({
      title: 'בחירת כולל',
      values: vols,
      onSelect: async (v) => { await this.addBranch(v.id, '', true) }
    })
  }

  async removeFirstBranch(e: any) {
    e?.stopPropagation()
    let yes = await this.ui.yesNoQuestion(`?להסיר את הכולל ${this.branches[0].name}`)
    if (yes) {
      this.branches.splice(
        this.branches.indexOf(this.branches[0]),
        1)
    }
  }

  async removeSecondBranch(e: any) {
    e?.stopPropagation()
    let yes = await this.ui.yesNoQuestion(`?להסיר את הכולל ${this.branches[1].name}`)
    if (yes) {
      this.branches.splice(
        this.branches.indexOf(this.branches[1]),
        1)
    }
  }

  async addBranch(bid = '', uid = '', second = false) {
    if (bid?.trim().length) {
      let branch = await remult.repo(Branch).findId(bid)
      if (this.branches.length > 1) {
        if (second) {
          this.branches[1] = branch
        }
        else {
          this.branches[0] = branch
        }
      }
      else if (this.branches.length === 1) {
        if (second) {
          this.branches.push(branch)
        }
        else {
          this.branches[0] = branch
        }
      }
      else {
        this.branches.push(branch)
      }
    }
  }

  rootmenu() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

}
