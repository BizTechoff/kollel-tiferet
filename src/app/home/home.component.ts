import { Component, OnInit } from '@angular/core';
import { remult } from 'remult';
import { AppController } from '../appController';
import { RouteHelperService } from '../common-ui-elements';
import { UIToolsService } from '../common/UIToolsService';
import { terms } from '../terms';
import { SignInController } from '../users/SignInController';
import { UserMenuComponent } from '../users/user-menu/user-menu.component';
import { UserValidationComponent } from '../users/user-validation/user-validation.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  signer = new SignInController();
  branches = [] as { id: string, name: string }[]
  oldMobile = ''

  constructor(
    private routeHelper: RouteHelperService,
    private ui: UIToolsService) {
  }
  terms = terms;
  remult = remult;

  ngOnInit(): void {
  }

  async signIn() {
    if (this.signer.mobile !== this.oldMobile) {
      this.oldMobile = this.signer.mobile
      this.signer.branch = ''
    }
    this.branches.splice(0)
    try {
      let isDevMode = false
      try { isDevMode = await (new AppController()).isDevMode() }
      catch (err) { console.error(`isDevMode error: ${err}`) }
      if (isDevMode && false) {
        let res = await this.signer.sendValidationCode()
        if (res.special) {

        }
        if (res.success) {
          this.routeHelper.navigateToComponent(UserValidationComponent, { mobile: this.signer.mobile })
        }
        else {
          this.ui.info(res.error)
        }
      }
      else {
        const res = await this.signer.userBranches()
        if (res.error.length) {
          this.ui.info(res.error)
        }
        else {
          // if (!this.signer.branch.length) {
          //   if (res.branches.length === 1) {
          //     this.signer.branch = res.branches[0].id
          //   }
          //   else if (res.branches.length === 2){
          //     this.signer.branch = res.branches[1].id
          //   }
          // }
          // if (!this.signer.branch.length) {
          //   this.ui.info('לא נבחר סניף')
          // }
          // else 
          {
            this.branches.push(
              ...res.branches)
            if (this.branches.length < 2 || this.signer.branch.length) {
              let res = await this.signer.signIn()
              if (res.success) {
                remult.user = res.userInfo
                this.routeHelper.navigateToComponent(UserMenuComponent)
              }
              else {
                this.ui.info(res.error)
              }
            }
            else if (this.branches.length === 2) {
              this.signer.branch = this.branches[0].id
            }
            else {
              console.error('NO BRANCHES FOR CURRENT USER')
            }
          }
        }
      }
    }
    catch (err) {
      console.info(`AppController.error: ${JSON.stringify(err)}`)
    }

  }

  isNumberKey(evt: any) {
    // //console.log('evt', evt)
    var charCode = (evt.which) ? evt.which : evt.keyCode
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
  }

}
