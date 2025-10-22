const calendar = document.getElementById("calendar");
const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const classesHeldDiv = document.getElementById("classesHeld");
const classesAttendedDiv = document.getElementById("classesAttended");
const saveBtn = document.getElementById("saveBtn");
const closeBtn = document.getElementById("closeBtn");
const overallDiv = document.getElementById("overall");
const subjectSummaryDiv = document.getElementById("subjectSummary");
const semesterSelect = document.getElementById("semesterSelect");
const nextSemesterBtn = document.getElementById("nextSemesterBtn");
const prevSemesterBtn = document.getElementById("prevSemesterBtn");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");

const subjects = ["Calculus","LAMA","IoT","Eng Basics","Eng A1","Eng A2","EVS","IT","C Programming","Entrepreneurship"];
const gazettedHolidays = ["2025-01-26","2025-08-15","2025-10-02","2025-10-31","2025-12-25"];
const restrictedHolidays = ["2025-03-17","2025-04-13","2025-08-19","2025-11-06"];

let semesters = JSON.parse(localStorage.getItem("semesters") || "{}");
let currentSemester = localStorage.getItem("currentSemester") || "Semester 1";
if(!semesters[currentSemester]) semesters[currentSemester]={};
let attendanceData = semesters[currentSemester];
let selectedDate="";

// Populate Month
const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
monthNames.forEach((m,i)=>{
  const opt=document.createElement("option");
  opt.value=i; opt.textContent=m;
  monthSelect.appendChild(opt);
});
monthSelect.value=new Date().getMonth();

// Populate Year 2020-2030
for(let y=2020;y<=2030;y++){
  const opt=document.createElement("option");
  opt.value=y; opt.textContent=y;
  yearSelect.appendChild(opt);
}
yearSelect.value=new Date().getFullYear();

// Event Listeners
monthSelect.addEventListener("change", renderCalendar);
yearSelect.addEventListener("change", renderCalendar);
saveBtn.addEventListener("click", onSave);
closeBtn.addEventListener("click", ()=> popup.classList.remove("show"));
nextSemesterBtn.addEventListener("click", createNextSemester);
prevSemesterBtn.addEventListener("click", createPrevSemester);
semesterSelect.addEventListener("change", switchSemester);

// Initialize
updateSemesterDropdown();
renderCalendar();

// ---------------- Functions -----------------
function updateSemesterDropdown(){
  semesterSelect.innerHTML="";
  Object.keys(semesters).forEach(s=>{
    const opt=document.createElement("option");
    opt.value=s; opt.textContent=s;
    if(s===currentSemester) opt.selected=true;
    semesterSelect.appendChild(opt);
  });
}

function createNextSemester(){
  const nextNumber=Object.keys(semesters).length+1;
  const newName=`Semester ${nextNumber}`;
  semesters[newName]={};
  currentSemester=newName;
  attendanceData=semesters[currentSemester];
  localStorage.setItem("semesters",JSON.stringify(semesters));
  localStorage.setItem("currentSemester",currentSemester);
  updateSemesterDropdown();
  renderCalendar();
  alert("New semester started! Attendance reset.");
}

function createPrevSemester(){
  const keys=Object.keys(semesters);
  const idx=keys.indexOf(currentSemester);
  if(idx>0){
    currentSemester=keys[idx-1];
    attendanceData=semesters[currentSemester];
    localStorage.setItem("currentSemester",currentSemester);
    updateSemesterDropdown();
    renderCalendar();
  } else alert("Already at first semester!");
}

function switchSemester(){
  currentSemester=semesterSelect.value;
  attendanceData=semesters[currentSemester];
  localStorage.setItem("currentSemester",currentSemester);
  renderCalendar();
}

function renderCalendar(){
  calendar.innerHTML="";
  const month=parseInt(monthSelect.value);
  const year=parseInt(yearSelect.value);
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++) calendar.appendChild(document.createElement("div"));

  for(let d=1;d<=daysInMonth;d++){
    const dayDiv=document.createElement("div");
    dayDiv.className="day"; dayDiv.textContent=d;
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dayOfWeek=new Date(year,month,d).getDay();

    if(gazettedHolidays.includes(dateStr)) dayDiv.classList.add("gazetted");
    else if(restrictedHolidays.includes(dateStr) || dayOfWeek===0) dayDiv.classList.add("restricted","sunday");

    if(attendanceData[dateStr]){
      const held=attendanceData[dateStr].held.length;
      const attended=attendanceData[dateStr].attended.length;
      if(held>0){
        if(attended===held) dayDiv.classList.add("full");
        else dayDiv.classList.add("partial");
      }
    }

    dayDiv.addEventListener("click", ()=>openPopup(dateStr));
    calendar.appendChild(dayDiv);
  }

  updateSummary();
}

function openPopup(dateStr){
  selectedDate=dateStr;
  popup.classList.add("show");
  popupDate.textContent=`Attendance for ${dateStr}`;
  classesHeldDiv.innerHTML=""; classesAttendedDiv.innerHTML="";

  const held=attendanceData[dateStr]?.held || [];
  const attended=attendanceData[dateStr]?.attended || [];

  subjects.forEach(sub=>{
    const lblH=document.createElement("label");
    const chkH=document.createElement("input"); chkH.type="checkbox"; chkH.value=sub;
    if(held.includes(sub)) chkH.checked=true;
    lblH.appendChild(chkH); lblH.appendChild(document.createTextNode(" "+sub));
    classesHeldDiv.appendChild(lblH);

    const lblA=document.createElement("label");
    const chkA=document.createElement("input"); chkA.type="checkbox"; chkA.value=sub;
    if(attended.includes(sub)) chkA.checked=true;
    lblA.appendChild(chkA); lblA.appendChild(document.createTextNode(" "+sub));
    classesAttendedDiv.appendChild(lblA);
  });
}

function onSave(){
  const held=Array.from(classesHeldDiv.querySelectorAll("input:checked")).map(i=>i.value);
  const attended=Array.from(classesAttendedDiv.querySelectorAll("input:checked")).map(i=>i.value);
  attendanceData[selectedDate]={held,attended};
  semesters[currentSemester]=attendanceData;
  localStorage.setItem("semesters",JSON.stringify(semesters));
  popup.classList.remove("show");
  renderCalendar();
}

function updateSummary(){
  const subjectCount={};
  subjects.forEach(s=>subjectCount[s]={attended:0,total:0});
  for(const date in attendanceData){
    const data=attendanceData[date];
    data.held.forEach(sub=>{
      if(!(sub in subjectCount)) return;
      subjectCount[sub].total++;
      if(data.attended.includes(sub)) subjectCount[sub].attended++;
    });
  }

  let total=0,attended=0;
  subjects.forEach(s=>{ total+=subjectCount[s].total; attended+=subjectCount[s].attended; });
  overallDiv.textContent=`Overall Attendance: ${total===0?0:(attended/total*100).toFixed(2)}%`;

  subjectSummaryDiv.innerHTML="";
  subjects.forEach(s=>{
    const p=subjectCount[s].total===0?0:(subjectCount[s].attended/subjectCount[s].total*100);
    const div=document.createElement("div"); div.className="subject-attendance";
    div.innerHTML=`<div style="display:flex;justify-content:space-between"><span>${s}</span><span>${p.toFixed(2)}%</span></div>`;
    const bar=document.createElement("div"); bar.className="bar"; bar.style.width=`${p}%`;
    div.appendChild(bar); subjectSummaryDiv.appendChild(div);
  });
}