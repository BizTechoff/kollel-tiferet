import { ValueListFieldType } from "remult"

@ValueListFieldType<VisitStatus>({
    caption: 'סטטוס ביקור'
})
export class VisitStatus {
    static none = new VisitStatus('לא צוין', 'transparent', 'a-none')
    static visited = new VisitStatus('ביקרתי', 'orange', 'visited')
    static delayed = new VisitStatus('מסרתי', 'green', 'delayed')
    constructor(public caption = '', public color = '', public id = '') { }

    static presented = [VisitStatus.delayed.id, VisitStatus.visited.id]
}
