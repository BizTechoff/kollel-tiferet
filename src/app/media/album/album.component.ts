import { Component, OnInit } from '@angular/core';
import { remult } from 'remult';
import { Branch } from '../../branches/branch';
import { BranchGroup } from '../../branches/branchGroup';
import { BusyService, RouteHelperService, openDialog } from '../../common-ui-elements';
import { UIToolsService } from '../../common/UIToolsService';
import { uploader } from '../../common/uploader';
import { terms } from '../../terms';
import { UserMenuComponent } from '../../users/user-menu/user-menu.component';
import { GalleryComponent } from '../gallery/gallery.component';
import { Media } from '../media';
import { MediaController } from '../mediaController';
import { MediaType } from '../mediaTypes';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss']
})
export class AlbumComponent implements OnInit {

  media = [] as {
    month: string,
    days: {
      day: string,
      weekDay: string,
      branches: { branch: Branch, last: Date, media: Media[] }[]
    }[]
  }[]
  query = new MediaController()

  constructor(
    private routeHelper: RouteHelperService,
    private ui: UIToolsService,
    private busy: BusyService) { }
  MediaType = MediaType
  terms = terms;
  remult = remult;

  async ngOnInit(): Promise<void> {
    remult.user!.lastComponent = AlbumComponent.name
    this.query.group = BranchGroup.fromId(remult.user!.group)
    await this.retrieve()
  }

  async retrieve() {
    this.media = await this.query.getPhotos()
    // console.log(this.media.length)
  }

  async groupChanged() {
    let group = BranchGroup.fromId(remult.user!.group)
    if (group) {
      console.log(`AlbumComponent.groupChanged: { this.query.group: ${this.query.group.id}, group: ${group.id}`)
      if (group !== this.query.group) {
        this.query.group = group
        await this.retrieve()
      }
    }
  }

  async mediaClicked(clicked: Media) {
    openDialog(GalleryComponent, self => {
      for (const w of this.media) {
        for (const d of w.days) {
          for (const b of d.branches) {
            for (const m of b.media) {
              if (m.id === clicked.id) {
                self.args.media = b.media
                self.args.current = m
                break;
              }
            }
          }
        }
      }
      // let found = this.media.find(itm => branch.id === itm.branch.id)
      // if (found) {
      //   let current = found.media.find(itm => m.id === itm.id)
      //   if (current) {
      //     self.args.media = found.media
      //     self.args.current = current
      //   }
      // }
    })
  }

  // async gallery(branchId = '') {
  //   if (branchId?.trim().length) {
  //     this.routeHelper.navigateToComponent(GalleryComponent)
  //   }
  // }


  uploading = false
  async onFileInput(e: any, target: string) {

    try {
      // console.log('busy - 1')
      this.uploading = true

      await this.busy.doWhileShowingBusy(
        async () => {
          // console.log('busy - 2')
          let s3 = new uploader(
            false,
            undefined!,
            undefined!,
            undefined!,
            undefined!)

          var tFiles = await s3.handleFiles(
            e.target.files)
          // console.log('busy - 3')
          var files = [] as string[]
          files.push(...tFiles)
          // console.log('busy - 4')
          if (files?.length) {
            this.ui.info(`העלאה הסתיימה בהצלחה`)
            // console.log('busy - 5')
            await this.retrieve()
          }
        }
      )
    } finally {
      this.uploading = false
      // console.log('busy - 6')
    }

    // let s3 = new uploader(
    //   false,
    //   this.visit,
    //   undefined!,
    //   undefined!,
    //   undefined!)

    // await s3.loadFiles(e.target.files) //, target)
  }


  // async onFileInput(e: any, target: string) {

  //   let s3 = new uploader(
  //     false,
  //     undefined!,
  //     undefined!,
  //     undefined!,
  //     undefined!)

  //   let files = await s3.loadFiles(e.target.files)
  //   if (files?.length) {
  //     await this.retrieve()
  //   }
  // }

  async uploadText() {


    try {
      // console.log('busy - 1')

      let result = await this.ui.selectText()
      if (result.ok) {
        this.uploading = true
        await this.busy.doWhileShowingBusy(
          async () => {
            let success = await this.query.imageFromText(
              result.text)
            if (success) {
              this.ui.info(`העלאה הסתיימה בהצלחה`)
              await this.retrieve()
            }
            // console.log(`'uploadText': ${success}`)
          }
        )
      }
    } finally {
      this.uploading = false
      // console.log('busy - 6')
    }

  }

  back() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

  close() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

  rootmenu() {
    this.routeHelper.navigateToComponent(UserMenuComponent)
  }

}
