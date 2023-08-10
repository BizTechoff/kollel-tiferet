import { Allow, BackendMethod, Controller, ControllerBase, Field, Fields, remult } from "remult";
import { Branch } from "../branches/branch";
import { BranchGroup } from "../branches/branchGroup";
import { DataControl } from "../common-ui-elements/interfaces";
import { firstDateOfWeek, lastDateOfWeek, resetDateTime } from "../common/dateFunc";
import { Tenant } from "../tenants/tenant";
import { Roles } from "../users/roles";
import { Visit } from "./visit";
import { VisitVolunteer } from "./visit-volunteer";
import { VisitStatus } from "./visitStatus";
import { ExportType } from "./visits-export/exportType";

export interface exportDataRow {
    // "excelLine": number;
    // "import-status": string;
    // "error"?: string;
    [caption: string]: any;
}

let hebrewMonths = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר'
]

const COLUMN_BRANCH = 'כולל'
const COLUMN_TENANT = 'דייר'
const COLUMN_VOLUNTEERS = 'מתנדבים'
const COLUMN_DELIVERED = 'מסרו'
const COLUMN_VISITED = 'ביקרו'

@Controller('visit')
export class VisitController extends ControllerBase {

    @DataControl({ clickIcon: 'edit' })
    @Fields.dateOnly<VisitController>({
        caption: 'מתאריך'
    })
    fdate!: Date

    @Fields.dateOnly<VisitController>({
        caption: 'עד תאריך'
    })
    tdate!: Date

    @Fields.boolean<VisitController>({
        caption: 'מפורט'
    })
    detailed = false

    @Field<VisitController, ExportType>(() => ExportType, {
        caption: 'סוג ייצוא'
    })
    type = ExportType.done

    @Field<VisitController, BranchGroup>(() => BranchGroup, {
        caption: 'קבוצה'
    })
    group = BranchGroup.fromId(remult.user!.group)

    @Fields.boolean<VisitController>({
        caption: 'בפועל'
    })
    actual = false


