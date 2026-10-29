const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let state={page:'dashboard',companies:[],voucherFilters:{},authenticated:false,user:null,csrf:'',reportCompanyId:'',reportFrom:'',reportTo:'',chartFrom:'',chartTo:''};
const APP_TITLE='مديرية مجاري كربلاء / شعبة التدقيق';
const DESIGNER='تم تصميم هذا البرنامج في شعبة تكنولوجيا المعلومات';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n===null||n===undefined||n===''?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(n));
const val=id=>document.getElementById(id)?.value??'';
const todayText=()=>new Date().toLocaleDateString('ar-IQ',{year:'numeric',month:'long',day:'numeric'});
async function api(url,opt={}){opt={...opt,headers:{...(opt.headers||{})}};if(opt.method&&opt.method!=='GET'&&state.csrf)opt.headers['X-CSRF-Token']=state.csrf;const r=await fetch(url,opt);let d={};try{d=await r.json()}catch{}if(r.status===401&&url!='/api/session'&&!url.startsWith('/api/login')){state.authenticated=false;state.user=null;renderLogin();throw new Error(d.message||'انتهت جلسة الدخول.')}if(!r.ok)throw new Error(d.message||`خطأ ${r.status}`);return d}
function toast(msg,type=''){const t=$('#toast');t.textContent=msg;t.className='toast show '+type;setTimeout(()=>t.className='toast',3800)}
function setHeader(title,sub,actions=''){ $('#pageTitle').textContent=title;$('#pageSub').textContent=sub;const who=state.user?`<span class="user-chip">${esc(state.user.display_name)} • ${esc(state.user.role_label)}</span>`:'';$('#headerActions').innerHTML=`${who}${actions}<button class="btn secondary no-print" onclick="logout()">تسجيل الخروج</button>`; }
function nav(page){state.page=page;$$('.sidebar nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));render()}
$$('.sidebar nav button').forEach(b=>b.onclick=()=>nav(b.dataset.page));
function openModal(html){$('#modalBody').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){ $('#modal').classList.add('hidden'); $('#modalBody').innerHTML=''; }
window.closeModal=closeModal;
const canWrite=()=>state.user&&['admin','editor'].includes(state.user.role);
const isAdmin=()=>state.user&&state.user.role==='admin';
function applyRoleUI(){document.querySelectorAll('.admin-only').forEach(x=>x.style.display=isAdmin()?'':'none');}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});

function renderLogin(error=''){
  $('.shell').classList.add('locked');
  $('#loginLayer').innerHTML=`<div class="login-screen"><div class="login-simple-card"><img src="/static/assets/logo.png" class="login-system-logo" alt="الشعار"><div class="login-org">مديرية مجاري كربلاء</div><h2>شعبة التدقيق</h2><p class="login-short">تسجيل الدخول إلى النظام الإلكتروني</p><form class="login-form" onsubmit="submitLogin(event)"><label>اسم المستخدم<input id="loginUsername" autocomplete="username" placeholder="اسم المستخدم" autofocus></label><label>كلمة المرور<input id="loginPassword" type="password" autocomplete="current-password" placeholder="كلمة المرور"></label>${error?`<div class="login-error">${esc(error)}</div>`:''}<button class="btn primary big">دخول</button></form><div class="login-footer">${DESIGNER}</div></div></div>`;
}
async function applyAuthState(){
  try{const d=await api('/api/session');state.authenticated=!!d.authenticated;state.user=d.user||null;state.csrf=d.csrf_token||''}catch{state.authenticated=false;state.user=null}
  if(state.authenticated){$('.shell').classList.remove('locked');$('#loginLayer').innerHTML='';applyRoleUI();render()}else renderLogin();
}
async function submitLogin(e){
  e.preventDefault();
  try{const d=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:val('loginUsername'),password:val('loginPassword')})});state.authenticated=true;state.user=d.user;state.csrf=d.csrf_token||'';$('.shell').classList.remove('locked');$('#loginLayer').innerHTML='';applyRoleUI();toast(d.message||'تم تسجيل الدخول بنجاح');render()}catch(err){renderLogin(err.message||'بيانات الدخول غير صحيحة.');}
}
async function logout(){try{await api('/api/logout',{method:'POST'})}catch{}state.authenticated=false;state.user=null;state.csrf='';closeModal();renderLogin();toast('تم تسجيل الخروج')}
window.submitLogin=submitLogin;window.logout=logout;

async function refreshCompanies(){state.companies=await api('/api/companies');return state.companies}
function companyOptions(selected=''){return state.companies.map(c=>`<option value="${c.id}" ${String(c.id)===String(selected)?'selected':''}>${esc(c.name)}</option>`).join('')}
function buildQuery(filters){const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!==''&&v!=null)p.set(k,v)});return p.toString()}

