import { isBackend } from "remult"

export class DayOfWeek {
    static sunday = new DayOfWeek('ראשון', 0)
    static monday = new DayOfWeek('שני', 1)
    static tuesday = new DayOfWeek('שלישי', 2)
    static wednesday = new DayOfWeek('רביעי', 3)
    static thursday = new DayOfWeek('חמישי', 4)
    static friday = new DayOfWeek('שישי', 5)
    static saturday = new DayOfWeek('שבת', 6)
    constructor(public caption = '', public value = 0) { }
    static getValueOf(dow: DayOfWeek) {
        return dow.value
    }
    static getCaptionOf(dow: DayOfWeek) {
        return dow.caption
    }
}

export const mabatView = ['daily', 'weekly', 'monthly', 'once'] as string[]
export const visitDays = [
    DayOfWeek.sunday,
    DayOfWeek.monday,
    DayOfWeek.tuesday,
    DayOfWeek.wednesday,
    DayOfWeek.thursday
]
export const dayOfCreatingVisits = visitDays[0]
export const dayOfHomeVisits = DayOfWeek.thursday
export const selectedMabatView = mabatView[0]

export const getDates = (date: Date) => {
    if (selectedMabatView.includes('daily')) {
        // dayOfCreatingVisits.ignore()
        // dayOfHomeVisits.ignore()
        for (const day of visitDays) {
            // ...
        }
    }
    else if (selectedMabatView.includes('weekly')) {
        dayOfCreatingVisits
        dayOfHomeVisits
    }
    else if (selectedMabatView.includes('monthly')) {
        // dayOfCreatingVisits = firstDateOfMonth(date)
        // dayOfHomeVisits.ignore()
        for (const day of visitDays) {
            // ...
        }
    }
}

export function firstDateOfWeek(date: Date, monthly = false) {
    date = resetDateTime(date)
    // console.log('firstDateOfWeek1',date.toDateString())
    for (let i = 0; i < 7; ++i) {
        let day = date.getDay()
        if (monthly) {
            let dateDay = date.getDate()
            if (dateDay === 1) {
                break
            }
        }
        if (day === dayOfCreatingVisits.value) {
            break
        }
        date = resetDateTime(new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() - 1));
    }
    // console.log('firstDateOfWeek2',date.toDateString())
    return date
}

export function lastDateOfWeek(date: Date, monthly = false) {
    // console.log('date0', date)
    date = resetDateTime(date)
    // console.log('date1', date)
    date = firstDateOfWeek(date, monthly)
    // console.log('date2', date)
    let day = date.getDay()
    let days = date.getDate() + 7 - 1 - day
    // console.log('days', days)
    if (monthly) {
        // console.log('monthly')
        var lastMonthDate = lastDateOfMonth(date)
        days = Math.min(days, lastMonthDate.getDate())
        // console.log('days', days)
    }
    date = resetDateTime(new Date(
        date.getFullYear(),
        date.getMonth(),
        days));
    // console.log('date3', date)
    // if (monthly) {
    //     console.log('monthly')
    //     var lastMonthDate = lastDateOfMonth(date)
    //     if (date > lastMonthDate) {
    //         date = lastMonthDate
    //         console.log('date4', date)
    //     }
    // }
    return date
}

export function firstDateOfWeekByHomeVisit(date: Date) {
    date = resetDateTime(date)
    let day = date.getDay()
    if (day < dayOfHomeVisits.value) {
        date = resetDateTime(new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() - day));
    }
    return firstDateOfWeek(date)
}

export function firstDateOfMonth(date: Date) {
    return resetDateTime(new Date(
        date.getFullYear(),
        date.getMonth(),
        1));
}

export function lastDateOfMonth(date: Date) {
    let first = firstDateOfMonth(date)
    let next = resetDateTime(new Date(
        first.getFullYear(),
        first.getMonth() + 1,
        1));
    return resetDateTime(new Date(
        next.getFullYear(),
        next.getMonth(),
        next.getDate() - 1));
}

export function dateFormat(date: Date, delimiter = '/') {
    let result = ''
    if (date) {
        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        result += ('00' + day).slice(-2)
        result += delimiter
        result += ('00' + month).slice(-2)
        result += delimiter
        result += year
    }
    return result
}

export function calculateDiff(data1: Date, date2: Date) {
    let days = Math.floor((data1.getTime() - date2.getTime()) / 1000 / 60 / 60 / 24);
    return days;
}

export function dateEquals(date1: Date, date2: Date) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
}

export function monthOfYear(data: Date) {
    return data.getMonth() + 1
}

export function weekOfYear(data: Date) {
    let startDate = new Date(data.getFullYear(), 0, 1);
    var days = calculateDiff(data, startDate)
    return Math.ceil(days / 7);
}

export function dayOfMonth(data: Date) {
    return data.getDate()
}


export function resetDateTime(date = new Date(), days = 0) {
    if (!date) {
        // console.log('resetDateTime date = NULL !! ')
        date = new Date()
    }
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + days,
        0,
        isBackend() ? date.getTimezoneOffset() * -1 : 0,
        0);
}

export function dateDiff(d1: Date, d2: Date, abs = true) {

    let timeDifference = d1.getTime() - d2.getTime();
    if (abs) {
        timeDifference = Math.abs(timeDifference)
    }
    let differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return differentDays
}

export function addDaysToDate(date: Date, days = 0) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
    // var result = new Date()
    // if (date) {
    //     result = date
    // }
    // if (days) {
    //     result.setDate(
    //         result.getDate() + days);
    // }
    // return result
}
