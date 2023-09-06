import { Entity, Field, Fields, IdEntity, isBackend, remult } from "remult";
import { Branch } from "../branches/branch";
import { User } from "./user";

@Entity<UserBranch>('users_branches', {
    caption: 'כוללים של אברך',
    allowApiCrud: () => remult.authenticated(),
    saving: (row) => {
        if (isBackend()) {
            if (row._.isNew()) {
                row.created = new Date()
                row.createdby = remult.user?.id!
            }
            else {
                row.modified = new Date()
                row.modifiedby = remult.user?.id!
            }
        }
    }
})
export class UserBranch extends IdEntity {

    @Field<UserBranch, Branch>(() => Branch, {
        caption: 'כולל'
    })
    branch!: Branch

    @Field<UserBranch, User>(() => User, {
        caption: 'משתמש',
        dbName: 'user_'
    })
    user!: User

    @Fields.date<UserBranch>({
        allowApiUpdate: false
    })
    created = new Date();

    @Fields.date<UserBranch>({
        allowApiUpdate: false
    })
    modified = new Date();

    @Fields.uuid<UserBranch>({
        allowApiUpdate: false
    })
    createdby = ''

    @Fields.uuid<UserBranch>({
        allowApiUpdate: false
    })
    modifiedby = ''

}
