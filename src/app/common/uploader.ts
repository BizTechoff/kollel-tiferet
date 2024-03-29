import { Injectable } from '@angular/core';
// import fetch from 'node-fetch';
import { remult } from 'remult';
import { AppController } from '../appController';
import { Branch } from '../branches/branch';
import { Media } from '../media/media';
import { MediaType } from '../media/mediaTypes';
import { News } from '../news/news';
import { Tenant } from '../tenants/tenant';
import { User } from '../users/user';
import { Visit } from '../visits/visit';

@Injectable()
export class uploader {//client-side

  excel = false
  branch!: Branch
  visit!: Visit
  tenant!: Tenant
  volunteer!: User
  news!: News
  date!: Date

  links = [] as { file: string, path: string }[]

  constructor(excel: Boolean, visit: Visit, tenant: Tenant, volunteer: User, news: News, date: Date = undefined!) {
    this.excel = excel === true ? true : false
    this.visit = visit
    this.tenant = tenant
    this.volunteer = volunteer
    this.news = news
    this.date = date
  }

  isInternetOk() {
    let result = [] as string[]
    if ('connection' in navigator) {
      const connection = navigator.connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      if (connection) {
        if ('effectiveType' in connection) {
          result.push(`Effective network type: ${(connection as any).effectiveType}`);
        } else {
          result.push('Effective network type information not available.');
        }

        // Check if the 'downlink' property exists before accessing it
        if ('downlink' in connection) {
          result.push(`Downlink speed: ${(connection as any).downlink} Mbps`)
        } else {
          result.push('Downlink speed information not available.');
        }

        // Check if the 'saveData' property exists before accessing it
        if ('saveData' in connection) {
          result.push(`Save data mode: ${(connection as any).saveData}`);
        } else {
          result.push('Save data mode information not available.');
        }
      }
    } else {
      result.push('Network Information API not supported.');
    }
    console.info(result.join('\n'))
    return result
  }

  async fetchExifMetadata(url = '') {
    try {
      const response = await fetch(`api/getExif?url=${encodeURIComponent(url)}`);
      const metadata = await response.json();

      // Display metadata (modify this according to your needs)
      const metadataDisplay = document.getElementById('metadata');
      metadataDisplay!.innerHTML = `
        <p><strong>Image URL:</strong> ${url}</p>
        <p><strong>Date Taken:</strong> ${metadata.exif.DateTimeOriginal || 'N/A'}</p>
        <p><strong>GPS Location:</strong> ${metadata.gps.GPSLatitude || 'N/A'}, ${metadata.gps.GPSLongitude || 'N/A'}</p>
      `;
    } catch (error) {
      console.error(`Error fetching image or extracting metadata:`, error);
    }
  }


  async handleFile(file: any) {
    let result = ''
    if (!file) {
      alert('Please select a file.');
      return result;
    }

    const fileType = file.type.split('/')[1];
    console.log('fileType', fileType)
    const { v4: uuidv4 } = require('uuid');
    let id = uuidv4()

    let fileName = `${id}`
    let branchEngName = this.branch.email.trim().split('@')[0]
    const body =
    {
      key: 'eshel-app-s3-key',
      f: encodeURI(fileName),
      branch: encodeURI(branchEngName),
      excel: this.excel ? 'true' : 'false'
    }

    let response!: Response
    try {
      response = await fetch(
        '/api-req/s3Url',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });
    }
    catch (err) {
      console.error('upload ERROR: ' + err)
      throw new Error("שגיאת אינטרנט")
    }
    const { url, error } = await response.json();
    console.log(`returning end-point url (valid 60 sec): ${url} ${error} `)

