// import { remult } from "remult"
import { config } from "dotenv"
import { remult } from "remult"
import { Branch } from "../app/branches/branch"
import { dateEquals, dateFormat, dayOfCreatingVisits, dayOfMonth, DayOfWeek, firstDateOfMonth, firstDateOfWeek, firstDateOfWeekByHomeVisit, lastDateOfMonth, lastDateOfWeek, monthOfYear, resetDateTime } from "../app/common/dateFunc"
import { isValidMobile } from "../app/common/mobileFunc"
import { Job } from "../app/jobs/job"
import { JosStatus } from "../app/jobs/jobStatus"
import { Notification } from "../app/notifications/notification"
import { NotificationStatus } from "../app/notifications/notificationStatus"
import { Tenant } from "../app/tenants/tenant"
import { User } from "../app/users/user"
import { UserBranch } from "../app/users/userBranch"
import { Visit } from "../app/visits/visit"
import { VisitVolunteer } from "../app/visits/visit-volunteer"
import { VisitStatus } from "../app/visits/visitStatus"
import { api } from "./api"
import { SmsService } from "./sms"

config()

/*
todo:
week-key: 'dd.MM.yyyy-dd.MM.yyyy'
group by weeks-keys
last-sent
*/

let isProduction = (process.env['NODE_ENV'] ?? '') === 'production'
console.log('isProduction: ', isProduction)

export const runEveryFullHours = async () => {
    if (isProduction) {
        const Hour = 60 * 60 * 1000;
        const currentDate = new Date()
        const firstCall = Hour - (currentDate.getMinutes() * 60 + currentDate.getSeconds()) * 1000 - currentDate.getMilliseconds();
        console.log(`jobsRun will start in: ${('00' + new Date(firstCall).getMinutes()).slice(-2)}:${('00' + new Date(firstCall).getSeconds()).slice(-2)} min`)
        setTimeout(async () => {
            await api.withRemult(undefined!, undefined!, async () => await jobsRun());
            setInterval(async () => await api.withRemult(undefined!, undefined!, async () => await jobsRun()), Hour);
        }, firstCall);
    }
    else {
        // await api.withRemult(undefined!, undefined!, async () => await createDailyVisits());
        // await api.withRemult(undefined!, undefined!, async () => await q());
    }
    // const Hour = 60 * 60 * 1000;
    // const currentDate = new Date()
    // const firstCall = Hour - (currentDate.getMinutes() * 60 + currentDate.getSeconds()) * 1000 - currentDate.getMilliseconds();
    // console.log(`jobsRun will start in: ${('00' + new Date(firstCall).getMinutes()).slice(-2)}:${('00' + new Date(firstCall).getSeconds()).slice(-2)} min`)
    // setTimeout(() => {
    //     api.withRemult(undefined!, undefined!, () => jobsRun());
    //     setInterval(() => api.withRemult(undefined!, undefined!, () => jobsRun()), Hour);
    // }, firstCall);
    // api.withRemult(undefined!, undefined!, async () => await jobsRun())
};

