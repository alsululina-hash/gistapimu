// Страница «Без интернета»: сохранение сайта в кэш браузера, установка как приложения, архив для компьютера.
// Список файлов (self.OFFLINE) создаётся скриптом make_offline.py в файле offline_list.js.
(function(){
const $=(s,r=document)=>r.querySelector(s);
const O=self.OFFLINE||{files:[],media:[],version:'',zipMB:0};
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;const b=$('#off-install');if(b)b.hidden=false});

if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

async function cachedCount(){
  if(!('caches' in self))return {n:0,total:O.files.length+O.media.length};
  let n=0;
  for(const u of [...O.files,...O.media]){ if(await caches.match(u))n++ }
  return {n,total:O.files.length+O.media.length};
}

async function saveAll(btn,bar,label){
  btn.disabled=true;
  try{ if(navigator.storage&&navigator.storage.persist) await navigator.storage.persist(); }catch(e){}
  const core=await caches.open('core-'+O.version), media=await caches.open('media-'+O.mediaVersion);
  const all=[...O.files.map(u=>[u,core]),...O.media.map(u=>[u,media])];
  let done=0,fail=0;
  for(const [u,c] of all){
    try{
      if(!(await c.match(u))){ const r=await fetch(u,{cache:'reload'}); if(!r.ok) throw 0; await c.put(u,r) }
    }catch(e){fail++}
    done++; bar.style.width=(done/all.length*100)+'%'; label.textContent=`Сохраняю… ${done} из ${all.length}`;
  }
  label.textContent=fail?`Не удалось сохранить ${fail} файлов. Проверь интернет и нажми ещё раз.`:'Готово: сайт полностью сохранён на этом устройстве и откроется без интернета.';
  btn.disabled=false; btn.textContent=fail?'Повторить':'Обновить сохранённую копию';
}

window.renderOffline=function(m){
  const isFile=location.protocol==='file:';
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const canCache='serviceWorker' in navigator && 'caches' in self && !isFile;
  m.innerHTML=`<div class="ch-head"><div><div class="eyebrow">Без интернета</div><h2>Скачать платформу на устройство</h2></div></div>
  <div class="off-grid">
   <section class="card off-card">
    <h3>Телефон или планшет</h3>
    ${isFile?`<p>Сейчас открыта скачанная копия с диска — интернет для неё не нужен.</p>`:canCache?`
    <p>Нажми кнопку: все препараты, электронограммы, теория и тесты сохранятся в браузере. После этого сайт откроется по той же ссылке даже без интернета.</p>
    <button class="btn" id="off-save">Сохранить сайт на это устройство</button>
    <div class="off-bar"><i id="off-bar"></i></div><p class="off-status" id="off-status">Проверяю, что уже сохранено…</p>
    <h4>Чтобы открывать как приложение</h4>
    ${ios?`<ol class="qlist"><li>Открой сайт в Safari.</li><li>Нажми «Поделиться» (квадрат со стрелкой).</li><li>Выбери «На экран „Домой“».</li></ol>
      <p class="off-note">На iPhone сохранённые данные надёжнее хранятся, если сайт добавлен на экран «Домой»: иначе Safari может удалить их, если долго не открывать сайт.</p>`
     :`<button class="btn ghost" id="off-install" hidden>Установить как приложение</button>
      <ol class="qlist"><li>Android, Chrome: меню ⋮ → «Добавить на главный экран» или «Установить приложение».</li><li>iPhone, Safari: «Поделиться» → «На экран „Домой“».</li></ol>`}
    `:`<p>Этот браузер не умеет сохранять сайт. Открой ссылку в Chrome или Safari либо скачай архив.</p>`}
   </section>
   <section class="card off-card">
    <h3>Компьютер</h3>
    <p>Скачай архив, распакуй его в любую папку и открой файл <b>index.html</b> двойным щелчком. Всё работает без интернета, нужен только браузер.</p>
    ${isFile?'':`<a class="btn" href="gistoatlas_offline.zip" download>Скачать архив (${O.zipMB} МБ)</a>`}
    <p class="off-note">Архив обновляется вместе с сайтом. Если на сайте появились новые темы, скачай архив заново.</p>
    <p class="off-note">Без интернета вместо фирменных шрифтов будет обычный шрифт системы — на работу платформы это не влияет. Результаты тестов в скачанной копии хранятся отдельно от сайта.</p>
   </section>
  </div>`;
  const b=$('#off-install'); if(b){ if(installEvt)b.hidden=false; b.onclick=async()=>{ if(!installEvt)return; installEvt.prompt(); installEvt=null; b.hidden=true } }
  const save=$('#off-save');
  if(save){
    const st=$('#off-status'),bar=$('#off-bar');
    cachedCount().then(({n,total})=>{ bar.style.width=(n/total*100)+'%';
      st.textContent=n>=total?'Сайт уже полностью сохранён на этом устройстве.':n?`Сохранено ${n} из ${total} файлов. Нажми кнопку, чтобы докачать остальное.`:'Пока ничего не сохранено.';
      if(n>=total)save.textContent='Обновить сохранённую копию'; });
    save.onclick=()=>saveAll(save,bar,st);
  }
};
})();
