import { Allow, BackendMethod, Controller, ControllerBase, Field, Fields, remult } from "remult";
import { downloadByLink, upload } from "../../server/aws-s3";
// import { upload } from "../../server/aws-s3";
import { Branch } from "../branches/branch";
import { BranchGroup } from "../branches/branchGroup";
import { addDaysToDate, dateDiff, firstDateOfWeek, lastDateOfWeek, resetDateTime } from "../common/dateFunc";
import { hebrewMonths } from "../terms";
import { Roles } from "../users/roles";
import { Media } from "./media";
import { MediaType } from "./mediaTypes";

@Controller('media')
export class MediaController extends ControllerBase {

    @Field<MediaController, BranchGroup>(() => BranchGroup, { caption: 'קבוצה' })
    group = BranchGroup.all

    @Fields.dateOnly<MediaController>({ caption: 'תאריך' })
    date!: Date


    @BackendMethod({ allowed: Roles.manager })
    async validateWeeklyPhotosUploaded() {
        var locked = false
        var validate = process.env['VALIDATE_WEEKLY_PHOTOS_UPLOADED'] === 'true' ?? false
        // var count = await remult.repo(Media).count()
        if (!validate) {// || !count) {
            console.info('Photo validation is Off')
        }
        else if (this.date) {
            this.date = resetDateTime(this.date)
            const start = addDaysToDate(
                firstDateOfWeek(this.date),
                -7)
            const end = lastDateOfWeek(start)

            console.log('getPhotosCountWeekly',
                start.toLocaleDateString(),
                end.toLocaleDateString(),
                dateDiff(start, end) + ' days')

            var c = await remult.repo(Media).count({
                branch: { $id: remult.user?.branch! },
                type: [MediaType.photo, MediaType.video, MediaType.text],
                date: { '$gte': start, '$lte': end },
                active: true
            })
            locked = !(c > 0)
            console.log('validateWeeklyPhotosUploaded.locked', locked)
        }
        return locked
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getTenantPhotoLink(id: string) {
        let photo = await remult.repo(Media).findFirst({
            tenant: { $id: id },
            visit: undefined!,
            active: true
        })
        return photo?.link ?? ''
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getVolunteerPhotoLink(id: string) {
        let photo = await remult.repo(Media).findFirst({
            volunteer: { $id: id },
            visit: undefined!,
            active: true
        })
        return photo?.link ?? ''
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getPhotos() {
        let result = [] as { month: string, branches: { branch: Branch, last: Date, media: Media[] }[] }[]
        for await (const m of remult.repo(Media).query({
            where: {
                active: true,
                branch: (remult.user!.isAdmin || remult.user!.isDonor)
                    ? await remult.repo(Branch).find({
                        where: {
                            system: false,
                            active: true,
                            group: this.group === BranchGroup.all
                                ? undefined!
                                : this.group
                        }
                    })
                    : { $id: remult.user?.branch! }
            },
            orderBy: { branch: "asc", date: 'desc', created: 'desc' }
        })) {

            let month = `חודש ${hebrewMonths[m.date.getMonth()]}`
            let year = m.date.getFullYear()
            if (year !== (new Date()).getFullYear()) {
                month += ` ${year}`
            }

            let found = result.find(w => w.month === month)
            if (!found) {
                found = { month: month, branches: [] as { branch: Branch, last: Date, media: Media[] }[] }
                result.push(found)
            }
            let foundMonth = found.branches.find(b => b.branch.id === m.branch.id)
            if (!foundMonth) {
                foundMonth = { branch: m.branch, last: undefined!, media: [] as Media[] }
                found.branches.push(foundMonth)
            }
            if (!foundMonth.last || m.date > foundMonth.last) {
                foundMonth.last = m.date
            }
            foundMonth.media.push(m)
        }

        // result.so
        for (const m of result) {
            m.branches.sort((b1, b2) => +b2.last - +b1.last)
        }
        // result.sort((a,b) => a.)


        return result
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async add(id: string, link: string): Promise<boolean> {
        let row = remult.repo(Media).create()
        row.branch = await remult.repo(Branch).findId(remult.user?.branch!)
        row.type = MediaType.photo
        row.link = link
        row.id = id
        await row.save()
        return true
    }
 
    @BackendMethod({ allowed: Allow.authenticated })
    async imageFromText(text: string): Promise<boolean> {
        let b = await remult.repo(Branch).findId(remult.user!.branch)
        if (b) {
            let email = b.email
            if (email?.trim().length) {
                let branchEngName = email.trim().split('@')[0]
                let file = await upload(text!, branchEngName)
                if (file.link?.trim().length) {
                    return this.add(file.id, file.link)
                }
            }
        }
        return false
    }

    @BackendMethod({ allowed: [Roles.admin, Roles.donor] })
    async download(link = '') {
        return await downloadByLink(link)
    }
}