const q = async () => {


    var lines = [] as string[]

    lines.push('כהן פסח|31695456|111|400|ירושלים - כולל ערב')
    lines.push('סטסקוביץ ביניס|323207852|118|300|ירושלים - כולל ערב')
    lines.push('סנדומירסקי משה|308729235|119|200|ירושלים - כולל ערב')
    lines.push('קגן חיים|314376526|123|2000|ירושלים - כולל ערב')
    lines.push('וולקוב חיים|309790400|185|100|ירושלים - כולל ערב')
    lines.push('בלקין גיל|30944580|188|1840|ירושלים - כולל ערב')
    lines.push('כפר אלכסנדר|309965952|202|300|ירושלים - כולל ערב')
    lines.push('חייט מאיר|305881732|208|120|ירושלים - כולל ערב')
    lines.push('זסלבסקי אפרים|301764744|209|300|ירושלים - כולל ערב')
    lines.push('פדורובסקי אלכסנדר||367|800|ירושלים - כולל ערב')
    lines.push('קוזלובסקי דב|11570793|452|400|ירושלים - כולל ערב')
    lines.push('מוגילובסקי ברוך|306097015|471|300|ירושלים - כולל ערב')
    lines.push('וילנציק גיל|315770321|557|160|ירושלים - כולל ערב')
    lines.push('אורבוך יצחק|15784895|586|400|ירושלים - כולל ערב')
    lines.push('מיאסקובסקי צבי|320965692|655|80|ירושלים - כולל ערב')
    lines.push('ריזקוב דן|20219630|880|300|ירושלים - כולל ערב')
    lines.push('סופוטוב יורי|310161971|902|300|ירושלים - כולל ערב')
    lines.push('גורדין יצחק|306290735|928|200|ירושלים - כולל ערב')
    lines.push('בורטניק לוי|304387137|1019|320|ירושלים - כולל ערב')
    lines.push('זכוב יוסף|342488426|1059|80|ירושלים - כולל ערב')
    lines.push('מריאין מויסיי|323559690|1060|300|ירושלים - כולל ערב')
    lines.push('קיש יוסף יצחק|319308227|1061|200|ירושלים - כולל ערב')
    lines.push('ארנופולין יצחק|342453172|1076|100|ירושלים - כולל ערב')
    lines.push('טרנטייב סרגיי|336199419|1079|100|ירושלים - כולל ערב')
    lines.push('שוורץ חיים יפים|307706176|1085|500|ירושלים - כולל ערב')
    lines.push('שכרוף מיכאל|316791573|1086|400|ירושלים - כולל ערב')
    lines.push('נוז\'דין דוד דמיטרי|345351126|1131|100|ירושלים - כולל ערב')
    lines.push('ניסלביץ חיים|14149827|1132|1250|ירושלים - כולל ערב')
    lines.push('רוגובוי אברהם יוסף|332645225|1214|800|ירושלים - כולל ערב')
    lines.push('כגן מרדכי|15939507|1217|500|ירושלים - כולל ערב')
    lines.push('רסקין|305807521|1259|1050|ירושלים - כולל ערב')
    lines.push('קויפמן מיכאל|306662388|1262|200|ירושלים - כולל ערב')
    lines.push('שרמן שרמן דוד|316713551|1347|200|ירושלים - כולל ערב')
    lines.push('פישלביץ לאוניד|327240192|606|100|ירושלים - בוקר גברים')
    lines.push('ברזין בוריס|320741515|920|100|ירושלים - בוקר גברים')
    lines.push('אופוקין יורי|337818254|991|100|ירושלים - בוקר גברים')
    lines.push('רוז\'דוב ויקטור|338092216|1002|100|ירושלים - בוקר גברים')
    lines.push('קונקין דמיטרי|310382403|1050|100|ירושלים - בוקר גברים')
    lines.push('זברסקי פרידה|303970693|389|100|ירושלים בוקר - נשים')
    lines.push('טורסונובה מירה|323479378|517|100|ירושלים בוקר - נשים')
    lines.push('קורס סופיה|206327602|607|100|ירושלים בוקר - נשים')
    lines.push('בוים אנה|307584615|898|100|ירושלים בוקר - נשים')
    lines.push('ברבש איזבלה|311024756|1130|100|ירושלים בוקר - נשים')
    lines.push('סברנסקי ולנטינה|321771255|1133|100|ירושלים בוקר - נשים')
    lines.push('מייזניץ ורה|309041093|1254|100|ירושלים בוקר - נשים')
    lines.push('חסמנוב אדוארד|323348359|220|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('בודיק יוסף|321379554|225|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('גוטקין לייב|312794118|228|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('שולקין סמואיל|321207771|253|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('דיסקין אליה|321888547|277|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('באק ולדימיר|307181735|566|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('יעקובוב ארקדי|306479791|587|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('גלייזר סרגי|307269506|632|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('מקובסקי דמיטרי|303482343|860|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('זקריז\'בסקי איגור|317986040|870|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('ניר אליעזר|310786744|872|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('פולונסקי גנדי|303642532|874|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('אבנשטיין דן|310273966|876|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('מזלר אלכסנדר|309249563|877|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('גוטמן מרט|313012098|879|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('גלון נין|310776968|890|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('סרקיץ אנטון|319368783|896|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('ורלינסקי מריק|321245573|925|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('לפסקר מריק|332422450|931|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('לפסקר דניס|332422427|932|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('ליובוב יורי|337972525|985|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('ניר צבי|16622508|995|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('ציגנקוב ולרי|337972533|1001|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('אוסולצב ולדימיר|341021236|1035|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('ליבוב תמיר|337972541|1039|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('שאולוב סמיון|311679674|1043|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('צ\'יטאבה אינגור|316661487|1054|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('סיניצקי מיכאל|341195741|1064|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('טקצ\'ב סרגי|334055084|1091|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('נורמנוב רוסטם|328664677|1092|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('מנינה ליודמיל|340959592|1152|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('קרולי אנטולי|345291348|1155|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('בזל שרון|320579618|1160|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('מלכה יעקב|342597093|1169|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('זבשטנסקי אברהם|320758147|1247|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('קורסקוב|324645266|1303|180|כולל תפארת לוי יצחק אשדוד')
    lines.push('לוסקין בוריס|324332014|237|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('סולודובקין יפים|323374371|263|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('טלר מיכאל|321868028|539|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('דירקטור אלכס|305866246|550|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('מלמד מרק|323223313|554|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('רחלין מויסיי|312993587|578|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('סרחל סימון|308711787|630|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('אוסדצ\'י אייזיק|31106270|650|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('חלופיצקי ארנסט|319648150|675|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('קרוגמן ולדימיר|31440654|680|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('פרציבר ויאצסלב|319215836|822|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('דוידסון מרק|319501854|861|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('זלטקין ישראל|312815293|862|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('סטריק מיכאל|319210993|888|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('קרברוב יורי|320566607|889|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('גורליק יפים|307107771|891|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('נוביק יורי|324591072|892|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('מז\'בינסקי דניאל|317247229|893|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('קוז\'חור גריגורי|326950375|895|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('אפשטיין מיכאל|307162644|919|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('לוין מיכאל|316786540|948|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('ברוקליץ\' גנאדי|337951149|950|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('לנקרוביץ\' מיכאל|310569637|965|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('פלדמן באטי|308678903|967|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('מלינצ\'ב מריק|319197935|969|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('ויינרוך רומן|316952837|975|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('בטאשוילי יצחק|14342141|978|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('ברמוביץ\' לב|332532522|980|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('אבזוב אסר|328652896|981|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('אבזוב יוחאי|307076224|982|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('דז\'אנשוילי נין|332285188|983|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('מרצינקביץ\' וולנטין|320708555|986|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('קוצ\'ין ז\'אן|307164343|987|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('גורביץ לאוניד|316831650|989|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('חבקין נתן|65487322|992|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('חבקין עדו|10211357|993|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('נובל ארקדי|340963396|994|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('שטיינברג לאוניד|307572057|1018|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('וולוביק לאוניד|324384874|1024|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('ריז\'יק איגור|311826937|1032|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('פורמנוב ולדימיר|304058696|1046|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('ארליך סרגיי|311662811|1051|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('פרסטנוב סמאול|304151525|1053|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('צ\'רניאק ולדימיר|317357523|1057|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('לוין אלון|314243205|1164|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('קניאז\'בסקי ולדימיר|345133243|1170|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('צ\'גירינסקי צ\'גירינסקי יבגני|345417836|1244|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('שפירא בוריס|307452680|1245|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('פיוטר פרנס|317578045|1246|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('רייבסקי רוני|337853030|1248|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('לוין יגור|314243098|1063|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('פייגין|346231384|1261|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('סורוקין|345865570|1302|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('גולובנסקי מיכאל|314215278|1304|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('ריטנמן ליאון|311058713|1305|80|כולל תפארת לוי יצחק אשקלון')
    lines.push('בבון בוריס|312854060|585|200|כולל תפארת לוי יצחק צפת ')
    lines.push('בירברובר לאוניד|311813760|937|200|כולל תפארת לוי יצחק צפת ')
    lines.push('רפפורט מיכאל|303832869|972|200|כולל תפארת לוי יצחק צפת ')
    lines.push('גריגורייב יבגני|313875874|974|200|כולל תפארת לוי יצחק צפת ')
    lines.push('פוגרבצקי נאום|341140192|1022|200|כולל תפארת לוי יצחק צפת ')
    lines.push('מאירסון אולג|308617463|1023|200|כולל תפארת לוי יצחק צפת ')
    lines.push('גולמן רפאל|305963704|1239|200|כולל תפארת לוי יצחק צפת ')
    lines.push('אומנסקי פטר|345267660|1172|120|כולל תפארת לוי יצחק - חיפה ')
    lines.push('בורשטיין שאול|329064422|1176|400|כולל תפארת לוי יצחק - חיפה ')
    lines.push('גולדמן אלכסנדר|317168532|1178|120|כולל תפארת לוי יצחק - חיפה ')
    lines.push('גולדן דב בר|341195329|1180|120|כולל תפארת לוי יצחק - חיפה ')
    lines.push('מיל ישי|328720362|1188|120|כולל תפארת לוי יצחק - חיפה ')
    lines.push('ריבלסקי חיים יפים|309055820|1203|120|כולל תפארת לוי יצחק - חיפה ')
    lines.push('שפירו אליהו|305856155|1209|120|כולל תפארת לוי יצחק - חיפה ')
    lines.push('אלפרין איליה|316691716|1174|800|כולל תפארת לוי יצחק נוף הגליל')
    lines.push('ביברמן אנטולי|320618812|1177|260|כולל תפארת לוי יצחק נוף הגליל')
    lines.push('מילנר איליה|329019384|1189|260|כולל תפארת לוי יצחק נוף הגליל')
    lines.push('סלומיאניקוב ולדימיר|322168774|1195|260|כולל תפארת לוי יצחק נוף הגליל')
    lines.push('שולקלפר מיכאל|309318640|1207|260|כולל תפארת לוי יצחק נוף הגליל')
    lines.push('אברמוביץ אתל|306901760|883|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('טננבאום יעקב|303906754|1067|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('מיסטל אייזיק|341278588|1068|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('קוט אברהם|92072|1070|500|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('רבינסקי חיים יפים|307175240|1071|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('שופס יוסף|332754332|1073|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('ברדון פבל שמחה|337678486|1077|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('קליימן פולינה|321879157|1157|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('סימאי משה|303873897|1165|100|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('ליבנשטיין אליהו|304302896|1216|200|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('סופר יואל|1008416|1238|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('מלייחי מלייחי סלאם|10505675|1241|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('פרלמן דוד|321715534|1257|300|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('ראייר|304093685|1301|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('שליו מנחם|56576903|1348|130|כולל תפארת לוי יצחק פסגת זאב')
    lines.push('יצחק שניאור|609720156|1354|3300|כולל תפארת לוי יצחק גבעת מרדכי')
    lines.push('שמואל מישולובין|206845463|1358|400|כולל תפארת לוי יצחק רמת אביב')
    lines.push('יהודה ליפש|200517142|1359|400|כולל תפארת לוי יצחק רמת אביב')
    lines.push('יצחק ירדני|55967558|1361|130|כולל תפארת לוי יצחק רמת אביב')
    lines.push('אורן יעקב ברקן|29365038|1362|130|כולל תפארת לוי יצחק רמת אביב')
    lines.push('משה מושקוביץ|51757490|1363|130|כולל תפארת לוי יצחק רמת אביב')
    lines.push('שלומי לוי|22142954|1364|130|כולל תפארת לוי יצחק רמת אביב')
    lines.push('אליהו כהן|53644233|1365|130|כולל תפארת לוי יצחק רמת אביב')
    lines.push('אהרון אקוקה|12212353|1366|130|כולל תפארת לוי יצחק רמת אביב')

    const tenants = [] as Tenant[]
    for (const l of lines) {
        var split = l.split('|')
        var t = remult.repo(Tenant).create()
        t.name = split[0].trim()
        t.idNumber = split[1].trim()
        t.payNumber = split[2].trim()
        t.payment = parseInt(split[3].trim())

        var branchName = split[4] //.trim()
        const b = await remult.repo(Branch).findFirst({ name: branchName })
        if (b) {
            t.branch = b
            tenants.push(t)
        }
        else {
            console.error('no branch name: ' + branchName)
        }
    }

    console.log('tenants.length', tenants.length)

    await remult.repo(Tenant).insert(tenants)
}

const jobsRun = async () => {


    console.info('isProduction', isProduction)
    let now = new Date()
    console.log(`jobsRun exec at: ${now}`)

    if (!isProduction) {

        // now.setDate(now.getDate() + 2)
        // now.setHours(3)
        // await createWeeklyVisits()
        // console.log('process.env.TZ',process.env['TZ'])
        // await createVolunteerFourWeeksDelayed()
        // await createTenantTwoWeeksMissing()
        // await createVolunteerTwoWeeksMissing()
        // await sendNotifications()
    }

    if (isProduction) {

        // await createVolunteerThreeWeeksMissing()
        // let enableAllJobs = (process.env['JOBS_ENABLE_ALL'] ?? 'false') === 'true'

        // if (now.getDate() === 1) {
        //     // now is the last month + 1 
        //     console.log(`jobsRun today is: lastDateOfMonth + 1`)

        //     if (enableAllJobs) {
        //         let hour = now.getHours()
        //         if (hour >= 3 && hour <= 4)//3am
        //         {
        //             await createMonthlyReport()
        //         }
        //     }
        // }

        switch (now.getDay()) {

            // case DayOfWeek.sunday.value: {
            //     console.log(`jobsRun today is: ${DayOfWeek.sunday.caption}`)
            //     if (enableAllJobs) {
            //         let hour = now.getHours()
            //         if (hour >= 3 && hour <= 4)//3am
            //         {
            //             await createTenantThisWeekBirthday()// to manager
            //         }
            //     }
            //     else {
            //         console.log(`jobsRun enableAllJobs = '${enableAllJobs}'`)
            //     }
            //     break;
            // }

            case DayOfWeek.sunday.value:
            case DayOfWeek.monday.value:
            case DayOfWeek.tuesday.value:
            case DayOfWeek.wednesday.value:
            case DayOfWeek.thursday.value: {
                let hour = now.getHours()
                if (hour >= 3 && hour <= 4)//3am
                {
                    await createDailyVisits()
                    // if (enableAllJobs) {
                    //     await createTenantTwoWeeksMissing()// to manager
                    //     await createVolunteerTwoWeeksMissing()// to volunteer
                    //     await createVolunteerThreeWeeksMissing()// to manager
                    //     await createVolunteerFourWeeksDelayed()// to volunteer
                    // }
                    // else {
                    //     console.log(`jobsRun enableAllJobs = '${enableAllJobs}'`)
                    // }
                }
                break
            }

            // case DayOfWeek.thursday.value: {
            //     console.log(`jobsRun today is: ${DayOfWeek.thursday.caption}`)
            //     let hour = now.getHours()
            //     if (hour >= 3 && hour <= 4)//3am
            //     {
            //         await createManagerTodayIsThursday()
            //     }
            //     if (hour >= 21 && hour <= 22)//pm
            //     {
            //         await createManagerThursdayMissingFeedback()
            //     }
            //     break;
            // }

            // case DayOfWeek.saturday.value: {
            //     console.log(`jobsRun today is: ${DayOfWeek.saturday.caption}`)
            //     let hour = now.getHours()
            //     if (hour >= 21 && hour <= 22)//pm
            //     {
            //         await createManagerSaturdayMissingReport()
            //     }
            // }

        }

        // await sendNotifications()
    }
}

async function createManagerTodayIsThursday() {

    let today = resetDateTime(new Date())
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createManagerTodayIsThursday',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createManagerTodayIsThursday' already done`)
        return
    }

    try {
        for await (const branch of remult.repo(Branch).query({
            where: { system: false, active: true } //, name: 'בדיקות' }
        })) {
            for await (const user of remult.repo(User).query({
                where: {
                    manager: true,
                    active: true,
                    id: ((await remult.repo(UserBranch).find({
                        where: { branch: branch }
                    })).map(ub => ub.user.id))
                }
            })) {
                let message = `בוקר אור! היום יום חמישי!
בהצלחה בדווח 🙂
פרויקט ההתנדבות גט חסד`
                await addNotification({
                    date: today,
                    time: '10:00',
                    user: user.id,
                    mobile: user.mobile,
                    message: message
                })
            }
        }
        await logJob(today, 'createManagerTodayIsThursday', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createManagerTodayIsThursday', JosStatus.error, JSON.stringify(error))
    }

}

async function createManagerThursdayMissingFeedback() {

    let today = resetDateTime(new Date())
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createManagerThursdayMissingReport',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createManagerThursdayMissingReport' already done`)
        return
    }

    try {
        let message = ''
        for await (const branch of remult.repo(Branch).query({
            where: { system: false, active: true } //, name: 'בדיקות' }
        })) {
            let counter = await remult.repo(Visit).count({
                branch: branch,
                date: { // 3w-ago
                    "$gte": fdate,
                    "$lte": tdate
                },
                volunteerWeeklyAnswer: ''
                // status: { '$ne': VisitStatus.none }
            })
            if (counter > 0) {
                for await (const user of remult.repo(User).query({
                    where: {
                        manager: true, active: true,
                        id: ((await remult.repo(UserBranch).find(
                            { where: { branch: branch } }))
                            .map(ub => ub.user.id))
                    }
                })) {
                    message =
                        `המערכת מחכה לתגובתך
פרוייקט ההתנדבות גט חסד`
                    await addNotification({
                        date: today,
                        time: '',//immediate
                        user: user.id,
                        mobile: user.mobile,
                        message: message
                    })
                }
            }
        }
        await logJob(today, 'createManagerThursdayMissingReport', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createManagerThursdayMissingReport', JosStatus.error, JSON.stringify(error))
    }
}

async function createManagerSaturdayMissingReport() {

    let today = resetDateTime(new Date())
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createManagerSaturdayMissingReport',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createManagerSaturdayMissingReport' already done`)
        return
    }

    try {
        let message = ''
        for await (const branch of remult.repo(Branch).query({
            where: { system: false, active: true }// , name: 'בדיקות' }
        })) {
            let counter = await remult.repo(Visit).count({
                branch: branch,
                date: {
                    "$gte": fdate,
                    "$lte": tdate
                },
                status: VisitStatus.none
            })
            if (counter > 0) {
                for await (const user of remult.repo(User).query({
                    where: {
                        manager: true, active: true,
                        id: ((await remult.repo(UserBranch).find(
                            { where: { branch: branch } }))
                            .map(ub => ub.user.id))
                    }
                })) {
                    message =
                        `שבוע טוב ${user?.firstName},
טרם סיימת לדווח במערכת
פרוייקט ההתנדבות גט חסד`
                    await addNotification({
                        date: today,
                        time: '',//immediate
                        user: user.id,
                        mobile: user.mobile,
                        message: message
                    })
                    // console.log(user.mobile )//, message)
                }
            }
        }
        await logJob(today, 'createManagerSaturdayMissingReport', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createManagerSaturdayMissingReport', JosStatus.error, JSON.stringify(error))
    }
}

async function createTenantThisWeekBirthday() {

    let today = resetDateTime(new Date())
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createTenantThisWeekBirthday',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createTenantThisWeekBirthday' already done`)
        return
    }

    await logJob(today, 'createTenantThisWeekBirthday', JosStatus.processing, '')
    console.log(`createTenantThisWeekBirthday..`)

    let message = ''
    try {
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true } })) {
            message = ''
            let counter = 0
            for await (const tenant of remult.repo(Tenant).query({
                where: {
                    branch: branch,
                    monthBirthday: monthOfYear(today),
                    dayBirthday: {
                        '$gte': dayOfMonth(fdate),
                        '$lte': dayOfMonth(tdate)
                    }
                },
                orderBy: { branch: "asc", birthday: "desc", name: 'asc' }
            })) {
                if (message.length) {
                    message += ', '
                }
                message += `${tenant.name} בתאריך ${dateFormat(tenant.birthday)}`
                ++counter
            }

            if (counter > 0) {
                for await (const user of remult.repo(User).query({
                    where: {
                        manager: true, active: true,
                        id: ((await remult.repo(UserBranch).find(
                            { where: { branch: branch } }))
                            .map(ub => ub.user.id))
                    }
                })) {
                    message =
                        `לידיעתך! השבוע חל יום ${counter > 1 ? 'הולדתם' : 'הולדתו'} של
${message}
אנא תאמ/י חגיגה עם המתנדבים.
פרוייקט ההתנדבות גט חסד`

                    await addNotification({
                        date: today,
                        time: '10:00',
                        user: user.id,
                        mobile: user.mobile,
                        message: message
                    })
                    // console.log(branch.name, branch.id, user.id, user.name, user.mobile)//, message)
                }
            }
        }
        await logJob(today, 'createTenantThisWeekBirthday', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createTenantThisWeekBirthday', JosStatus.error, JSON.stringify(error))
    }
}

async function createVolunteerThreeWeeksMissing() {
    let today = resetDateTime(new Date())//s2023, 0, 30)
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createVolunteerThreeWeeksMissing',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createVolunteerThreeWeeksMissing' already done`)
        return
    }

    await logJob(today, 'createVolunteerThreeWeeksMissing', JosStatus.processing, '')
    console.log(`createVolunteerThreeWeeksMissing..`)

    let numOfWeeks = 3
    let threeWeeksAgo = firstDateOfWeekByHomeVisit(today)
    let last = lastDateOfWeek(threeWeeksAgo)
    threeWeeksAgo = resetDateTime(last, -(numOfWeeks * 7 - dayOfCreatingVisits.value + 1))
    console.log(threeWeeksAgo, '<-> ', last)

    try {
        let sent = [] as string[]
        let counter = 0
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true }, orderBy: { name: 'asc' } })) {
            let message = ''
            let bCounter = 0
            for await (const volunteer of remult.repo(User).query({
                where: {
                    volunteer: true,
                    active: true,
                    id: (await remult.repo(UserBranch).find({
                        where: {
                            branch: branch,
                            user: {
                                $id: {
                                    $ne: (await remult.repo(VisitVolunteer).find({
                                        where: {//all done visits
                                            visit: {
                                                $id: (await remult.repo(Visit).find({
                                                    where: {
                                                        branch: branch,
                                                        date: { // 3w-ago
                                                            "$gte": threeWeeksAgo,
                                                            "$lte": last
                                                        },
                                                        status: { $ne: VisitStatus.none }//done
                                                    }
                                                })).map(v => v.id)
                                            }
                                        }
                                    })).map(ub => ub.volunteer.id)
                                }
                            }
                        }
                    })).map(ub => ub.user.id)
                }
            })) {
                // send only once for volunteer on more then one branch
                if (!sent.includes(volunteer.id)) {
                    sent.push(volunteer.id)
                    if (message.length) {
                        message += '\n'
                    }
                    message += `${volunteer.name}-${volunteer.mobile}`
                    ++bCounter
                }
            }
            if (bCounter > 0) {
                for await (const manager of remult.repo(User).query({
                    where: {
                        manager: true, active: true,
                        id: ((await remult.repo(UserBranch).find(
                            { where: { branch: branch } }))
                            .map(ub => ub.user.id))
                    }
                })) {
                    message = `${message}
${bCounter > 1 ? 'נעדרו' : 'נעדר'} מההתנדבות כבר 3 פעמים
אנא צור ${bCounter > 1 ? 'איתם' : 'איתו'} קשר
פרוייקט ההתנדבות גט חסד`

                    console.log(message.length, '::', message)
                    // await addNotification({
                    //     date: today,
                    //     time: '10:00', 
                    //     user: manager.id,
                    //     mobile: manager.mobile,
                    //     message: message
                    // })
                    ++counter
                }
            }
        }
        await logJob(today, 'createVolunteerThreeWeeksMissing', JosStatus.done, '')
        console.log(`createVolunteerThreeWeeksMissing created ${counter} notificaions.`)
    }
    catch (error) {
        await logJob(today, 'createVolunteerThreeWeeksMissing', JosStatus.error, JSON.stringify(error))
    }
}

async function createTenantTwoWeeksMissing() {

    let today = resetDateTime(new Date())//s2023, 0, 30)
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createTenantTwoWeeksMissing',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createTenantTwoWeeksMissing' already done`)
        return
    }

    await logJob(today, 'createTenantTwoWeeksMissing', JosStatus.processing, '')
    console.log(`createTenantTwoWeeksMissing..`)

    let numOfWeeks = 2
    let twoWeeksAgo = firstDateOfWeekByHomeVisit(today)
    let last = lastDateOfWeek(twoWeeksAgo)
    twoWeeksAgo = resetDateTime(last, -(numOfWeeks * 7 - dayOfCreatingVisits.value + 1))
    console.log(twoWeeksAgo, '<-> ', last)

    try {
        let sent = 0
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true }, orderBy: { name: 'asc' } })) {
            let message = ''
            let counter = 0
            for await (const tenant of remult.repo(Tenant).query({
                where: {
                    branch: branch,
                    active: true,
                    id: {
                        $ne: (await remult.repo(Visit).find({
                            where: {
                                branch: branch,
                                date: { // 3w-ago
                                    "$gte": twoWeeksAgo,
                                    "$lte": last
                                },
                                status: { $ne: VisitStatus.none }//done
                            }
                        })).map(v => v.tenant.id)
                    }
                }
            })) {
                if (message.length) {
                    message += '\n'
                }
                message += `${tenant.name}`
                ++counter
            }
            if (counter > 0) {
                for await (const manager of remult.repo(User).query({
                    where: {
                        manager: true,
                        active: true,
                        id: ((await remult.repo(UserBranch).find(
                            { where: { branch: branch } }))
                            .map(ub => ub.user.id))
                    }
                })) {
                    message =
                        `${message}
כבר שבועיים ${counter > 1 ? 'שהם' : 'שהוא'} לבד ${counter > 1 ? 'ומחכים' : 'ומחכה'} לביקור,
אנא בדוק עם המתנדבים!
 גט חסד של חבד לנוער`
                    // await addNotification({
                    //     date: today,
                    //     time: '10:00',
                    //     user: user.id,
                    //     mobile: user.mobile,
                    //     message: message
                    // })
                    ++sent
                    console.log(branch.name, '::', message)
                    //  branch.id, manager.id, manager.name, manager.mobile)//, message)
                }
            }
        }
        await logJob(today, 'createTenantTwoWeeksMissing', JosStatus.done, '')
        console.log(`createTenantTwoWeeksMissing created ${sent} notificaions.`)
    }
    catch (error) {
        await logJob(today, 'createTenantTwoWeeksMissing', JosStatus.error, JSON.stringify(error))
    }
}

async function createVolunteerTwoWeeksMissing() {

    let today = resetDateTime(new Date())//s2023, 0, 30)
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createVolunteerTwoWeeksMissing',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createVolunteerTwoWeeksMissing' already done`)
        return
    }

    await logJob(today, 'createVolunteerTwoWeeksMissing', JosStatus.processing, '')
    console.log(`createVolunteerTwoWeeksMissing..`)

    let numOfWeeks = 2
    let twoWeeksAgo = firstDateOfWeekByHomeVisit(today)
    let last = lastDateOfWeek(twoWeeksAgo)
    twoWeeksAgo = resetDateTime(last, -(numOfWeeks * 7 - dayOfCreatingVisits.value + 1))
    console.log(twoWeeksAgo, '<-> ', last)

    try {
        let sent = [] as string[]
        let counter = 0
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true }, orderBy: { name: 'asc' } })) {
            for await (const volunteer of remult.repo(User).query({
                where: {
                    volunteer: true,
                    active: true,
                    id: (await remult.repo(UserBranch).find({
                        where: {
                            branch: branch,
                            user: {
                                $id: {
                                    $ne: (await remult.repo(VisitVolunteer).find({
                                        where: {//all done visits
                                            visit: {
                                                $id: (await remult.repo(Visit).find({
                                                    where: {
                                                        branch: branch,
                                                        date: { // 3w-ago
                                                            "$gte": twoWeeksAgo,
                                                            "$lte": last
                                                        },
                                                        status: { $ne: VisitStatus.none }//done
                                                    }
                                                })).map(v => v.id)
                                            }
                                        }
                                    })).map(ub => ub.volunteer.id)
                                }
                            }
                        }
                    })).map(ub => ub.user.id)
                }
            })) {
                let message = `${volunteer.name.split(' ')[0].trim()} כשבועיים שלא הגעת
נשמח לשמוע ממך :)
גט חסד של חבד לנוער`
                //                 let message = `${volunteer.name} כבר שבועיים שלא הגעת להתנדבות חבד לנוער
                // נשמח לשמוע ממך :)
                // פרוייקט ההתנדבות גט חסד`

                // send only once for volunteer on more then one branch
                if (!sent.includes(volunteer.id)) {
                    sent.push(volunteer.id)

                    await addNotification({
                        date: today,
                        time: '10:00',
                        user: volunteer.id,
                        mobile: volunteer.mobile,
                        message: message
                    })
                    ++counter
                }
            }
        }
        await logJob(today, 'createVolunteerTwoWeeksMissing', JosStatus.done, '')
        console.log(`createVolunteerTwoWeeksMissing created ${counter} notificaions.`)
    }
    catch (error) {
        await logJob(today, 'createVolunteerTwoWeeksMissing', JosStatus.error, JSON.stringify(error))
    }
}

async function createVolunteerFourWeeksDelayed() {

    let numOfWeeks = 4
    let today = resetDateTime(new Date())
    let fourWeeksAgo = firstDateOfWeekByHomeVisit(today)
    let last = lastDateOfWeek(fourWeeksAgo)
    fourWeeksAgo = resetDateTime(last, -(numOfWeeks * 7 - dayOfCreatingVisits.value + 1))
    console.log(fourWeeksAgo, '<-> ', last)

    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)
    console.log(fdate, '<-> ', tdate)

    let job = await remult.repo(Job).findFirst({
        name: 'createVolunteerFourWeeksDelayed',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createVolunteerFourWeeksDelayed' already done`)
        return
    }

    await logJob(today, 'createVolunteerFourWeeksDelayed', JosStatus.processing, '')
    console.log(`createVolunteerFourWeeksDelayed..`)

    try {
        let sent = 0
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true } })) {
            console.log('branch', branch.name)
            let visits = [] as { volunteer: string, rows: { week: string, counter: number }[] }[]
            for await (const visit of remult.repo(Visit).query({
                where: { // get the volunteers that do did 3 weeks visits
                    branch: branch,
                    date: { // 3w-ago
                        "$gte": fourWeeksAgo,
                        "$lte": last
                    },
                    status: { '$ne': VisitStatus.none }// done
                },
                orderBy: { branch: "asc", date: "desc" }
            })) {

                let vDate = resetDateTime(visit.date)
                let first = firstDateOfWeek(vDate)
                let last = lastDateOfWeek(vDate)
                let weekKey = `${dateFormat(first)}-${dateFormat(last)}`

                let vVolunteers = await remult.repo(VisitVolunteer).find({
                    where: { visit: visit }
                })
                if (vVolunteers?.length) {
                    for (const vv of vVolunteers) {
                        if (vv.volunteer?.active) {
                            let found = visits.find(v => v.volunteer === vv.volunteer.id)
                            if (!found) {
                                found = { volunteer: vv.volunteer.id, rows: [] as { week: string, counter: number }[] }
                                visits.push(found)
                            }
                            let foundWeek = found.rows.find(r => r.week === weekKey)
                            if (!foundWeek) {
                                foundWeek = { week: weekKey, counter: 0 }
                                found.rows.push(foundWeek)
                            }
                            ++foundWeek.counter
                        }
                    }
                }
            }//for

            let volIds = visits.filter(v => v.rows.length >= numOfWeeks).map(v => v.volunteer)// '>=' include extra days
            if (volIds?.length) {
                // console.log(`result ${volIds.length} rows: ${volIds.join(',')}`)
                let message = ''
                for await (const u of remult.repo(User).query({ where: { id: volIds } })) {

                    message += ` ${u.name} יקר יישר כח שאתה נותן מזמנך ומאיר יותר את העולם, 
                    המשך כך!
                    פרוייקט ההתנדבות גט חסד`

                    // await addNotification({
                    //     date: today,
                    //     time: '10:00',
                    //     user: u.id,
                    //     mobile: u.mobile,
                    //     message: message
                    // })

                    ++sent
                }
            }

        }//for
        await logJob(today, 'createVolunteerFourWeeksDelayed', JosStatus.done, '')
        console.log(`createVolunteerTwoWeeksMissing created ${sent} notificaions.`)
    }
    catch (error) {
        await logJob(today, 'createVolunteerFourWeeksDelayed', JosStatus.error, JSON.stringify(error))
    }
}

async function createMonthlyReport() {

    // today if first (1) of the next month
    let today = resetDateTime(new Date())
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createMonthlyReport',
        date: { "$gte": fdate, "$lte": tdate },
        status: JosStatus.done
    })
    if (job) {
        console.log(`Job 'createMonthlyReport' already done`)
        return
    }

    await logJob(today, 'createMonthlyReport', JosStatus.processing, '')
    console.log(`createMonthlyReport..`)
    let numOfWeeks = 4

    let dateLastMonth = resetDateTime(new Date(
        today.getFullYear(),
        today.getMonth() - 1,// job run at 1 of the next month, so do -1 to get last month
        1))
    let firstDOM = firstDateOfMonth(dateLastMonth)
    let lastDOM = lastDateOfMonth(firstDOM)

    try {
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true } })) {
            console.log('branch', branch.name)
            let visitsTenants = [] as { tenant: string, rows: { date: Date, counter: number }[] }[]
            let visitsVolunteers = [] as { volunteer: string, rows: { date: Date, counter: number }[] }[]
            for await (const visit of remult.repo(Visit).query({
                where: {
                    branch: branch,
                    date: { // month-ago
                        "$gte": firstDOM,
                        "$lte": lastDOM
                    },
                    status: { '$ne': VisitStatus.none }
                },
                orderBy: { branch: "asc", date: "desc" }
            })) {

                let volunteers = await remult.repo(VisitVolunteer).find({ where: { visit: visit } })
                if (volunteers?.length) {
                    for (const vv of volunteers) {

                        let found = visitsVolunteers.find(v => v.volunteer === vv.volunteer.id)
                        if (!found) {
                            found = { volunteer: vv.volunteer.id, rows: [] as { date: Date, counter: number }[] }
                            visitsVolunteers.push(found)
                        }
                        let foundDate = found.rows.find(v => dateEquals(v.date, visit.date))
                        if (!foundDate) {
                            foundDate = { date: visit.date, counter: 0 }
                            found.rows.push(foundDate)
                        }
                        ++foundDate.counter

                    }
                }

                let found = visitsTenants.find(v => v.tenant === visit.tenant.id)
                if (!found) {
                    found = { tenant: visit.tenant.id, rows: [] as { date: Date, counter: number }[] }
                    visitsTenants.push(found)
                }
                let foundDate = found.rows.find(v => dateEquals(v.date, visit.date))
                if (!foundDate) {
                    foundDate = { date: visit.date, counter: 0 }
                    found.rows.push(foundDate)
                }
                ++foundDate.counter

            }//for
            console.log('visitsVolunteers', JSON.stringify(visitsVolunteers))
            console.log('visitsTenants', JSON.stringify(visitsTenants))

            let vCount = await remult.repo(User).count({
                volunteer: true,
                id: (await remult.repo(UserBranch).find({
                    where: { branch: branch }
                })).map(u => u.id)
            })
            let tCount = await remult.repo(Tenant).count({ branch: branch })
            for await (const u of remult.repo(User).query({ where: { manager: true } })) {
                let message = `סיכום חודשי
החודש הגיעו ${visitsVolunteers.length} מתנדבים מתוך ${vCount} שקיימים בסניפך\n
החודש קיבלו ${visitsTenants.length} אברכים מתוך ${tCount} שקיימים בסניפך\n
פרוייקט ההתנדבות גט חסד`

                await addNotification({
                    date: today,
                    time: '10:00',
                    user: u.id,
                    mobile: u.mobile,
                    message: message
                })
            }
        }//for
        await logJob(today, 'createMonthlyReport', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createMonthlyReport', JosStatus.error, error)
    }
}

async function createWeeklyVisits() {
    let result = 0
    let today = resetDateTime(new Date())
    let fdate = firstDateOfWeek(today)
    let tdate = lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createWeeklyVisits',
        date: { "$gte": fdate, "$lte": tdate },
        status: [JosStatus.done, JosStatus.processing]
    })
    if (job) {
        if (job.status === JosStatus.done) {
            console.log(`Job 'createWeeklyVisits' already done`)
        } else if (job.status === JosStatus.processing) {
            console.log(`Job 'createWeeklyVisits' still running`)
        }
        return
    }

    await logJob(today, 'createWeeklyVisits', JosStatus.processing, '')
    console.log(`createWeeklyVisits..`)
    try {
        let counter = 0
        let bCounter = await remult.repo(Branch).count({ system: false, active: true })
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true } })) {
            ++counter
            console.log('branch', branch.name, `${counter}/${bCounter}`)
            let visitsCounter = 0
            for await (const tenant of remult.repo(Tenant).query({ where: { active: true, branch: branch }, orderBy: { name: 'asc' } })) {
                console.log('tenant', tenant.name)
                let visit = await remult.repo(Visit).findFirst(
                    {
                        branch: branch,
                        tenant: tenant,
                        date: today
                    },
                    { createIfNotFound: true })
                if (visit.isNew()) {
                    await remult.repo(Visit).save(visit)
                    ++result
                }
                // for await (const tv of remult.repo(TenantVolunteer).query({ where: { tenant: tenant } })) {
                //     let vv = await remult.repo(VisitVolunteer).findFirst(
                //         {
                //             visit: visit,
                //             volunteer: tv.volunteer
                //         },
                //         { createIfNotFound: true })
                //     if (vv.isNew()) {
                //         await remult.repo(VisitVolunteer).save(vv)
                //     }
                // }
            }
        }
        await logJob(today, 'createWeeklyVisits', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createWeeklyVisits', JosStatus.error, error)
    }
    return result
}

async function createDailyVisits() {
    let result = 0
    let today = resetDateTime(new Date(/*2023, 7, 20*/))
    let fdate = today // firstDateOfWeek(today)
    let tdate = today //lastDateOfWeek(today)

    let job = await remult.repo(Job).findFirst({
        name: 'createDailyVisits',
        date: { "$gte": fdate, "$lte": tdate },
        status: [JosStatus.done, JosStatus.processing]
    })
    if (job) {
        if (job.status === JosStatus.done) {
            console.log(`Job 'createDailyVisits' already done`)
        } else if (job.status === JosStatus.processing) {
            console.log(`Job 'createDailyVisits' still running`)
        }
        return
    }

    await logJob(today, 'createDailyVisits', JosStatus.processing, '')
    console.log(`createDailyVisits..`)
    try {
        let counter = 0
        let bCounter = await remult.repo(Branch).count({ system: false, active: true })
        for await (const branch of remult.repo(Branch).query({ where: { system: false, active: true } })) {
            ++counter
            console.log('branch', branch.name, `${counter}/${bCounter}`)
            let visitsCounter = 0
            for await (const tenant of remult.repo(Tenant).query({ where: { active: true, branch: branch }, orderBy: { name: 'asc' } })) {
                console.log('tenant', tenant.name)
                let visit = await remult.repo(Visit).findFirst(
                    {
                        branch: branch,
                        tenant: tenant,
                        date: today
                    },
                    { createIfNotFound: true })
                if (visit.isNew()) {
                    await remult.repo(Visit).save(visit)
                    ++result
                }
                // return
                // for await (const tv of remult.repo(TenantVolunteer).query({ where: { tenant: tenant } })) {
                //     let vv = await remult.repo(VisitVolunteer).findFirst(
                //         {
                //             visit: visit,
                //             volunteer: tv.volunteer
                //         },
                //         { createIfNotFound: true })
                //     if (vv.isNew()) {
                //         await remult.repo(VisitVolunteer).save(vv)
                //     }
                // }
            }
        }
        await logJob(today, 'createDailyVisits', JosStatus.done, '')
    }
    catch (error) {
        await logJob(today, 'createDailyVisits', JosStatus.error, error)
    }
    return result
}

async function logJob(date: Date, job: string, status: JosStatus, error: any) {
    let log = await remult.repo(Job).findFirst(
        { name: job, date: date },
        { createIfNotFound: true })
    log.status = status
    log.remark = error?.toString() ?? 'UnKnown'
    // log.date = new Date()
    await log.save()
}

async function addNotification(data: { date: Date, time: string, mobile?: string, email?: string, message?: string, subject?: string, user?: string }) {
    if (data) {
        let notification = remult.repo(Notification).create()
        notification.date = data.date
        notification.time = data.time
        notification.mobile = data.mobile ?? ''
        notification.email = data.email ?? ''
        notification.message = data.message ?? ''
        notification.subject = data.subject ?? ''
        notification.status = NotificationStatus.none
        notification.sender = data.user ?? ''
        await notification.save()
    }
    else {
        console.error('addNotification.data is NULL')
    }
}

async function sendNotifications() {
    let today = new Date()
    let time = ('00' + today.getHours()).slice(-2) + ":" + ('00' + today.getMinutes()).slice(-2)
    let tenMinBack = ('00' + (today.getHours() - 1)).slice(-2) + ":" + '45'
    let tenMinNext = ('00' + (today.getHours())).slice(-2) + ":" + '15'
    // console.log('sendNotifications', today, time, tenMinBack, tenMinNext)
    let sms = new SmsService()
    for await (const notification of remult.repo(Notification).query({
        where: {
            date: today,
            $or: [
                { time: { "$gte": tenMinBack, "$lte": tenMinNext } },
                { time: '' /*immediate*/ }
            ],
            status: NotificationStatus.none
        }
    })) {
        if (isValidMobile(notification.mobile)) {
            let res = await sms.sendSmsMulti({
                international: notification.mobile.startsWith('1'),
                message: notification.message,
                mobiles: [notification.mobile],
                senderid: notification.sender
            })
            if (res.success) {
                notification.status = NotificationStatus.sent
                notification.sent = new Date()
                await notification.save()
            }
            else {
                console.error(`sendNotifications(id: ${notification.id}, mobile: ${notification.mobile})`, JSON.stringify(res))
                notification.status = NotificationStatus.error
                notification.error = res.message
                // notification.sent = new Date()
                await notification.save()
            }
        }
        else {
            console.error(`sendNotifications(id: ${notification.id}, mobile: ${notification.mobile})`, 'INVALID mobile')
            notification.status = NotificationStatus.error
            notification.error = 'סלולרי שגוי'
            // notification.sent = new Date()
            await notification.save()
        }
    }
}