async function render(){
  if(!state.authenticated)return renderLogin();
  try{
    if(state.page==='dashboard')return renderDashboard();
    if(state.page==='companies')return renderCompanies();
    if(state.page==='vouchers')return renderVouchers();
    if(state.page==='reports')return renderReports();
    if(state.page==='charts')return renderCharts();
    if(state.page==='backup')return renderBackup();
    if(state.page==='users')return renderUsers();
    if(state.page==='account')return renderAccount();
    if(state.page==='rules')return renderRules();
  }catch(e){toast(e.message,'error')}
}

async function renderDashboard(){
  setHeader('لوحة التحكم','متابعة الصرفيات والوصولات الخاصة بالشركات',canWrite()?`<button class="btn primary" onclick="showVoucherForm()">＋ إدخال وصل</button>`:'');
  const d=await api('/api/dashboard');
  const max=Math.max(...d.top.map(x=>x.total||0),1);
  const topCompany=d.top?.[0]?.name||'—';
  $('#view').innerHTML=`
  <section class="hero">
    <div class="hero-panel">
      <h2>${APP_TITLE}</h2>
      <div class="hero-meta">
        <span class="hero-chip">تاريخ اليوم: ${todayText()}</span>
        <span class="hero-chip">الجهة: شعبة التدقيق</span>
        <span class="hero-chip">${DESIGNER}</span><span class="hero-chip">${esc(state.user.role_label)}</span>
      </div>
    </div>
    <div class="hero-side"><div class="card"><h2>ملخص سريع</h2><div class="statline"><span class="statpill">أعلى شركة صرفًا: ${esc(topCompany)}</span><span class="statpill">إجمالي الشركات: ${d.stats.companies_count}</span><span class="statpill">السجلات: ${d.stats.entries_count}</span></div></div></div>
  </section>
  <div class="kpis">
    <div class="kpi"><span>إجمالي الصرفيات</span><strong>${money(d.stats.total_amount)}</strong><small>قيمة جميع المبالغ المدخلة</small></div>
    <div class="kpi"><span>عدد الشركات</span><strong>${d.stats.companies_count}</strong><small>شركة مسجلة في النظام</small></div>
    <div class="kpi"><span>عدد السجلات</span><strong>${d.stats.entries_count}</strong><small>إجمالي القيود المحفوظة</small></div>
    <div class="kpi"><span>وصولات مرقمة</span><strong>${d.stats.vouchers_count}</strong><small>سجلات تحتوي أرقام وصولات</small></div>
  </div>
  <div class="grid2">
    <section class="card"><div class="card-head"><h2>صرفيات الشركات</h2><span class="link" onclick="nav('charts')">عرض المخططات</span></div><div class="bars">${d.top.map(r=>`<div><div class="barlabel"><span>${esc(r.name)}</span><b>${money(r.total)}</b></div><div class="track"><i style="width:${((r.total||0)/max*100).toFixed(1)}%"></i></div></div>`).join('')||'<div class="empty">لا توجد بيانات</div>'}</div></section>
    <section class="card"><div class="card-head"><h2>آخر السجلات</h2><span class="link" onclick="nav('vouchers')">كل السجلات</span></div><div class="mini">${d.recent.map(r=>`<a ${canWrite()?`onclick="showVoucherForm(${r.id})"`:''}><span><b>${esc(r.company_name)}</b><small>وصل: ${r.receipt_no??'—'} • ${r.receipt_date||'بدون تاريخ'}</small></span><strong>${money(r.amount)}</strong></a>`).join('')||'<div class="empty">لا توجد سجلات</div>'}</div></section>
  </div>`;
}

