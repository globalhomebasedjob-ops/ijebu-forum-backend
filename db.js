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
  {id:'IFA-0002',fn:'Folasade',ln:'Akinwande',on:'',name:'Folasade Akinwande',role:'vice-president',des:'Dr.',prof:'Medical Doctor',phone:'08023456789',email:'folasade@ijebu.ng',addr:'7 Garki Area 11, Abuja',town:'Ago-Iwoye',hAddr:'4 Abeokuta Road, Ago-Iwoye',dobDay:'22',dobMonth:'July',dobYear:'1972',nok:'Mr Akinwande',nokP:'08023456780',nokR:'Spouse',pts:650,streak:5,att:['present','present','absent','present','present','present'],tdone:9,joined:'2020-02-10',status:'active',photo:null,method:'geo',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0003',fn:'Olusegun',ln:'Bamidele',on:'',name:'Olusegun Bamidele',role:'secretary',des:'Engr.',prof:'Civil Engineer',phone:'08034567890',email:'olusegun@ijebu.ng',addr:'22 Wuse Zone 4, Abuja',town:'Ijebu-Igbo',hAddr:'8 Oba Rd, Ijebu-Igbo',dobDay:'8',dobMonth:'November',dobYear:'1975',nok:'Cynthia Bamidele',nokP:'08034567891',nokR:'Spouse',pts:590,streak:4,att:['present','excuse','present','present','present','present'],tdone:8,joined:'2020-03-05',status:'active',photo:null,method:'scan',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0004',fn:'Taiwo',ln:'Odusanya',on:'',name:'Taiwo Odusanya',role:'treasurer',des:'',prof:'Accountant',phone:'08045678901',email:'taiwo@ijebu.ng',addr:'5 Lugbe Estate, Abuja',town:'Ijebu-Ode',hAddr:'22 Oke-Sopen, Ijebu-Ode',dobDay:'4',dobMonth:'June',dobYear:'1980',nok:'Kehinde Odusanya',nokP:'08045678902',nokR:'Twin',pts:420,streak:3,att:['present','present','present','absent','present','excuse'],tdone:6,joined:'2020-06-20',status:'active',photo:null,method:'biometric',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0005',fn:'Abimbola',ln:'Fashola',on:'',name:'Abimbola Fashola',role:'welfare',des:'Mrs.',prof:'Teacher',phone:'08056789012',email:'abimbola@ijebu.ng',addr:'10 Gwarimpa, Abuja',town:'Sagamu',hAddr:'3 Lagos Rd, Sagamu',dobDay:'17',dobMonth:'January',dobYear:'1983',nok:'Tunde Fashola',nokP:'08056789013',nokR:'Spouse',pts:380,streak:2,att:['absent','present','present','present','present','absent'],tdone:5,joined:'2020-08-12',status:'active',photo:null,method:'geo',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0006',fn:'Babatunde',ln:'Oguns',on:'',name:'Babatunde Oguns',role:'pro',des:'',prof:'PR Consultant',phone:'08067890123',email:'babatunde@ijebu.ng',addr:'3 Life Camp, Abuja',town:'Ijebu-Mushin',hAddr:'9 Church Rd, Ijebu-Mushin',dobDay:'30',dobMonth:'August',dobYear:'1985',nok:'Grace Oguns',nokP:'08067890124',nokR:'Spouse',pts:310,streak:2,att:['present','present','absent','absent','present','present'],tdone:4,joined:'2020-11-03',status:'active',photo:null,method:'scan',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0007',fn:'Kehinde',ln:'Afolabi',on:'',name:'Kehinde Afolabi',role:'social-welfare',des:'',prof:'Social Worker',phone:'08078901234',email:'kehinde@ijebu.ng',addr:'8 Kubwa, Abuja',town:'Ijebu-Ode',hAddr:'17 Oba Market Rd, Ijebu-Ode',dobDay:'12',dobMonth:'December',dobYear:'1988',nok:'Taiwo Afolabi',nokP:'08078901235',nokR:'Twin',pts:270,streak:1,att:['present','absent','present','present','absent','present'],tdone:3,joined:'2021-01-08',status:'active',photo:null,method:'geo',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0008',fn:'Monsurat',ln:'Lawal',on:'',name:'Monsurat Lawal',role:'chief-whip',des:'',prof:'Lawyer',phone:'08089012345',email:'monsurat@ijebu.ng',addr:'12 Asokoro, Abuja',town:'Ago-Iwoye',hAddr:'5 Court Rd, Ago-Iwoye',dobDay:'5',dobMonth:'May',dobYear:'1979',nok:'Alhaji Lawal',nokP:'08089012346',nokR:'Spouse',pts:450,streak:3,att:['present','present','present','present','excuse','present'],tdone:7,joined:'2021-02-15',status:'active',photo:null,method:'biometric',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0009',fn:'Rotimi',ln:'Adeyemi',on:'',name:'Rotimi Adeyemi',role:'exofficio',des:'Hon.',prof:'Politician',phone:'08090123456',email:'rotimi@ijebu.ng',addr:'Plot 1 Jabi, Abuja',town:'Ijebu-Ode',hAddr:'Block A, Govt Estate, Ijebu-Ode',dobDay:'20',dobMonth:'March',dobYear:'1965',nok:'Chief Mrs Adeyemi',nokP:'08090123457',nokR:'Spouse',pts:520,streak:4,att:['present','present','present','excuse','present','present'],tdone:5,joined:'2020-03-01',status:'active',photo:null,method:'scan',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0010',fn:'Oluwakemi',ln:'Bello',on:'',name:'Oluwakemi Bello',role:'trustees',des:'Prof.',prof:'Professor',phone:'08001234567',email:'oluwakemi@ijebu.ng',addr:'4 Utako, Abuja',town:'Ijebu-Igbo',hAddr:'2 Professors Qtrs, Ijebu-Igbo',dobDay:'10',dobMonth:'October',dobYear:'1960',nok:'Mr Bello',nokP:'08001234568',nokR:'Spouse',pts:890,streak:7,att:['present','present','present','present','present','present'],tdone:15,joined:'2020-01-10',status:'active',photo:null,method:'geo',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0011',fn:'Adewale',ln:'Johnson',on:'',name:'Adewale Johnson',role:'member',des:'',prof:'Trader',phone:'08011112222',email:'adewale@ijebu.ng',addr:'22 Nyanya, Abuja',town:'Ijebu-Ode',hAddr:'10 Market Square, Ijebu-Ode',dobDay:'3',dobMonth:'September',dobYear:'1990',nok:'Shade Johnson',nokP:'08011112223',nokR:'Spouse',pts:180,streak:1,att:['absent','present','present','absent','present','present'],tdone:2,joined:'2022-01-20',status:'active',photo:null,method:'scan',password:PASS_HASH,isAdmin:false},
  {id:'IFA-0012',fn:'Simisola',ln:'Okafor',on:'',name:'Simisola Okafor',role:'member',des:'',prof:'Nurse',phone:'08022223333',email:'simisola@ijebu.ng',addr:'5 Kado Estate, Abuja',town:'Ijebu-Ife',hAddr:'7 Hospital Rd, Ijebu-Ife',dobDay:'28',dobMonth:'February',dobYear:'1993',nok:'Mr Okafor',nokP:'08022223334',nokR:'Spouse',pts:210,streak:2,att:['present','present','absent','present','present','absent'],tdone:3,joined:'2022-03-15',status:'active',photo:null,method:'biometric',password:PASS_HASH,isAdmin:false},
];

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
