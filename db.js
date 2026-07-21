// ─── IN-MEMORY DATABASE (swap for MongoDB/PostgreSQL in production) ───────────
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const mkId = n => 'IFA-' + String(n).padStart(4,'0');
const today = () => new Date().toISOString().split('T')[0];

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const PASS_HASH = bcrypt.hashSync('member123', 10);
const ADMIN_HASH = bcrypt.hashSync('admin123', 10);

const members = [
  {id:'IFA-0001',fn:'Adebayo',ln:'Kolawole',on:'',name:'Adebayo Kolawole',role:'president',des:'Chief',prof:'Businessman',phone:'08012345678',email:'adebayo@ijebu.ng',addr:'Plot 45 Maitama, Abuja',town:'Ijebu-Ode',hAddr:'12 Oba Street, Ijebu-Ode',dobDay:'15',dobMonth:'March',dobYear:'1968',nok:'Mrs Adebayo',nokP:'08012345679',nokR:'Spouse',pts:780,streak:6,att:['present','present','present','present','present','present'],tdone:12,joined:'2020-01-15',status:'active',photo:null,method:'geo',password:ADMIN_HASH,isAdmin:true},
  const members = [
  {
    id:'IFA-0001',
    fn:'Your',
    ln:'Name',
    on:'',
    name:'Your Full Name',
    role:'president',
    des:'',
    prof:'',
    phone:'08012345678',
    email:'your-real-email@gmail.com',
    addr:'',
    town:'',
    hAddr:'',
    dobDay:'',
    dobMonth:'',
    dobYear:'',
    nok:'',
    nokP:'',
    nokR:'',
    pts:0,
    streak:0,
    att:[],
    tdone:0,
    joined:'2026-07-21',
    status:'active',
    photo:null,
    method:'geo',
    password:ADMIN_HASH,
    isAdmin:true
  },
];];

const tasks = [
  {id:uuid(),title:'Coordinate July meeting logistics',desc:'Arrange hall, PA system and refreshments.',assignee:'IFA-0003',priority:'high',due:'2026-07-10',status:'done',by:'IFA-0001',created:today()},
  {id:uuid(),title:'Compile welfare list for Q3',desc:'Prepare list of members needing welfare support.',assignee:'IFA-0005',priority:'medium',due:'2026-07-25',status:'pending',by:'IFA-0001',created:today()},
  {id:uuid(),title:'Draft mid-year budget review',desc:'Prepare mid-year budget review for 2026.',assignee:'IFA-0004',priority:'high',due:'2026-08-01',status:'inprogress',by:'IFA-0001',created:today()},
];
const announcements = [
  {id:uuid(),title:'Forum Meeting - July 2026',body:'Monthly meeting holds Sunday 12th July 2026 at 2PM. Venue: Transcorp Hilton Conference Room B, Abuja.',priority:'important',author:'Secretary',date:today()},
  {id:uuid(),title:'Annual Thanksgiving Celebration',body:'Annual thanksgiving dinner holds Saturday 28th December 2026 at Nicon Luxury Hotel. Black tie event.',priority:'normal',author:'President',date:today()},
  {id:uuid(),title:'Welfare Appeal - Alhaja Rashidat',body:'Members are urged to support Alhaja Rashidat Adeyemi recently bereaved. Contribute via Finance page.',priority:'urgent',author:'Welfare Officer',date:today()},
];
const events = [
  {id:uuid(),title:'Monthly Forum Meeting',date:'2026-07-12',time:'14:00',venue:'Transcorp Hilton, Abuja',desc:'Regular monthly meeting of all members.',upcoming:true,rsvps:[]},
  {id:uuid(),title:'Annual Thanksgiving Dinner',date:'2026-12-28',time:'18:00',venue:'Nicon Luxury Hotel, Abuja',desc:'Annual celebration. Black tie event.',upcoming:true,rsvps:[]},
  {id:uuid(),title:'Ijebu Day Celebrations',date:'2026-09-20',time:'10:00',venue:'AICC, Abuja',desc:'Annual Ijebu Day celebration.',upcoming:true,rsvps:[]},
];
const polls = [
  {id:uuid(),q:'Should monthly dues increase to N3,000 from October 2026?',opts:[{t:'Yes - N3,000',v:7},{t:'No - keep N2,000',v:4},{t:'Yes but N2,500',v:3}],end:'2026-07-31',voters:[]},
  {id:uuid(),q:'Should the forum hold bi-monthly instead of monthly meetings?',opts:[{t:'Yes, every 2 months',v:5},{t:'No, keep monthly',v:8}],end:'2026-07-25',voters:[]},
];
const transactions = [
  {id:uuid(),desc:'Registration Fee - Adewale Johnson',type:'cr',amt:10000,date:'2026-01-15',cat:'registration',by:'IFA-0004'},
  {id:uuid(),desc:'Monthly Dues - Adebayo Kolawole',type:'cr',amt:2000,date:'2026-07-01',cat:'dues',by:'IFA-0004'},
  {id:uuid(),desc:'Event Decoration - July Meeting',type:'db',amt:15000,date:'2026-07-05',cat:'event',by:'IFA-0004'},
  {id:uuid(),desc:'Welfare Support - Bereaved Member',type:'db',amt:30000,date:'2026-07-02',cat:'welfare',by:'IFA-0004'},
  {id:uuid(),desc:'External Sponsorship - Alhaji Muritala',type:'cr',amt:100000,date:'2026-06-20',cat:'donation',by:'IFA-0004'},
];
const chats = {
  general:[
    {id:uuid(),sid:'IFA-0001',sn:'Chief Adebayo',txt:'Aborò! Welcome to our forum chat. Fellow Ijebu people in Abuja!',t:'08:30',date:today()},
    {id:uuid(),sid:'IFA-0002',sn:'Dr. Folasade',txt:"Good morning! Looking forward to today's meeting.",t:'08:45',date:today()},
  ],
  exco:[{id:uuid(),sid:'IFA-0001',sn:'President',txt:"Exco members, please review today's agenda before arrival.",t:'07:00',date:today()}],
  welfare:[{id:uuid(),sid:'IFA-0005',sn:'Mrs. Abimbola',txt:'Welfare update: 3 members supported this quarter.',t:'10:00',date:today()}],
  events:[],
  birthdays:[],
};
const complaints = [
  {id:uuid(),sub:'Meeting venue too far',cat:'General Complaint',det:'Transcorp Hilton is too far for members from Lugbe and Nyanya.',by:'Anonymous',date:today(),status:'inprogress'},
];
const notifications = {};
const attendanceSessions = [];

module.exports = { members, tasks, announcements, events, polls, transactions, chats, complaints, notifications, attendanceSessions, mkId, today, MONTHS };
