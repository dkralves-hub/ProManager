/* PWA: registro do service worker, atualização automática e instalação */
(function(){
  'use strict';
  var standalone=function(){return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true};
  var ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var ehIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var promptInstalar=null,barra=null,reiniciarPendente=false,tinhaControlador=!!(navigator.serviceWorker&&navigator.serviceWorker.controller);

  function mostraBarra(html,acaoRotulo,acao,chave){
    if(barra||standalone())return;
    if(chave&&ls.get(chave)==='1')return;
    barra=document.createElement('div');barra.id='pwaBar';
    barra.innerHTML='<span>'+html+'</span>'+(acaoRotulo?'<button type="button" class="ok">'+acaoRotulo+'</button>':'')+'<button type="button" class="x" aria-label="Fechar">✕</button>';
    document.body.appendChild(barra);
    var fecha=function(){if(barra){barra.remove();barra=null}if(chave)ls.set(chave,'1')};
    barra.querySelector('.x').onclick=fecha;
    var ok=barra.querySelector('.ok');if(ok)ok.onclick=function(){fecha();acao&&acao()};
  }
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();promptInstalar=e;
    mostraBarra('📲 Instale o Manager como aplicativo','Instalar',function(){promptInstalar.prompt();promptInstalar.userChoice.finally(function(){promptInstalar=null})},'pwaInstalarVisto');
  });
  window.addEventListener('appinstalled',function(){if(barra){barra.remove();barra=null}promptInstalar=null;ls.set('pwaInstalarVisto','1')});
  if(ehIOS&&!standalone()){
    window.addEventListener('load',function(){setTimeout(function(){mostraBarra('📲 Para instalar: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>',null,null,'pwaIosVisto')},2500)});
  }
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}   // evita que o navegador apague os saves

  function noTitulo(){try{return typeof S==='undefined'||S===null||(typeof telaTitulo!=='undefined'&&telaTitulo===true)}catch(e){return true}}
  function aplicaAtualizacao(){
    if(noTitulo()){location.reload();return}
    if(reiniciarPendente)return;reiniciarPendente=true;
    try{if(typeof toast==='function')toast('🔄 Nova versão instalada — será aplicada na tela inicial')}catch(e){}
    var t=setInterval(function(){if(noTitulo()){clearInterval(t);location.reload()}},4000);
  }
  if('serviceWorker' in navigator){
    var recarregou=false;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(!tinhaControlador){tinhaControlador=true;return}      // primeira instalação: nada a recarregar
      if(recarregou)return;recarregou=true;aplicaAtualizacao();
    });
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('service-worker.js',{scope:'./',updateViaCache:'none'}).then(function(reg){
        var checa=function(){try{reg.update()}catch(e){}};
        document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checa()});
        window.addEventListener('online',checa);
        setInterval(checa,30*60*1000);
      }).catch(function(e){console.warn('Service worker não registrado:',e)});
    });
  }
})();
