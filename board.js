/* qa-list-to-jira renderer (generic, обезличен). Хостится на публичном CDN (jsdelivr из GitHub).
   НЕ содержит внутренних данных: devs/parent/list_id/template_list/owner/pull_channel приходят из DATA.
   Экспортирует:
     window.renderQaBoard(DATA) — тяжёлая редактируемая доска находок.
     window.renderQaBar()       — компактная панель действий (читает localStorage('qa_flow_state')).
   Использование:
     доска:  <div id="qaRoot"></div><p id="qaEmpty"></p> + кнопки b_*  +<script>const DATA={...}</script>
             <script src="…/board.js"></script><script>renderQaBoard(DATA)</script>
     панель: <div id="qaBar"></div>
             <script src="…/board.js"></script><script>renderQaBar()</script>
   sendPrompt — глобальная функция рантайма виджета. */
(function(){
  var TYPES=["bug","task","question"],PRIOS=["low","med","high"],ENVS=["stage","prodlike","prod"],SEVS=["Minor","Major","Critical","Blocker"],RELS=["blocks","relates_to"];
  function g(id){return document.getElementById(id)}
  function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function opts(a,sel){return a.map(function(v){var x=Array.isArray(v)?v[0]:v,l=Array.isArray(v)?v[1]:v;return '<option value="'+x+'"'+(x===sel?' selected':'')+'>'+esc(l)+'</option>'}).join('')}
  function fld(l,id,o){return '<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:12px;color:var(--color-text-secondary)">'+l+'</label><select id="'+id+'">'+o+'</select></div>'}
  function lsGet(){try{return localStorage.getItem('qa_flow_state')}catch(e){return null}}

  window.renderQaBoard=function(D){
    var DEVS=D.devs||[];
    var root=g('qaRoot');
    function card(r,i){return '<div style="background:var(--color-background-primary);border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-lg);padding:1rem 1.25rem">'
     +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="font-weight:500;font-size:15px">'+esc(r.id||('#'+(i+1)))+'</span>'
     +'<span id="bdg'+i+'" style="font-size:12px;background:var(--color-background-info);color:var(--color-text-info);padding:2px 10px;border-radius:var(--border-radius-md)">'+esc(r['Тип'])+'</span>'
     +'<span style="margin-left:auto;font-size:12px;color:var(--color-text-tertiary);font-family:var(--font-mono)">'+esc(r.item_id||'новый')+'</span>'
     +'<button id="rm'+i+'" aria-label="Скрыть карточку из вида" title="Скрыть из вида (лист не трогается)" style="padding:4px 8px;min-width:auto"><i class="ti ti-trash" aria-hidden="true"></i></button></div>'
     +'<label style="font-size:12px;color:var(--color-text-secondary)">Name</label><input id="n'+i+'" type="text" style="width:100%;margin:4px 0 12px" value="'+esc(r.Name)+'">'
     +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px 12px;margin-bottom:12px">'
     +fld('Тип','t'+i,opts(TYPES,r['Тип']))+fld('Приоритет','p'+i,opts(PRIOS,r['Приоритет']))+fld('Окружение','e'+i,opts(ENVS,r['Окружение']))
     +fld('Severity (для bug)','s'+i,opts(SEVS,r['Severity']||'Minor'))+fld('Developer','d'+i,opts(DEVS,r['Developer']))+fld('Связь','r'+i,opts(RELS,r['Связь']))+'</div>'
     +'<label style="font-size:12px;color:var(--color-text-secondary)">Описание</label><textarea id="ds'+i+'" style="width:100%;min-height:150px;margin:4px 0 12px;font-family:var(--font-mono);font-size:12px">'+esc(r['Описание'])+'</textarea>'
     +'<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--color-text-secondary)"><input id="c'+i+'" type="checkbox" style="width:auto"'+(r['Completed']?' checked':'')+'> Completed</label></div>'}
    function syncFromDom(){D.rows.forEach(function(r,i){if(!g('n'+i))return;r.Name=g('n'+i).value;r['Тип']=g('t'+i).value;r['Приоритет']=g('p'+i).value;r['Окружение']=g('e'+i).value;r['Severity']=g('s'+i).value;r['Developer']=g('d'+i).value;r['Связь']=g('r'+i).value;r['Completed']=g('c'+i).checked;r['Описание']=g('ds'+i).value})}
    function bind(){D.rows.forEach(function(r,i){g('t'+i).addEventListener('change',function(e){g('bdg'+i).textContent=e.target.value});g('rm'+i).addEventListener('click',function(){syncFromDom();D.rows.splice(i,1);render()});['n'+i,'t'+i,'p'+i,'e'+i,'s'+i,'d'+i,'r'+i,'c'+i,'ds'+i].forEach(function(id){var el=g(id);if(el){el.addEventListener('input',persist);el.addEventListener('change',persist)}})})}
    function render(){root.innerHTML=D.rows.map(card).join('');if(g('qaEmpty'))g('qaEmpty').style.display=D.rows.length?'none':'block';bind();persist()}
    function state(){return {list_id:D.list_id,parent:D.parent,template_list:D.template_list,owner:D.owner,pull_channel:D.pull_channel,devs:D.devs,rows:D.rows.map(function(r,i){return {id:r.id,item_id:r.item_id,Name:g('n'+i).value,'Тип':g('t'+i).value,'Приоритет':g('p'+i).value,'Окружение':g('e'+i).value,'Severity':g('s'+i).value,'Developer':g('d'+i).value,'Связь':g('r'+i).value,'Completed':g('c'+i).checked,'Описание':g('ds'+i).value}})}}
    function persist(){try{localStorage.setItem('qa_flow_state',JSON.stringify(state()))}catch(e){}}
    var hasList=!!D.list_id;
    if(g('b_create'))g('b_create').style.display=hasList?'none':'flex';
    if(g('b_update'))g('b_update').addEventListener('click',function(){sendPrompt('Обнови лист по этим АКТУАЛЬНЫМ полям из доски (источник правды — это состояние, перезапиши строки; доску НЕ показывай, ответь текстом-итогом + панель кнопок): '+JSON.stringify(state()))});
    if(g('b_jira'))g('b_jira').addEventListener('click',function(){sendPrompt('Сначала синхронизируй лист с этими АКТУАЛЬНЫМИ полями из доски, затем заведи незакрытые bug/task в Jira, слинкуй с '+D.parent+', проставь в листе ссылку и Completed (доску НЕ показывай, ответь текстом-итогом + панель кнопок). Поля: '+JSON.stringify(state()))});
    if(g('b_pull'))g('b_pull').addEventListener('click',function(){sendPrompt('Подтяни изменения: прочитай лист '+D.list_id+' и треды записей (канал '+D.pull_channel+'), обнови доску под состояние листа и покажи, что изменилось.')});
    if(g('b_create'))g('b_create').addEventListener('click',function(){sendPrompt('Создай новый Slack-лист (копия шаблона '+D.template_list+', родитель '+D.parent+', владелец '+D.owner+') по этим находкам из доски и пришли id. Поля: '+JSON.stringify(state()))});
    render();
  };

  window.renderQaBar=function(){
    var bar=g('qaBar'); if(!bar) return;
    function need(){sendPrompt('Сначала покажи доску qa_flow_board — нет сохранённого состояния полей в localStorage.')}
    var s=lsGet(),hl=null; if(s){try{hl=!!JSON.parse(s).list_id}catch(e){hl=null}}
    function B(id,icon,label){return '<button id="'+id+'" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px"><i class="ti '+icon+'" aria-hidden="true"></i> '+label+' ↗</button>'}
    var html=B('qb_show','ti-layout-board','Показать доску');
    if(hl===true){html+=B('qb_update','ti-list-check','Обновить лист')+B('qb_jira','ti-ticket','Завести в Jira')+B('qb_pull','ti-refresh','Подтянуть из листа')}
    if(hl!==true){html+=B('qb_create','ti-plus','Создать лист')}
    bar.style.display='grid';bar.style.gridTemplateColumns='repeat(auto-fit,minmax(140px,1fr))';bar.style.gap='8px';bar.style.padding='.5rem 0';
    bar.innerHTML=html;
    g('qb_show').addEventListener('click',function(){var x=lsGet();sendPrompt('Покажи обновлённую редактируемую доску qa_flow_board. Пересобери её: учти мои правки из предыдущего виджета и комментарии/замечания из нашей переписки (в т.ч. правки описания). Лист НЕ обновляй.'+(x?' Мои правки из доски: '+x:''))});
    if(g('qb_update'))g('qb_update').addEventListener('click',function(){var x=lsGet();if(!x)return need();sendPrompt('Обнови лист по этим АКТУАЛЬНЫМ полям из доски (источник правды — это состояние, перезапиши строки; доску НЕ показывай и НЕ пересобирай — ответь текстом-итогом + панель кнопок): '+x)});
    if(g('qb_jira'))g('qb_jira').addEventListener('click',function(){var x=lsGet();if(!x)return need();sendPrompt('Сначала синхронизируй лист с этими АКТУАЛЬНЫМИ полями из доски, затем заведи незакрытые bug/task в Jira (Betting, SportFrame), слинкуй с родителем из полей, проставь в листе ссылку и Completed (доску НЕ показывай и НЕ пересобирай — ответь текстом-итогом + панель кнопок). Поля: '+x)});
    if(g('qb_pull'))g('qb_pull').addEventListener('click',function(){var x=lsGet();if(!x)return need();sendPrompt('Подтяни изменения: прочитай лист и треды записей (канал = list_id с заменой первой F на C) из этих полей, сверь со списком и покажи текстом, что изменилось (доску НЕ пересобирай — только текст + панель кнопок). Поля: '+x)});
    if(g('qb_create'))g('qb_create').addEventListener('click',function(){var x=lsGet();if(!x)return need();sendPrompt('Создай новый Slack-лист (копия шаблона из полей, родитель и владелец из полей) по этим находкам и пришли id (доску НЕ показывай — текст + панель кнопок). Поля: '+x)});
  };
})();
