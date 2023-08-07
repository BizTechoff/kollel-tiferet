import { Allow, BackendMethod, Controller, ControllerBase, Fields } from "remult";
import { Branch } from "../branches/branch";
import { TenantVolunteer } from "./TenantVolunteer";
import { Tenant } from "./tenant";

@Controller('tenant-service')
export class TenantController extends ControllerBase {

    @Fields.string<TenantController>()
    id = ''

    @BackendMethod({ allowed: Allow.authenticated })
    async getTenants(active = true) {
        let tenants = await this.remult!.repo(Tenant).find({
            where: {
                active: active,
                branch: {
                    $id: (await this.remult!.repo(Branch).find({ where: { active: true, id: this.remult!.user!.branch } }))
                        .map(b => b.id)
                }
            },
            orderBy: { name: 'asc', address: 'asc' }
        })

        let volunteers = await this.remult!.repo(TenantVolunteer).find({
            where: {
                tenant: tenants//,
                // volunteer: (await remult.repo(UserBranch).find({ where: { branch: { $id: remult.user?.branch! } } }))
                //     .map(ub => ub.user)
            }
        })

        for (const t of tenants) {
            let found = volunteers.filter(tv => tv.tenant?.id === t.id)// && tv.volunteer.active === active)
            if (found) {
                t.volunteersNames =
                    found.sort((tv1, tv2) => tv1.volunteer?.name.localeCompare(tv2.volunteer?.name))
                        .map(tv => `${tv.volunteer?.name} - ${tv.volunteer?.mobile}`)
            }
        }
        return tenants
    }

    @BackendMethod({ allowed: Allow.authenticated })
    async getTenantById() {
        console.log('server',this.id)
        return await this.remult!.repo(Tenant).findId(this.id, { useCache: false })
        // let result!: Tenant
        // if (id?.trim().length) {
        //     result = await remult.repo(Tenant).findId(id, { useCache: false })
        //     if (result) {
        //         result.volunteers = (await remult.repo(TenantVolunteer).find({ where: { tenant: result } }))
        //             .map(r => r.volunteer)
        //     }
        // }
        // console.log('server:', result.$.id.metadata.caption)
        // return result
    }

}