    let uploadResponse!: Response
    try {
      uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });
    }
    catch (err) {
      console.error('upload ERROR: ' + err)
      throw new Error("שגיאת אינטרנט")
    }

    if (uploadResponse.ok) {
      const imageUrl = url.split('?')[0]
      const fileExtension = file.name.split('.').pop();

      await this.addMedia(id, fileName, fileExtension, imageUrl, this.date)
      result = imageUrl
    } else {
      const error = await uploadResponse.text();
      result = (`Failed to upload image. Error: ${error}`);
    }
    return result
  }


  async handleFiles(files: any[], allowedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.webm'] as string[]) {

    this.isInternetOk()

    if (!this.branch || !this.branch.id || !this.branch.id.trim().length) {
      //console.log('a-10')
      this.branch = await remult.repo(Branch).findId(remult.user?.branch!)
      // console.log('loadFiles.branch.after', this.branch)
      //console.log('a-11')
    }

    var result = [] as string[]
    // var promises = [] as Promise<boolean>[];
    for (const f of files) {

      // Alternatively, you can check file extension
      const fileExtension = f.name.split('.').pop();
      console.log('fileExtension', fileExtension)
      if (allowedExtensions.includes(`.${fileExtension.toLowerCase()}`)) {

        // let proccess = new Promise<boolean>(async () => {
        // console.log('busy - 100')
        let url = await this.handleFile(f)
        result.push(url)

        // let url = await this.handleFile(f)
        // // console.log('busy - 101')
        // if (url?.trim().length) {
        //   result.push(url)
        // }
        // })
        // console.log('busy - 10')
        // await proccess
        // console.log('busy - 11')
        // promises.push(proccess);
      }
    }
    // if (promises.length) {
    //   console.log('busy - 10',promises.length)
    //   await Promise.all(promises);
    //   console.log('busy - 11')
    // }
    return result
  }

  async handleFile1(file: any) {
    console.log('handleFile', file)

    // var taken = await this.takenOnDate(file) as Date
    // return ''

    var signedUrl = await this.signUrl()//with aws
    if (signedUrl?.trim().length) {
      console.log('signedUrl', signedUrl)
      var uploaded = await this.uploadUrl(signedUrl, file)//to aws
      signedUrl = signedUrl.split('?')[0]
      if (uploaded) {
        console.log('uploaded', uploaded)
        // var taken = await this.takenOnDate(file) as Date
        await this.addToMedia('', signedUrl, file.type)//, taken)
      }
    }

    return signedUrl ?? ''
  }

  async signUrl() {
    let result = '';
    const { v4: uuidv4 } = require('uuid');
    let id = uuidv4()

    let fileName = `${id}`
    let branchEngName = this.branch.email.trim().split('@')[0]
    const s3SignUrl = `/api/s3Url?key=${'eshel-app-s3-key'}&f=${encodeURI(fileName)}&branch=${encodeURI(branchEngName)}&excel=${this.excel ? 'true' : 'false'}`;
    const signRes = await fetch(s3SignUrl);
    // const { key1, url1 } = await signRes.json();
    // console.log('key1',key1,'url1',url1)
    if (signRes?.ok) {
      let link = await signRes.json();
      console.log('link', link)
      if (link && link.url && link.url.length > 0) {
        result = link.url//.split('?')[0]
        console.log('link.result', result, JSON.stringify(link))
      }
    } else {
      console.error(`signUrl.error: { status: ${signRes.status}, statusText: ${signRes.statusText} } `);
    }
    return result
  }

  async uploadUrl(url = '', f: any) {
    console.debug(`uploadUrl: { url: ${url}, f: ${f.name} }`)
    var result = false
    const linkRes = await fetch(url, {
      method: "PUT",
      body: f
    })

    if (linkRes.ok) {
      result = true
    } else {
      console.error(`uploadUrl.error: { status: ${linkRes.status}, statusText: ${linkRes.statusText} , all: ${await linkRes.text()}} `);
    }
    return result
  }

  async addToMedia(id = '', link = '', type = '', taken?: Date) {
    var added = await remult.repo(Media).insert({
      branch: this.branch,
      visit: this.visit,
      tenant: this.tenant,
      volunteer: this.volunteer,
      news: this.news,
      type: type.includes('image') ? MediaType.photo : type.includes('video') ? MediaType.video : MediaType.excel,
      link: link,
      taken: taken,
      id: id
    })
    if (added && added.id === id && added.link === link) {
      return true
    }
    return false
  }



  async loadFiles(files: any) {
    this.links = [] as { file: string, path: string }[]
    let isDevMode = await (new AppController()).isDevMode()
    if (files && files.length > 0) {
      // console.log('loadFiles.branch.before', this.branch)
      if (!this.branch || !this.branch.id || !this.branch.id.trim().length) {
        //console.log('a-10')
        this.branch = await remult.repo(Branch).findId(remult.user?.branch!)
        // console.log('loadFiles.branch.after', this.branch)
        //console.log('a-11')
      }

      for (let index = 0; index < files.length; index++) {
        const file: File = files[index];

        // console.debug(`loadFiles: { isDevMode: ${isDevMode}, name: ${file.name}, type: ${file.type}, path: ${file.webkitRelativePath}, excel: ${this.excel} }`)

        // if (isDevMode) {
        //   if (!this.excel) {
        //     console.info(`DevMode = 'true', Files NOT uploaded! `)
        //     continue
        //   }
        // }

        // if (!mediaAllowedUploadFileTypes.includes(file.type)) {
        //   console.debug(`loadFiles(${file.name}): file type ${file.type} not allowed to upload`)
        //   continue;
        // }
        // let f: File = file; 
        // //console.log('success-0', false)
        let success = await this.upload(file);
      }
    }
    return this.links
  }

  async upload(f: any): Promise<boolean> {
    let p = new Promise<boolean>(async (resolve, reject) => {
      let message = '';
      let result = false;
      const { v4: uuidv4 } = require('uuid');
      let id = uuidv4()

      let fileName = `${id}`
      // if (uploadS3WithFileExtention) {
      //   let split = f.type.split('/')
      //   if (split.length > 1) {
      //     fileName += `.${split[1]}`
      //   }
      // }
      //console.log('upload.1')
      // //console.log('upload.uuid',id)
      // get secure url from our server//'http://localhost:3000' + 
      // console.log('branchEngName', 11111)
      let branchEngName = this.branch.email.trim().split('@')[0]
      const s3SignUrl = `/api/s3Url?key=${'eshel-app-s3-key'}&f=${encodeURI(fileName)}&branch=${encodeURI(branchEngName)}&excel=${this.excel ? 'true' : 'false'}`;
      // //console.log('s3SignUrl', s3SignUrl)
      //console.log('upload.2')
      const signRes = await fetch(s3SignUrl);

      // console.log('branchEngName', branchEngName)
      //console.log('upload.3')
      if (signRes.ok) {
        // console.log('branchEngName 1', branchEngName)
        // //console.log('upload.4',await signRes.json())
        // coso
        let link = await signRes.json();// JSON.parse(await url.text());// as AwsS3SignUrlResponse;
        //console.log('upload.4.1',link)
        // //console.log('link', link)
        if (link && link.url && link.url.length > 0)
        // post the image direclty to the s3 bucket
        {
          // console.log('branchEngName 2', branchEngName)
          const linkRes = await fetch(link.url, {
            method: "PUT",
            body: f
          })

          if (linkRes.ok) {
            // //console.log('linkRes.linkRes', linkRes)
            const imageUrl = link.url.split('?')[0]
            // //console.log(imageUrl)
            // console.log('branchEngName 3', branchEngName)
            if (!this.excel) {
              await this.addMedia(id, f.name, f.type, imageUrl, this.date)
            }
            this.links.push({ file: id, path: imageUrl })
            result = true;
          }
          else {
            // //console.log('NOT OK')
            message = `upload.link(${link}): { status: ${linkRes.status}, statusText: ${linkRes.statusText} }`;
            // console.debug(message);
          }
        } else {
          //console.log('upload.5')
          // //console.log('NOT OK')
          message = `upload(${f.name}): upSigning Url Failed`;
          // console.debug(message);
        }
      }
      else {
        message = `upload(${f.name}): { status: ${signRes.status}, statusText: ${signRes.statusText} }`;
        // console.debug(message);
      }
      if (message.length > 0) {
        console.debug(message);
      }
      resolve(result)
      // if (result) {
      //   resolve(result)
      // }
      // else {
      //   reject(message)
      // }
    });
    // let closeBusy = this.busy.showBusy();
    let ret = await p;
    // closeBusy();
    return ret;
  }

  async addMedia(id: string, name: string, type: string, link: string, date: Date) {
    //console.log('a-1')

    // console.log('branchEngName 4')
    //console.log('a-60',JSON.stringify( this.branch))
    // if(!this.visit){
    //console.log('a-2') 

    // branch: {$id: this.branch?.id },
    //   visit:{$id: this.visit?.id },
    //   tenant: {$id: this.tenant?.id },
    //   volunteer: {$id: this.volunteer?.id },

    if (!this.visit && false) {
      // console.log('this.branch', this.branch)
      // console.log('this.visit', this.visit)
      // console.log('this.tenant', this.tenant)
      // console.log('this.volunteer', this.volunteer)

      let media2 = await remult.repo(Media).find({
        where: {
          branch: this.branch,
          visit: this.visit,
          tenant: this.tenant,
          volunteer: this.volunteer,
          active: true
        }
      })

      // console.log('branc?hEngName 4.5+')

      let media = await remult.repo(Media).findFirst({
        branch: this.branch,
        visit: this.visit,
        tenant: this.tenant,
        volunteer: this.volunteer,
        active: true
      })
      // console.log('branchEngName 5')
      //console.log('a-3')
      if (media) {
        //console.log('a-4')
        media.active = false
        await media.save()
        // console.log('branchEngName 6')
      }
    }
    //console.log('a-6',JSON.stringify( this.branch))
    await remult.repo(Media).insert({
      branch: this.branch,
      visit: this.visit,
      tenant: this.tenant,
      volunteer: this.volunteer,
      news: this.news,
      link: link,
      id: id,
      date: this.date,
      type: ['jpg', 'jpeg', 'png'].includes(type)
        ? MediaType.photo
        : ['mp4', 'avi'].includes(type)
          ? MediaType.video
          : ['csv', 'xls', 'xlsx'].includes(type)
            ? MediaType.excel
            : MediaType.none
    })
    // console.log('branchEngName 8')
    //console.log('a-7')
  }

  async download(fileName = ''): Promise<string[]> {
    // let excel = new ExcelController()
    // return await excel.import()
    return [] as string[]
  }

  async download2(fileName = ''): Promise<boolean> {
    let p = new Promise<boolean>(async (resolve, reject) => {
      let message = '';
      let result = false;
      // if (uploadS3WithFileExtention) {
      //   let split = f.type.split('/')
      //   if (split.length > 1) {
      //     fileName += `.${split[1]}`
      //   }
      // }  
      //console.log('upload.1')
      // //console.log('upload.uuid',id)
      // get secure url from our server//'http://localhost:3000' + 
      // console.log('branchEngName', 11111)
      let branchEngName = 'eshel.app.test'
      const s3SignUrl = `/api/download?key=${'eshel-app-s3-key'}&f=${encodeURI(fileName)}&branch=${encodeURI(branchEngName)}&excel=${this.excel ? 'true' : 'false'}`;
      // //console.log('s3SignUrl', s3SignUrl)
      //console.log('upload.2')
      const signRes = await fetch(s3SignUrl);
      result = true
      // console.log('branchEngName', branchEngName)
      //console.log('upload.3')
      // if (signRes.ok) {
      //   // console.log('branchEngName 1', branchEngName)
      //   // //console.log('upload.4',await signRes.json())
      //   // coso
      //   let link = await signRes.json();// JSON.parse(await url.text());// as AwsS3SignUrlResponse;
      //   //console.log('upload.4.1',link)
      //   // //console.log('link', link)
      //   if (link && link.url && link.url.length > 0)
      //   // post the image direclty to the s3 bucket
      //   {
      //     // console.log('branchEngName 2', branchEngName)
      //     const linkRes = await fetch.default(link.url, {
      //       method: "GET"
      //     })

      //     if (linkRes.ok) {
      //       console.log('download SUCCESS')
      //       let excel = linkRes.body
      //       // //console.log('linkRes.linkRes', linkRes)
      //       // const imageUrl = link.url.split('?')[0]
      //       // // //console.log(imageUrl)
      //       // // console.log('branchEngName 3', branchEngName)
      //       // // if (!this.excel) { 
      //       // //   await this.addMedia(id, f.name, f.type, imageUrl)
      //       // // }
      //       // this.links.push(imageUrl)
      //       // result = true;
      //     }
      //     else {
      //       // //console.log('NOT OK')
      //       message = `upload.link(${link}): { status: ${linkRes.status}, statusText: ${linkRes.statusText} }`;
      //       // console.debug(message);
      //     }
      //   } else {
      //     //console.log('upload.5')
      //     // //console.log('NOT OK')
      //     message = `upload(${fileName}): upSigning Url Failed`;
      //     // console.debug(message);
      //   }
      // }
      // else {
      //   message = `upload(${fileName}): { status: ${signRes.status}, statusText: ${signRes.statusText} }`;
      //   // console.debug(message);
      // }
      // if (message.length > 0) {
      //   console.debug(message);
      // }
      resolve(result)
      // if (result) {
      //   resolve(result)
      // }
      // else {
      //   reject(message)
      // }
    });
    // let closeBusy = this.busy.showBusy();
    let ret = await p;
    // closeBusy();
    return ret;
  }

}