async function renderCompanies(){
  setHeader('إدارة الشركات','قائمة الشركات المعتمدة داخل النظام مع مجاميع الصرف وعدد السجلات');
  const cs=await refreshCompanies();
  $('#view').innerHTML=`<div class="grid2 ${canWrite()?'narrow':''}">${canWrite()?`<section class="card"><h2>إضافة شركة جديدة</h2><form class="stack" onsubmit="addCompany(event)"><label>اسم الشركة<input id="newCompany" required placeholder="مثال: شركة بغداد"></label><button class="btn primary">حفظ الشركة</button></form></section>`:''}<section class="card"><div class="card-head"><h2>الشركات المسجلة</h2><span class="badge">${cs.length} شركة</span></div><div class="tablewrap"><table><thead><tr><th>اسم الشركة</th><th>عدد السجلات</th><th>مجموع الصرفيات</th><th>الإجراءات</th></tr></thead><tbody>${cs.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${c.entries_count}</td><td>${money(c.total_amount)}</td><td class="actions">${canWrite()?`<button class="btn tiny" onclick='renameCompany(${c.id},${JSON.stringify(c.name)})'>تعديل</button><button class="btn tiny danger" onclick="deleteCompany(${c.id})">حذف</button>`:'مشاهدة فقط'}</td></tr>`).join('')}</tbody></table></div></section></div>`;
}
async function addCompany(e){e.preventDefault();try{const d=await api('/api/companies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:val('newCompany')})});toast(d.message);renderCompanies()}catch(e){toast(e.message,'error')}}
async function renameCompany(id,name){const n=prompt('اسم الشركة الجديد:',name);if(n===null)return;try{const d=await api('/api/companies/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})});toast(d.message);renderCompanies()}catch(e){toast(e.message,'error')}}
async function deleteCompany(id){if(!confirm('هل تريد حذف الشركة؟'))return;try{const d=await api('/api/companies/'+id,{method:'DELETE'});toast(d.message);renderCompanies()}catch(e){toast(e.message,'error')}}

async function renderVouchers(){
  setHeader('الوصولات والسجلات','إدخال وبحث وتعديل الوصولات مع التحقق التلقائي من التسلسل التاريخي',canWrite()?`<button class="btn primary" onclick="showVoucherForm()">＋ وصل جديد</button>`:'');
  await refreshCompanies();
  const f=state.voucherFilters;
  const d=await api('/api/vouchers?'+buildQuery(f));
  $('#view').innerHTML=`
  <section class="card"><div class="filters"><label>الشركة<select id="fCompany"><option value="">كل الشركات</option>${companyOptions(f.company_id||'')}</select></label><label>من تاريخ<input type="date" id="fDateFrom" value="${esc(f.date_from||'')}"></label><label>إلى تاريخ<input type="date" id="fDateTo" value="${esc(f.date_to||'')}"></label><label>من رقم وصل<input type="number" id="fReceiptFrom" value="${esc(f.receipt_from||'')}"></label><label>إلى رقم وصل<input type="number" id="fReceiptTo" value="${esc(f.receipt_to||'')}"></label><label>بحث<input id="fQ" value="${esc(f.q||'')}" placeholder="اسم/تفاصيل/رقم وصل"></label><div class="filterBtns"><button class="btn primary" onclick="applyVoucherFilters()">تطبيق</button><button class="btn" onclick="clearVoucherFilters()">مسح</button></div></div></section>
  <div class="summary"><span>عدد النتائج: <b>${d.totals.count_rows}</b></span><span>مجموع النتائج: <b>${money(d.totals.total_amount)}</b></span><span class="spacer"></span><a class="btn tiny no-print" href="/export.csv?${buildQuery(f)}">تصدير CSV / Excel</a><button class="btn tiny no-print" onclick="window.print()">طباعة</button></div>
  <section class="card"><div class="tablewrap"><table><thead><tr><th>ت</th><th>اسم الشركة</th><th>رقم الوصل</th><th>التاريخ</th><th>المبلغ</th><th>التفاصيل</th><th class="no-print">الإجراءات</th></tr></thead><tbody>${d.rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.company_name)}</b></td><td>${r.receipt_no??'—'}</td><td>${r.receipt_date||'—'}</td><td>${money(r.amount)}</td><td>${esc(r.details||'—')}</td><td class="actions no-print">${canWrite()?`<button class="btn tiny" onclick="showVoucherForm(${r.id})">تعديل</button><button class="btn tiny danger" onclick="deleteVoucher(${r.id})">حذف</button>`:'مشاهدة فقط'}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">لا توجد نتائج مطابقة</td></tr>'}</tbody></table></div></section>
  ${canWrite()?`<section class="card importbox no-print"><div><h2>استيراد من ملف Excel</h2><p>يمكن استيراد ملف XLSX بنفس الهيكل الحالي وسيُطبّق التحقق قبل الحفظ.</p></div><form id="importForm" onsubmit="importExcel(event)"><input type="file" id="excelFile" accept=".xlsx" required><button class="btn">استيراد XLSX</button></form></section>`:''}`;
}
function applyVoucherFilters(){state.voucherFilters={company_id:val('fCompany'),date_from:val('fDateFrom'),date_to:val('fDateTo'),receipt_from:val('fReceiptFrom'),receipt_to:val('fReceiptTo'),q:val('fQ')};renderVouchers()}
function clearVoucherFilters(){state.voucherFilters={};renderVouchers()}
async function deleteVoucher(id){if(!confirm('هل تريد حذف هذا السجل؟'))return;try{const d=await api('/api/vouchers/'+id,{method:'DELETE'});toast(d.message);renderVouchers()}catch(e){toast(e.message,'error')}}
async function importExcel(e){e.preventDefault();const file=$('#excelFile').files[0];if(!file)return;const fd=new FormData();fd.append('excel_file',file);try{const d=await api('/api/import-xlsx',{method:'POST',body:fd});toast(d.message+(d.errors?.length?' | '+d.errors.join(' | '):''),d.errors?.length?'error':'');renderVouchers()}catch(e){toast(e.message,'error')}}

async function showVoucherForm(id=null){
  await refreshCompanies();
  let r={company_id:'',receipt_no:'',receipt_date:'',amount:'',details:''};
  if(id)r=await api('/api/vouchers/'+id);
  openModal(`<h2>${id?'تعديل الوصل / السجل':'إدخال وصل / سجل جديد'}</h2><p class="muted">يتم فحص رقم الوصل والتاريخ قبل السماح بالحفظ.</p><form id="voucherForm" class="formgrid" onsubmit="saveVoucher(event,${id||'null'})"><label>اسم الشركة *<select id="vCompany" required><option value="">اختر الشركة</option>${companyOptions(r.company_id)}</select></label><label>رقم الوصل<input type="number" min="0" step="1" id="vReceipt" value="${r.receipt_no??''}" placeholder="يمكن تركه فارغاً"></label><label>التاريخ<input type="date" id="vDate" value="${r.receipt_date||''}"></label><label>المبلغ<input type="number" step="0.01" id="vAmount" value="${r.amount??''}"></label><label class="full">التفاصيل<textarea id="vDetails" rows="4">${esc(r.details||'')}</textarea></label><div id="ruleStatus" class="rule-status full">أدخل الشركة ورقم الوصل/التاريخ للتحقق.</div><div class="formactions full"><button class="btn primary big">${id?'حفظ التعديلات':'حفظ السجل'}</button><button type="button" class="btn big" onclick="closeModal()">إلغاء</button></div></form><div class="card" style="margin-top:15px;background:#fbfcff"><b>القاعدة:</b> رقم الوصل لا يتكرر داخل الشركة. عند وجود تاريخ يجب أن تتزايد التواريخ مع تزايد أرقام الوصولات لنفس الشركة.</div>`);
  ['vCompany','vReceipt','vDate'].forEach(x=>document.getElementById(x).addEventListener('input',()=>checkRule(id)));
  checkRule(id);
}
let checkTimer;function checkRule(id){clearTimeout(checkTimer);checkTimer=setTimeout(async()=>{const s=$('#ruleStatus');if(!val('vCompany')){s.className='rule-status';s.textContent='اختر الشركة أولاً.';return}const q=new URLSearchParams({company_id:val('vCompany'),receipt_no:val('vReceipt'),receipt_date:val('vDate')});if(id)q.set('exclude_id',id);try{const d=await api('/api/check?'+q);s.className='rule-status ok';s.textContent='✓ '+d.message}catch(e){s.className='rule-status bad';s.textContent='⚠ '+e.message}},250)}
async function saveVoucher(e,id){e.preventDefault();const body={company_id:val('vCompany'),receipt_no:val('vReceipt'),receipt_date:val('vDate'),amount:val('vAmount'),details:val('vDetails')};try{const d=await api(id?'/api/vouchers/'+id:'/api/vouchers',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});toast(d.message);closeModal();state.page==='dashboard'?renderDashboard():renderVouchers()}catch(e){toast(e.message,'error')}}

async function renderReports(){
  setHeader('تقرير شركة','ابحث باسم الشركة وحدد الفترة لعرض كل وصولاتها وطباعة تقريرها فقط',`<a class="btn" href="/backup.json">نسخة احتياطية</a>`);
  await refreshCompanies();
  const selected=state.companies.find(c=>String(c.id)===String(state.reportCompanyId));
  let reportHtml='';
  if(selected){
    try{const d=await api(`/api/company-report/${selected.id}?${buildQuery({date_from:state.reportFrom,date_to:state.reportTo})}`);reportHtml=companyReportHtml(d)}catch(e){reportHtml=`<section class="card"><div class="empty">${esc(e.message)}</div></section>`}
  }
  $('#view').innerHTML=`
    <section class="card no-print">
      <div class="company-report-filter">
        <label>اسم الشركة
          <input id="reportCompanyName" list="companyReportList" value="${esc(selected?.name||'')}" placeholder="اكتب أو اختر اسم الشركة">
          <datalist id="companyReportList">${state.companies.map(c=>`<option value="${esc(c.name)}"></option>`).join('')}</datalist>
        </label>
        <label>من تاريخ<input id="reportFrom" type="date" value="${esc(state.reportFrom)}"></label>
        <label>إلى تاريخ<input id="reportTo" type="date" value="${esc(state.reportTo)}"></label>
        <div class="filterBtns"><button class="btn primary" onclick="searchCompanyReport()">عرض التقرير</button><button class="btn" onclick="clearCompanyReport()">مسح</button></div>
      </div>
    </section>
    ${reportHtml||`<section class="card report-placeholder"><div class="report-placeholder-icon">◫</div><h2>اختر الشركة لعرض تقريرها</h2><p>سيظهر اسم الشركة، الفترة، مجموع الصرفيات، عدد الوصولات وجميع تفاصيل الوصولات.</p></section>`}`;
}
function companyReportHtml(d){
  const period=(d.date_from||d.date_to)?`${d.date_from||'البداية'} إلى ${d.date_to||'اليوم'}`:'جميع التواريخ';
  return `<section class="card company-report-print" id="companyReportPrint">
    <div class="report-letter-head">
      <div><div class="report-directorate">مديرية مجاري كربلاء</div><div class="report-dept">شعبة التدقيق</div></div>
      <div class="report-title-block"><h2>تقرير صرفيات شركة</h2><strong>${esc(d.company.name)}</strong></div>
      <div class="report-date">الفترة<br><b>${esc(period)}</b></div>
    </div>
    <div class="kpis report-company-kpis">
      <div class="kpi"><span>اسم الشركة</span><strong class="report-company-name">${esc(d.company.name)}</strong><small>الشركة المحددة</small></div>
      <div class="kpi"><span>مجموع الصرفيات</span><strong>${money(d.total)}</strong><small>ضمن الفترة المحددة</small></div>
      <div class="kpi"><span>عدد السجلات</span><strong>${d.rows.length}</strong><small>السجلات المطابقة</small></div>
      <div class="kpi"><span>الوصولات المرقمة</span><strong>${d.numbered_count}</strong><small>تحتوي رقم وصل</small></div>
    </div>
    <div class="report-print-actions no-print"><button class="btn primary" onclick="printSelectedCompany()">طباعة هذه الشركة فقط</button></div>
    <div class="tablewrap"><table><thead><tr><th>ت</th><th>رقم الوصل</th><th>التاريخ</th><th>المبلغ</th><th>التفاصيل</th></tr></thead><tbody>${d.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.receipt_no??'—'}</td><td>${r.receipt_date||'—'}</td><td>${money(r.amount)}</td><td>${esc(r.details||'—')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">لا توجد وصولات ضمن الفترة المحددة</td></tr>'}</tbody><tfoot><tr><th colspan="3">المجموع</th><th>${money(d.total)}</th><th></th></tr></tfoot></table></div>
    <div class="report-signatures"><div>إعداد التقرير<br><span>________________</span></div><div>شعبة التدقيق<br><span>________________</span></div></div>
  </section>`;
}
async function searchCompanyReport(){
  const name=val('reportCompanyName').trim();
  if(!name){toast('يرجى إدخال اسم الشركة.','error');return}
  const needle=name.toLowerCase();
  let c=state.companies.find(x=>x.name.trim().toLowerCase()===needle);
  if(!c){
    const matches=state.companies.filter(x=>x.name.trim().toLowerCase().includes(needle));
    if(matches.length===1)c=matches[0];
    else if(matches.length>1){toast('يوجد أكثر من اسم مطابق؛ اختر الشركة من القائمة.','error');return}
  }
  if(!c){toast('اسم الشركة غير موجود.','error');return}
  const from=val('reportFrom'),to=val('reportTo');
  if(from&&to&&from>to){toast('تاريخ البداية يجب أن يكون أقدم من تاريخ النهاية.','error');return}
  state.reportCompanyId=c.id;state.reportFrom=from;state.reportTo=to;renderReports();
}
function clearCompanyReport(){state.reportCompanyId='';state.reportFrom='';state.reportTo='';renderReports()}
function printSelectedCompany(){document.body.classList.add('company-print-mode');window.print();setTimeout(()=>document.body.classList.remove('company-print-mode'),400)}
window.addEventListener('afterprint',()=>document.body.classList.remove('company-print-mode'));

function chartPalette(i){return ['#2563eb','#14b8a6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#84cc16','#ec4899','#64748b','#f97316'][i%10]}
function donutBackground(rows,total){if(!total)return '#e8eef8';let pos=0;const parts=[];rows.forEach((r,i)=>{const pct=((Number(r.total_amount)||0)/total)*100;if(pct<=0)return;const start=pos,end=pos+pct;parts.push(`${chartPalette(i)} ${start.toFixed(3)}% ${end.toFixed(3)}%`);pos=end});return parts.length?`conic-gradient(${parts.join(',')})`:'#e8eef8'}
async function renderCharts(){
  setHeader('المخططات','مقارنة مبالغ الصرف بين الشركات بصريًا');
  const d=await api('/api/reports?'+buildQuery({date_from:state.chartFrom,date_to:state.chartTo}));
  const trend=await api('/api/monthly-trend?'+buildQuery({date_from:state.chartFrom,date_to:state.chartTo}));
  const rows=d.summary.filter(r=>Number(r.total_amount)>0);
  const max=Math.max(...rows.map(r=>Number(r.total_amount)||0),1);
  const grand=Number(d.grand_total)||0;
  const donut=donutBackground(rows,grand);
  $('#view').innerHTML=`
    <section class="card no-print"><div class="chart-filter"><label>من تاريخ<input id="chartFrom" type="date" value="${esc(state.chartFrom)}"></label><label>إلى تاريخ<input id="chartTo" type="date" value="${esc(state.chartTo)}"></label><div class="filterBtns"><button class="btn primary" onclick="applyChartFilter()">تطبيق</button><button class="btn" onclick="clearChartFilter()">مسح</button></div></div></section>
    <div class="kpis reportkpis"><div class="kpi"><span>إجمالي المبالغ</span><strong>${money(grand)}</strong><small>ضمن الفترة المحددة</small></div><div class="kpi"><span>الشركات ذات المبالغ</span><strong>${rows.length}</strong><small>شركة لديها صرفيات</small></div></div>
    <div class="grid2 charts-grid">
      <section class="card"><div class="card-head"><h2>مخطط المبالغ لكل شركة</h2><span class="badge">مقارنة مباشرة</span></div><div class="company-bars-chart">${rows.map((r,i)=>`<div class="company-bar-row"><div class="company-bar-label"><span>${esc(r.name)}</span><b>${money(r.total_amount)}</b></div><div class="company-bar-track"><i style="width:${((Number(r.total_amount)||0)/max*100).toFixed(2)}%;background:${chartPalette(i)}"></i></div></div>`).join('')||'<div class="empty">لا توجد مبالغ لعرضها</div>'}</div></section>
      <section class="card"><div class="card-head"><h2>نسبة كل شركة من الإجمالي</h2><span class="badge">توزيع نسبي</span></div><div class="donut-wrap"><div class="donut" style="background:${donut}"><div class="donut-hole"><span>الإجمالي</span><strong>${money(grand)}</strong></div></div><div class="donut-legend">${rows.map((r,i)=>`<div><i style="background:${chartPalette(i)}"></i><span>${esc(r.name)}</span><b>${grand?((Number(r.total_amount)||0)/grand*100).toFixed(1):'0.0'}%</b></div>`).join('')||'<div class="empty">لا توجد بيانات</div>'}</div></div></section>
    </div>
    <section class="card" style="margin-top:18px"><div class="card-head"><h2>اتجاه الصرف الشهري</h2><span class="badge">حركة زمنية</span></div><div class="monthly-chart">${trend.length?trend.map(x=>{const tm=Math.max(...trend.map(z=>Number(z.total)||0),1);return `<div class="month-col"><div class="month-value">${money(x.total)}</div><div class="month-bar-wrap"><i style="height:${((Number(x.total)||0)/tm*100).toFixed(1)}%"></i></div><b>${esc(x.month)}</b></div>`}).join(''):'<div class="empty">لا توجد بيانات مؤرخة ضمن الفترة</div>'}</div></section>`;
}
function applyChartFilter(){const from=val('chartFrom'),to=val('chartTo');if(from&&to&&from>to){toast('تاريخ البداية يجب أن يكون أقدم من تاريخ النهاية.','error');return}state.chartFrom=from;state.chartTo=to;renderCharts()}
function clearChartFilter(){state.chartFrom='';state.chartTo='';renderCharts()}


async function renderBackup(){
  setHeader('النسخ الاحتياطي والاستعادة','تصدير البيانات واستعادتها عند الحاجة');
  $('#view').innerHTML=`<div class="backupgrid"><section class="card"><h2>Excel</h2><p class="muted">نسخة Excel للوصولات والتقارير.</p><a class="btn primary" href="/backup.xlsx">تصدير Excel</a></section><section class="card"><h2>CSV</h2><p class="muted">تصدير جميع النتائج بصيغة CSV.</p><a class="btn primary" href="/export.csv">تصدير CSV</a></section>${isAdmin()?`<section class="card"><h2>DB كامل</h2><p class="muted">نسخة كاملة من الشركات والوصولات مخصصة للاسترجاع.</p><a class="btn primary" href="/backup.db">تصدير DB</a></section>`:''}</div>${isAdmin()?`<section class="card" style="margin-top:18px"><h2>استعادة ملف DB</h2><p class="muted">هذه العملية تستبدل بيانات الشركات والوصولات الحالية. المستخدمون لا يتم حذفهم.</p><form class="stack" onsubmit="restoreDB(event)"><input type="file" id="restoreDBFile" accept=".db,.json" required><button class="btn danger">استعادة النسخة</button></form></section>`:`<section class="card" style="margin-top:18px"><div class="notice">صلاحية المشاهدة تسمح بالتصدير، بينما استعادة قاعدة البيانات متاحة لمدير النظام فقط.</div></section>`}`;
}
async function restoreDB(e){e.preventDefault();if(!confirm('سيتم استبدال بيانات الشركات والوصولات الحالية. هل تريد المتابعة؟'))return;const f=$('#restoreDBFile').files[0];if(!f)return;const fd=new FormData();fd.append('backup_file',f);try{const d=await api('/api/restore-db',{method:'POST',body:fd});toast(d.message);state.page='dashboard';render()}catch(e){toast(e.message,'error')}}

async function renderUsers(){
  if(!isAdmin()){state.page='dashboard';return render()}
  setHeader('إدارة المستخدمين','إنشاء الحسابات وتحديد الصلاحيات وإعادة تعيين كلمات المرور');
  const users=await api('/api/users');
  $('#view').innerHTML=`<div class="grid2 narrow"><section class="card"><h2>مستخدم جديد</h2><form class="stack" onsubmit="createUser(event)"><label>اسم المستخدم<input id="uUsername" required minlength="3" placeholder="مثال: audit01"></label><label>الاسم الظاهر<input id="uDisplay" required placeholder="اسم الموظف"></label><label>الصلاحية<select id="uRole"><option value="viewer">مشاهدة فقط</option><option value="editor">إدخال وتعديل</option><option value="admin">مدير النظام</option></select></label><label>كلمة المرور المؤقتة<input id="uPassword" type="password" required minlength="8" autocomplete="new-password"></label><button class="btn primary">إنشاء المستخدم</button></form></section><section class="card"><div class="card-head"><h2>الحسابات</h2><span class="badge">${users.length} مستخدم</span></div><div class="tablewrap"><table><thead><tr><th>المستخدم</th><th>الاسم</th><th>الصلاحية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>${users.map(u=>`<tr><td><b>${esc(u.username)}</b></td><td>${esc(u.display_name)}</td><td>${esc(u.role_label)}</td><td>${u.active?'فعال':'معطل'}</td><td class="actions"><button class="btn tiny" onclick='editUser(${JSON.stringify(u)})'>الصلاحية/الحالة</button><button class="btn tiny" onclick="resetUserPassword(${u.id},'${esc(u.username)}')">تعيين باسورد</button></td></tr>`).join('')}</tbody></table></div></section></div><section class="card" style="margin-top:18px"><h2>مستويات الصلاحية</h2><div class="permission-grid"><div><b>مدير النظام</b><span>جميع الصلاحيات + المستخدمون والاستعادة.</span></div><div><b>إدخال وتعديل</b><span>الشركات والوصولات والاستيراد والتقارير.</span></div><div><b>مشاهدة فقط</b><span>عرض البيانات والتقارير والمخططات والطباعة والتصدير فقط.</span></div></div></section>`;
}
async function createUser(e){e.preventDefault();try{const d=await api('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:val('uUsername'),display_name:val('uDisplay'),role:val('uRole'),password:val('uPassword')})});toast(d.message);renderUsers()}catch(e){toast(e.message,'error')}}
function editUser(u){openModal(`<h2>تعديل المستخدم ${esc(u.username)}</h2><form class="stack" onsubmit="saveUserEdit(event,${u.id})"><label>الاسم الظاهر<input id="euDisplay" value="${esc(u.display_name)}" required></label><label>الصلاحية<select id="euRole"><option value="viewer" ${u.role==='viewer'?'selected':''}>مشاهدة فقط</option><option value="editor" ${u.role==='editor'?'selected':''}>إدخال وتعديل</option><option value="admin" ${u.role==='admin'?'selected':''}>مدير النظام</option></select></label><label class="toggleline"><input id="euActive" type="checkbox" ${u.active?'checked':''}> الحساب فعال</label><button class="btn primary">حفظ</button></form>`)}
async function saveUserEdit(e,id){e.preventDefault();try{const d=await api('/api/users/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({display_name:val('euDisplay'),role:val('euRole'),active:$('#euActive').checked})});toast(d.message);closeModal();renderUsers()}catch(e){toast(e.message,'error')}}
function resetUserPassword(id,username){openModal(`<h2>تعيين كلمة مرور جديدة</h2><p class="muted">للمستخدم: <b>${username}</b></p><form class="stack" onsubmit="doResetPassword(event,${id})"><label>كلمة المرور الجديدة<input id="resetPassword" type="password" minlength="8" required autocomplete="new-password"></label><button class="btn primary">حفظ كلمة المرور</button></form>`)}
async function doResetPassword(e,id){e.preventDefault();try{const d=await api('/api/users/'+id+'/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({new_password:val('resetPassword')})});toast(d.message);closeModal()}catch(e){toast(e.message,'error')}}

function renderAccount(){
  setHeader('حسابي','تغيير كلمة المرور الخاصة بحسابك'); const u=state.user;
  $('#view').innerHTML=`<div class="grid2 narrow"><section class="card"><h2>بيانات الحساب</h2><div class="account-info"><b>${esc(u.display_name)}</b><span>اسم المستخدم: ${esc(u.username)}</span><span>الصلاحية: ${esc(u.role_label)}</span></div></section><section class="card"><h2>تغيير كلمة المرور</h2><form class="stack" onsubmit="changeMyPassword(event)"><label>كلمة المرور الحالية<input id="cpCurrent" type="password" required autocomplete="current-password"></label><label>كلمة المرور الجديدة<input id="cpNew" type="password" minlength="8" required autocomplete="new-password"></label><label>تأكيد كلمة المرور<input id="cpConfirm" type="password" minlength="8" required autocomplete="new-password"></label><button class="btn primary">تغيير كلمة المرور</button></form></section></div>`;
}
async function changeMyPassword(e){e.preventDefault();if(val('cpNew')!==val('cpConfirm')){toast('تأكيد كلمة المرور غير مطابق.','error');return}try{const d=await api('/api/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current_password:val('cpCurrent'),new_password:val('cpNew')})});state.authenticated=false;state.user=null;state.csrf='';renderLogin();toast(d.message)}catch(e){toast(e.message,'error')}}

function renderRules(){
  setHeader('قواعد التحقق','القواعد المطبقة على أرقام الوصولات والتواريخ');
  $('#view').innerHTML=`<section class="card prose"><h2>القواعد المطبقة في البرنامج</h2><ol><li><b>الشركات مستقلة:</b> رقم الوصل في شركة لا يؤثر على الشركة الأخرى.</li><li><b>منع التكرار:</b> لا يمكن تكرار رقم وصل داخل الشركة نفسها.</li><li><b>رقم الوصل يمكن أن يكون فارغًا:</b> طبقًا للمعادلة الأصلية.</li><li><b>التاريخ مرتبط بالوصل:</b> لا يمكن إدخال تاريخ بدون رقم وصل.</li><li><b>ترتيب صارم للتواريخ:</b> الوصل ذو الرقم الأصغر يجب أن يكون أقدم تاريخًا، والوصل ذو الرقم الأكبر يجب أن يكون أحدث تاريخًا.</li><li><b>مجموع الشركة:</b> مجموع جميع المبالغ المسجلة للشركة.</li></ol><div class="formula">Excel: COUNTIFS + SUMIF → Online DB validation + SQL SUM()</div></section>`;
}

window.nav=nav;window.showVoucherForm=showVoucherForm;window.restoreDB=restoreDB;window.createUser=createUser;window.editUser=editUser;window.saveUserEdit=saveUserEdit;window.resetUserPassword=resetUserPassword;window.doResetPassword=doResetPassword;window.changeMyPassword=changeMyPassword;window.addCompany=addCompany;window.renameCompany=renameCompany;window.deleteCompany=deleteCompany;window.applyVoucherFilters=applyVoucherFilters;window.clearVoucherFilters=clearVoucherFilters;window.deleteVoucher=deleteVoucher;window.importExcel=importExcel;window.saveVoucher=saveVoucher;window.searchCompanyReport=searchCompanyReport;window.clearCompanyReport=clearCompanyReport;window.printSelectedCompany=printSelectedCompany;window.applyChartFilter=applyChartFilter;window.clearChartFilter=clearChartFilter;
applyAuthState();
