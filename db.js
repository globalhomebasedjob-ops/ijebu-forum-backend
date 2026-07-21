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
    name:'Isiaka Folunroso Ashimi',
    role:'president',
    des:'',
    prof:'',
    phone:'08052380048',
    email:'admin@ijebuconnect.com',
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
  ];
const announcements = [
  ];
const events = [
  ];
const polls = [
 ];
const transactions = [
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