    @BackendMethod({ allowed: [Roles.admin, Roles.donor] })
    async getVisitsByBranch() {
        // console.log('SERVER 3',this.fdate, this.tdate, this.detailed, this.type.id, this.group.id)
        this.fdate = resetDateTime(this.fdate)
        this.tdate = resetDateTime(this.tdate)
        // console.log('SERVER 4',this.fdate, this.tdate, this.detailed, this.onlyDone)
        let result = [] as { branch: string, /*rows: Visit[],*/ summary: { count: number, delivered: number, visited: number } }[]
        for await (const v of remult.repo(Visit).query(
            {
                where: {
                    branch: {
                        $id: (await remult.repo(Branch).find({
                            where: {
                                active: true,
                                system: false,
                                group: this.group === BranchGroup.all
                                    ? undefined!
                                    : this.group
                            }
                        })).map(b => b.id)
                    },
                    date: {
                        "$gte": this.fdate,
                        "$lte": this.tdate
                    }
                }
            })) {

            let found = result.find(b => b.branch === v.branch.name)
            if (!found) {
                found = {
                    branch: v.branch.name,
                    summary: { count: 0, delivered: 0, visited: 0 }
                }
                result.push(found)
            }
            found.summary.delivered += v.status === VisitStatus.delivered ? 1 : 0
            found.summary.visited += v.status === VisitStatus.visited ? 1 : 0
            found.summary.count += 1
        }
        for (const b of result) {
            b.summary.count = b.summary.count - (b.summary.delivered + b.summary.visited)
        }
        // for (const b of result) {
        //     console.log('b.summary.count',b.summary.count)
        // }
        // console.log('125')
        // result = result.filter(c => (c.delivers + c.visits) > 0)
        result.sort((c1, c2) => c1.branch.localeCompare(c2.branch))
        return result
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getVisit(id: string) {
        let result!: Visit
        if (id?.trim().length) {
            result = await remult.repo(Visit).findId(id)
        }
        return result
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getVisits() {
        // console.log('SERVER 5',this.fdate, this.tdate, this.detailed, this.onlyDone)
        this.fdate = resetDateTime(this.fdate)
        this.tdate = resetDateTime(this.tdate)
        // console.log('SERVER 6',this.fdate, this.tdate, this.detailed, this.onlyDone)
        let rows = await remult.repo(Visit).find({
            where: {
                branch: {
                    $id: (await remult.repo(Branch).find({ where: { active: true, id: remult.user!.branch } }))
                        .map(b => b.id)
                },
                date: {
                    "$gte": this.fdate,
                    "$lte": this.tdate
                }//,
                // tenant: search?.trim().length ? await remult.repo(Tenant).find({ where: { name: { $contains: search } } }) : undefined!
            },
            orderBy: { status: 'asc', created: 'asc' }//,
            // limit: limit,
            // page: page
        })

        // for (const r of rows) {
        //     r.volunteersNames =
        //         (await remult.repo(VisitVolunteer).find({
        //             where: { visit: { $id: r.id } }
        //         }))
        //             .map(v => v.volunteer?.name).join(', ')
        // }

        return rows
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getVisitsReadOnly(branch = '',) {
        // console.log('SERVER 5',this.fdate, this.tdate, this.detailed, this.onlyDone)
        this.fdate = resetDateTime(this.fdate)
        this.tdate = resetDateTime(this.tdate)
        // console.log('SERVER 6',this.fdate, this.tdate, this.detailed, this.onlyDone)
        let rows = await remult.repo(Visit).find({
            where: {
                branch: {
                    $id: (await remult.repo(Branch).find({ where: { active: true, id: branch } }))
                        .map(b => b.id),
                    group: this.group === BranchGroup.all
                        ? undefined!
                        : this.group
                },
                status: this.type === ExportType.done
                    ? { '$ne': VisitStatus.none }
                    : this.type === ExportType.notDone
                        ? VisitStatus.none
                        : undefined!,
                date: {
                    "$gte": this.fdate,
                    "$lte": this.tdate
                }//,
                // tenant: search?.trim().length ? await remult.repo(Tenant).find({ where: { name: { $contains: search } } }) : undefined!
            },
            orderBy: { status: 'asc', created: 'asc' }//,
            // limit: limit,
            // page: page
        })

        for (const r of rows) {
            r.volunteersNames =
                (await remult.repo(VisitVolunteer).find({
                    where: { visit: { $id: r.id } }
                }))
                    .map(v => v.volunteer?.name).join(', ')
        }

        return rows
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getOpenVisitsCount() {
        // console.log('SERVER 7',this.fdate, this.tdate, this.detailed, this.onlyDone)
        this.fdate = resetDateTime(this.fdate)
        this.tdate = resetDateTime(this.tdate)
        // console.log('SERVER 8',this.fdate, this.tdate, this.detailed, this.onlyDone)
        return await remult.repo(Visit).count(
            {
                branch: { $id: remult.user!.branch },
                date: {
                    "$gte": this.fdate,
                    "$lte": this.tdate
                },
                status: VisitStatus.none
            }
        )
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getWeeklyCounters() {
        // console.log('SERVER',this.fdate, this.tdate, this.detailed, this.onlyDone)
        this.fdate = resetDateTime(this.fdate)
        this.tdate = resetDateTime(this.tdate)
        // console.log('SERVER 2',this.fdate, this.tdate, this.detailed, this.onlyDone)
        let count = [] as { branch: string, name: string, tenants: number, delivers: number, visits: number, missings: number }[]
        if (remult.user!.isAdmin || remult.user!.isDonor) {
            // console.log('123')
            for await (const v of remult.repo(Visit).query(
                {
                    where: {
                        branch: {
                            $id: (await remult.repo(Branch).find({
                                where: {
                                    active: true, system: false,
                                    group: this.group === BranchGroup.all
                                        ? undefined!
                                        : this.group
                                }
                            })).map(b => b.id)
                        },
                        date: {
                            "$gte": this.fdate,
                            "$lte": this.tdate
                        }
                    }
                })) {
                // v.date = resetDateTime(v.date)
                // console.log('visit',v.date)
                let found = count.find(b => b.name === v.branch.name)
                if (!found) {
                    // console.log('124')
                    found = {
                        branch: v.branch.id,
                        name: v.branch.name,
                        tenants: await remult.repo(Tenant).count({ active: true, branch: v.branch }),
                        delivers: 0,
                        visits: 0,
                        missings: 0
                    }
                    count.push(found)
                }
                found.delivers += v.status === VisitStatus.delivered ? 1 : 0
                found.visits += v.status === VisitStatus.visited ? 1 : 0
                found.missings += v.status === VisitStatus.none ? 1 : 0
            }
            // console.log('125')
            count = count.filter(c => (c.delivers + c.visits) > 0)
            count.sort((c1, c2) => c1.name.localeCompare(c2.name))
        }
        else if (remult.user!.isManager) {
            let rec: { branch: string, name: string, tenants: number, delivers: number, visits: number, missings: number } =
            {
                branch: remult.user!.branch,
                name: remult.user!.branchName,
                tenants: await remult.repo(Tenant).count({
                    branch: { $id: remult.user!.branch },
                    active: true
                }),
                delivers: 0,
                visits: 0,
                missings: 0
            }
            for await (const v of remult.repo(Visit).query(
                {
                    where: {
                        branch: {
                            $id: (await remult.repo(Branch).find({ where: { active: true, id: remult.user!.branch } }))
                                .map(b => b.id)
                        },
                        date: {
                            "$gte": this.fdate,
                            "$lte": this.tdate
                        }
                    }
                })) {
                rec.delivers += v.status === VisitStatus.delivered ? 1 : 0
                rec.visits += v.status === VisitStatus.visited ? 1 : 0
                rec.missings += v.status === VisitStatus.none ? 1 : 0
            }
            count.push(rec)
        }

        return count
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async exportVisits() {

        const fieldsCount = remult.user?.isManager ? 6 : 11
        let data = [] as {
            month: string,
            branches: {
                branch: string,
                totalTenants: number,
                totalVolunteers: number,
                totalDelivered: number,
                totalVisited: number,
                totalPayment: number,
                weeksCounter: string[],
                // deletedWeeks: [],//???????????????????????????????????????????????????
                weeks: {
                    week: string,
                    visits: {
                        tenant: string,
                        tenantIdNumber: string,
                        paymentNumber: string,
                        paymentBank: string,
                        paymentBranch: string,
                        paymentAccount: string,
                        payment: number,
                        tenantRemark: string,
                        volunteers: string[],
                        delivered: string,
                        visited: string
                    }[],
                    tenantsNames: string[],
                    totalTenants: number,
                    totalVolunteers: number,
                    totalPayment: number,
                    totalDelivered: number,
                    totalVisited: number
                }[]
            }[]
        }[]

        // build visits-volunteers
        // let visitVolunteers = [] as { visitId: string, volunteersNames: string[] }[]
        // for await (const vv of remult.repo(VisitVolunteer).query({
        //     where: {
        //         visit: await remult.repo(Visit).find({
        //             where: {
        //                 $and: [
        //                     this.actual
        //                         ? {
        //                             $or: [
        //                                 { status: VisitStatus.delivered },
        //                                 { status: VisitStatus.visited }
        //                             ]
        //                         }
        //                         : {}
        //                 ],
        //                 branch: remult.user?.isManager
        //                     ? { $id: remult.user.branch }
        //                     : await remult.repo(Branch).find({
        //                         where:
        //                         {
        //                             active: true,
        //                             system: false,
        //                             group: this.group === BranchGroup.all
        //                                 ? undefined!
        //                                 : this.group
        //                         }
        //                     }),
        //                 date: {
        //                     "$gte": this.fdate,
        //                     "$lte": this.tdate
        //                 }
        //             }
        //         })
        //     }
        // })) {
        //     let found = visitVolunteers.find(v => v.visitId === vv.visit.id)
        //     if (!found) {
        //         found = { visitId: vv.visit.id, volunteersNames: [] as string[] }
        //         visitVolunteers.push(found)
        //     }
        //     if (!found.volunteersNames.includes(vv.volunteer.name)) {
        //         found.volunteersNames.push(vv.volunteer.name)
        //     }
        // }

        let weeksOrder = [] as { monthKey: string, month: string, weeks: { key: string, week: string }[] }[]

        let branchWeek = [] as { key: string /*, volunteers: string[]*/ }[]
        let totalWeek = [] as { week: string, tt: number, tvol: number, td: number, tv: number,/*payBank: string,payBranch: string,payAccount: string,*/    tpay: number }[]

        // build data
        for await (const v of remult.repo(Visit).query({
            where: {
                $and: [
                    this.actual
                        ? {
                            $or: [
                                { status: VisitStatus.delivered },
                                { status: VisitStatus.visited }
                            ]
                        }
                        : {}
                ],
                branch: remult.user?.isManager
                    ? { $id: remult.user.branch }
                    : await remult.repo(Branch).find({
                        where:
                        {
                            active: true,
                            system: false,
                            group: this.group === BranchGroup.all
                                ? undefined!
                                : this.group
                        }
                    }),
                date: {
                    "$gte": this.fdate,
                    "$lte": this.tdate
                }
            },
            orderBy: { branch: 'asc', date: "asc" }
        })) {

            const tenantPayment = (v?.tenant?.payment ?? 0) / 4

            let month = `חודש ${hebrewMonths[v.date.getMonth()]}`

            // set monthsWeeks
            let motiw = weeksOrder.find(itm => itm.month === month)
            if (!motiw) {
                motiw = {
                    monthKey: `${v.date.getFullYear()}-${('0' + (v.date.getMonth() + 1)).slice(-2)}`,
                    month: month,
                    weeks: [] as { key: string, week: string }[]
                }
                weeksOrder.push(motiw)
            }

            let foundMonth = data.find(d => d.month === month)
            if (!foundMonth) {
                foundMonth = {
                    month: month,
                    branches: [] as {
                        branch: string,
                        totalTenants: number,
                        totalVolunteers: number,
                        totalDelivered: number,
                        totalVisited: number,
                        totalPayment: number,
                        weeksCounter: string[],
                        weeks: {
                            week: string,
                            visits: {
                                tenant: string,
                                tenantIdNumber: string,
                                paymentNumber: string,
                                paymentBank: string,
                                paymentBranch: string,
                                paymentAccount: string,
                                payment: number,
                                tenantRemark: string,
                                volunteers: string[],
                                delivered: string,
                                visited: string
                            }[],
                            tenantsNames: string[],
                            totalTenants: number,
                            totalVolunteers: number,
                            totalDelivered: number,
                            totalPayment: number,
                            totalVisited: number
                        }[]
                    }[]
                }
                data.push(foundMonth)
            }

            let branch = v.branch!.name
            let foundBranch = foundMonth.branches.find(b => b.branch === branch)
            if (!foundBranch) {
                foundBranch = {
                    branch: branch,
                    totalTenants: 0,
                    totalVolunteers: 0,
                    totalDelivered: 0,
                    totalVisited: 0,
                    totalPayment: 0,
                    weeksCounter: [] as string[],
                    weeks: [] as {
                        week: string,
                        visits: {
                            tenant: string,
                            tenantIdNumber: string,
                            paymentNumber: string,
                            paymentBank: string,
                            paymentBranch: string,
                            paymentAccount: string,
                            payment: number,
                            tenantRemark: string,
                            volunteers: string[],
                            delivered: string,
                            visited: string
                        }[],
                        tenantsNames: string[],
                        totalTenants: number,
                        totalVolunteers: number,
                        totalDelivered: number,
                        totalPayment: number,
                        totalVisited: number
                    }[]
                }
                foundMonth.branches.push(foundBranch)
            }

            let first = firstDateOfWeek(v.date)
            let last = lastDateOfWeek(v.date)
            let week = `שבוע ${first.getDate()}-${last.getDate()}.${last.getMonth() + 1}`

            let motib = motiw.weeks.find(itm => itm.week === week)
            if (!motib) {
                motib = {
                    key: `${first.getFullYear()}-${('0' + (first.getMonth() + 1)).slice(-2)}-${('0' + (first.getDate())).slice(-2)}`,
                    week: week
                }
                motiw.weeks.push(motib)
            }

            let foundWeek = foundBranch.weeks.find(w => w.week === week)
            if (!foundWeek) {
                foundWeek = {
                    week: week,
                    visits: [] as {
                        tenant: string,
                        tenantIdNumber: string,
                        paymentNumber: string,
                        paymentBank: string,
                        paymentBranch: string,
                        paymentAccount: string,
                        payment: number,
                        tenantRemark: string,
                        volunteers: string[],
                        delivered: string,
                        visited: string
                    }[],
                    tenantsNames: [] as string[],
                    totalTenants: 0,
                    totalVolunteers: 0,
                    totalDelivered: 0,
                    totalPayment: 0,
                    totalVisited: 0
                }
                foundBranch.weeks.push(foundWeek)
                foundBranch.weeksCounter.push(foundWeek.week)
            }

            // let f = visitVolunteers.find(vv => vv.visitId === v.id)

            // let volunteers = f ? f.volunteersNames : []

            let foundTenantName = foundWeek.tenantsNames.find(itm => itm === v.tenant.name)
            // console.log('server:', foundTenant ?? 'NULL')
            if (!foundTenantName) {
                foundWeek.tenantsNames.push(v.tenant.name)
                foundBranch.totalTenants += 1
                foundBranch.totalPayment += tenantPayment
            }
            // console.log('server:', `{foundBranch.totalTenants: ${foundBranch.totalTenants}}`)
            foundBranch.totalDelivered += v.status === VisitStatus.delivered ? 1 : 0
            foundBranch.totalVisited += v.status === VisitStatus.visited ? 1 : 0

            if (!foundTenantName) {
                foundWeek.totalTenants += 1
                foundWeek.totalPayment += tenantPayment
            }
            foundWeek.totalDelivered += v.status === VisitStatus.delivered ? 1 : 0
            foundWeek.totalVisited += v.status === VisitStatus.visited ? 1 : 0

            if (this.detailed) {
                if (!foundTenantName) {
                    let foundTenant = foundWeek.visits.find(itm => itm.tenant === v.tenant.name)
                    if (!foundTenant) {
                        foundTenant = {
                            tenant: v.tenant.name,
                            tenantIdNumber: v.tenant.idNumber,
                            paymentNumber: v.tenant.payNumber,
                            paymentBank: v.tenant.payBank,
                            paymentBranch: v.tenant.payBranch,
                            paymentAccount: v.tenant.payAccount,
                            payment: tenantPayment,
                            tenantRemark: v.remark,
                            volunteers: [] as string[],// volunteers,
                            delivered: '0',// v.status === VisitStatus.delivered ? 'כן' : '',
                            visited: '0'//v.status === VisitStatus.visited ? 'כן' : ''
                        }
                        foundWeek.visits.push(foundTenant)
                    }
                    foundTenant.delivered = (parseInt(foundTenant.delivered) + (v.status === VisitStatus.delivered ? 1 : 0)) + ''//todo:
                    foundTenant.visited = (parseInt(foundTenant.visited) + (v.status === VisitStatus.visited ? 1 : 0)) + ''//?????
                }
            }

            let key = foundBranch.branch + '-' + foundWeek.week
            let fbw = branchWeek.find(bw => bw.key === key)
            if (!fbw) {
                fbw = { key: key /*, volunteers: [] as string[]*/ }
                branchWeek.push(fbw)
            }
            // for (const vol of volunteers) {
            //     if (!fbw.volunteers.includes(vol)) {
            //         fbw.volunteers.push(vol)
            //         foundWeek.totalVolunteers += 1
            //     }
            // }
        }// for each visit

        for (let mi = data.length - 1; mi >= 0; --mi) {
            const m = data[mi];
            for (let bi = m.branches.length - 1; bi >= 0; --bi) {
                const b = m.branches[bi];
                for (let wi = b.weeks.length - 1; wi >= 0; --wi) {
                    const w = b.weeks[wi];

                    switch (this.type) {

                        case ExportType.done: {
                            if (w.totalDelivered + w.totalVisited === w.totalTenants) {
                            }
                            else {
                                let i = b.weeks.indexOf(w)
                                b.weeks.splice(i, 1)
                                if (!b.weeks.length) {
                                    i = m.branches.indexOf(b)
                                    m.branches.splice(i, 1)
                                }
                            }
                            break;
                        }

                        case ExportType.doneAndNotDone: {
                            if (w.totalDelivered + w.totalVisited) { }
                            else {
                                let i = b.weeks.indexOf(w)
                                b.weeks.splice(i, 1)
                                if (!b.weeks.length) {
                                    i = m.branches.indexOf(b)
                                    m.branches.splice(i, 1)
                                }
                            }
                            break;
                        }

                        case ExportType.notDone: {
                            if (w.totalDelivered + w.totalVisited === 0) { }
                            else {
                                let i = b.weeks.indexOf(w)
                                b.weeks.splice(i, 1)
                                if (!b.weeks.length) {
                                    i = m.branches.indexOf(b)
                                    m.branches.splice(i, 1)
                                }
                            }
                            break;

                        }
                    }
                }

            }
        }

        weeksOrder.sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        for (const motic of weeksOrder) {
            motic.weeks.sort((a, b) => a.key.localeCompare(b.key))
        }

        // build totals
        for (const m of data) {
            for (const b of m.branches) {
                for (const w of b.weeks) {
                    let tw = totalWeek.find(ww => ww.week === w.week)
                    if (!tw) {
                        tw = { week: w.week, tt: 0, tvol: 0, td: 0, tv: 0, tpay: 0 }
                        totalWeek.push(tw)
                    }
                    tw.tt += w.totalTenants
                    tw.td += w.totalDelivered
                    tw.tv += w.totalVisited
                    tw.tvol += w.totalVolunteers
                    tw.tpay += w.totalPayment
                    // console.log('server:', `{ w.totalTenants: ${w.totalTenants} }`)
                }
            }
        }

        // build indexes
        let indexes = [] as { month: string, row: number, branches: { branch: string, row: number, weeks: { week: string, col: number, visits: number }[] }[] }[]
        let r = 0

        for (const m of data) {
            r += 2
            let fm = indexes.find(mm => mm.month === m.month)
            if (!fm) {
                fm = {
                    month: m.month,
                    row: r,
                    branches: [] as { branch: string, row: number, weeks: { week: string, col: number, visits: number }[] }[]
                }
                indexes.push(fm)
            }
            r += 2
            for (const b of m.branches) {
                r += 2
                let fb = fm.branches.find(bb => bb.branch === b.branch)
                if (!fb) {
                    fb = {
                        branch: b.branch,
                        row: r,
                        weeks: [] as { week: string, col: number, visits: number }[]
                    }
                    fm.branches.push(fb)
                }

                let maxVisits = 0
                let weeks = 0
                for (const w of b.weeks) {
                    let www = b.weeksCounter.indexOf(w.week)

                    let wwwww = weeksOrder.find(itm => itm.month === m.month)
                    let motiwwww = wwwww?.weeks.find(itm => itm.week === w.week)!
                    let motiindex = wwwww?.weeks.indexOf(motiwwww)!

                    let fw = fb.weeks.find(ww => ww.week === w.week)
                    if (!fw) {
                        fw = {
                            week: w.week,
                            col: motiindex * fieldsCount + 2,
                            visits: w.visits.length
                        }
                        fb.weeks.push(fw)
                    }

                    if (maxVisits < fw.visits) {
                        maxVisits = fw.visits
                    }

                }
                r += maxVisits
            }
        }

        for (const m of data) {
            m.branches.sort((a, b) => a.branch.localeCompare(b.branch))
            for (const b of m.branches) {
                for (const w of b.weeks) {
                    w.visits.sort((a, b) => a.tenant.localeCompare(b.tenant))
                }
            }
        }

        let aoa = [] as string[][]
        aoa[0] = [] as string[]
        aoa[0][0] = 'בס"ד'
        if (this.type !== ExportType.all) {
            aoa[0][2] = this.type.caption
        }

        // build table data+indexes
        let c = 0
        for (const m of data) {
            let fm = indexes.find(mm => mm.month === m.month)!
            if (!aoa[fm.row]) {
                aoa[fm.row] = [] as string[]
            }
            aoa[fm.row][0] = m.month
            if (!aoa[fm.row + 1]) {
                aoa[fm.row + 1] = [] as string[]
            }
            aoa[fm.row + 1][0] = 'כולל'
            if (!remult.user?.isManager) {
                if (!aoa[fm.row + 2]) {
                    aoa[fm.row + 2] = [] as string[]
                }

                aoa[fm.row + 2][0] = 'סה"כ' + ' ' + '(' + m.branches.length + ')'
                r = fm.row + 2
            }

            m.branches.sort((a, b) => a.branch.localeCompare(b.branch))

            for (const b of m.branches) {
                let fb = fm.branches.find(ww => ww.branch === b.branch)!
                if (!aoa[fb.row]) {
                    aoa[fb.row] = [] as string[]
                }
                aoa[fb.row][0] = b.branch

                for (const w of b.weeks) {
                    let fw = fb.weeks.find(ww => ww.week === w.week)!
                    aoa[fm.row][fw.col] = w.week
                    aoa[fm.row + 1][fw.col] = this.group.single
                    aoa[fm.row + 1][fw.col + 1] = 'ת.ז'
                    aoa[fm.row + 1][fw.col + 2] = 'איחרו'
                    aoa[fm.row + 1][fw.col + 3] = 'נוכחו'
                    aoa[fm.row + 1][fw.col + 4] = 'הערות'
                    if (remult.user?.isAdmin || remult.user?.isDonor) {
                        aoa[fm.row + 1][fw.col + 5] = 'מספר משלם'
                        aoa[fm.row + 1][fw.col + 6] = 'בנק'
                        aoa[fm.row + 1][fw.col + 7] = 'סניף'
                        aoa[fm.row + 1][fw.col + 8] = 'חשבון'
                        aoa[fm.row + 1][fw.col + 9] = 'תשלום'
                    }
                    let tw = totalWeek.find(tw => tw.week === w.week)
                    if (tw) {
                        if (!remult.user?.isManager) {
                            aoa[fm.row + 2][fw.col] = tw.tt.toString()
                            // aoa[fm.row + 2][fw.col + 1] = tw.tvol.toString()
                            aoa[fm.row + 2][fw.col + 2] = tw.td.toString()
                            aoa[fm.row + 2][fw.col + 3] = tw.tv.toString()
                            if (remult.user?.isAdmin || remult.user?.isDonor) {
                                aoa[fm.row + 2][fw.col + 9] = tw.tpay.toString()// סה"כ כל שבוע
                            }
                        }
                    }

                    aoa[fb.row][fw.col] = w.totalTenants.toString()
                    // console.log('server:', `{ w.totalTenants: ${w.totalTenants} }`)
                    // aoa[fb.row][fw.col + 1] = w.totalVolunteers.toString()
                    aoa[fb.row][fw.col + 2] = w.totalDelivered.toString()
                    aoa[fb.row][fw.col + 3] = w.totalVisited.toString()
                    if (remult.user?.isAdmin || remult.user?.isDonor) {
                        aoa[fb.row][fw.col + 9] = w.totalPayment.toString()// סה"כ כל כולל
                        // aoa[fb.row][fw.col + 6] = w.totalPayment.toString()// סה"כ כל כולל
                        // aoa[fb.row][fw.col + 7] = w.totalPayment.toString()// סה"כ כל כולל
                        // aoa[fb.row][fw.col + 8] = w.totalPayment.toString()// סה"כ כל כולל
                    }
                    let rr = fb.row
                    for (const v of w.visits) {
                        rr += 1
                        if (!aoa[rr]) {
                            aoa[rr] = [] as string[]
                        }
                        v.volunteers.sort((a, b) => a.localeCompare(b))
                        aoa[rr][fw.col] = v.tenant
                        aoa[rr][fw.col + 1] = v.tenantIdNumber
                        // aoa[rr][fw.col + 1] = v.volunteers.join(', ')
                        aoa[rr][fw.col + 2] = v.delivered
                        aoa[rr][fw.col + 3] = v.visited
                        aoa[rr][fw.col + 4] = v.tenantRemark
                        if (remult.user?.isAdmin || remult.user?.isDonor) {
                            aoa[rr][fw.col + 5] = v.paymentNumber + ''// סה"כ כל אברך
                            aoa[rr][fw.col + 6] = v.paymentBank + ''// סה"כ כל אברך
                            aoa[rr][fw.col + 7] = v.paymentBranch + ''// סה"כ כל אברך
                            aoa[rr][fw.col + 8] = v.paymentAccount + ''// סה"כ כל אברך
                            aoa[rr][fw.col + 9] = v.payment + ''// סה"כ כל אברך
                        }
                        // console.log('w.branch', b.branch, 'b.week', w.week, 'v.tenant', v.tenant, 'rr', rr, 'fw.row', fb.row, 'aoa.length', aoa.length)
                    }
                }
            }
        }

        return aoa
    }

}
