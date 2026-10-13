import {validate,element,renderCards} from './content.mjs';
const $ = id => document.getElementById(id);
let data, sha = '', connectedRepo = '', connectedBranch = '', dirty = false;
const say = text => $('status').textContent = text;
if (location.hostname.endsWith('.github.io')) $('repo').value = `${location.hostname.split('.')[0]}/${location.pathname.split('/').filter(Boolean)[0] || `${location.hostname.split('.')[0]}.github.io`}`;
function read() {
  return validate({headline:$('headline').value.trim(),subtitle:$('subtitle').value.trim(),sectionTitle:$('sectionTitle').value.trim(),products:[...$('products').children].map(card => Object.fromEntries(['name','description','url','image','tags','published'].map(key => { const field = card.querySelector(`[name="${key}"]`); return [key,key === 'published' ? field.checked : key === 'tags' ? [...new Set(field.value.split(/[\s,#]+/).filter(Boolean))] : field.value.trim()]; })))});
}
function addProduct(p) {
  const card = element('div','admin-product'), fieldset = element('fieldset'); fieldset.append(element('legend','',p.name || '새 제품'));
  for (const [key,title] of [['name','제품명'],['description','설명'],['url','서비스 주소'],['image','썸네일 이미지 주소'],['tags','태그'],['published','사이트에 공개']]) {
    const label = element('label','',title), input = element(key === 'description' ? 'textarea' : 'input'); input.name = key;
    if (key === 'published') { input.type = 'checkbox'; input.checked = p.published; } else { input.value = key === 'tags' ? p.tags.map(t => `#${t}`).join(' ') : p[key]; if (key === 'name') input.required = true; if (['image','url'].includes(key)) input.type = 'url'; }
    label.append(input); fieldset.append(label);
  }
  const remove = element('button','button danger','제품 삭제'); remove.type = 'button'; remove.onclick = () => { if (confirm('이 제품을 목록에서 삭제할까요? 사이트에 반영하기 전까지 공개 페이지는 바뀌지 않습니다.')) {card.remove();dirty = true;} }; fieldset.append(remove); card.append(fieldset); $('products').append(card);
}
function populate(value) { data = validate(value); ['headline','subtitle','sectionTitle'].forEach(k => $(k).value = data[k]); $('products').replaceChildren(); data.products.forEach(addProduct); renderCards($('preview'),data.products); dirty = false; }
function connection() { const repo = $('repo').value.trim(), branch = $('branch').value.trim(), token = $('token').value.trim(); if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !branch || !token) throw Error('저장소, 브랜치, 토큰을 입력하세요.'); return {repo,branch,token}; }
async function api(c,method = 'GET',body) {
  const url = `https://api.github.com/repos/${c.repo}/contents/content.json${method === 'GET' ? `?ref=${encodeURIComponent(c.branch)}` : ''}`;
  const response = await fetch(url,{method,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${c.token}`,'Content-Type':'application/json'},...(body ? {body:JSON.stringify(body)} : {})});
  if (!response.ok) throw Error(response.status === 409 || response.status === 422 ? '다른 수정이 있거나 브랜치가 잠겨 있습니다. 백업 후 최신 내용을 다시 불러오세요.' : `GitHub 저장 실패 (${response.status}). 저장소와 토큰 권한을 확인하세요.`);
  return response.json();
}
$('connect').onclick = async () => {
  if (dirty && !confirm('현재 수정 내용을 버리고 GitHub 최신 내용을 불러올까요?')) return;
  $('connect').disabled = true;
  try { const c = connection(), result = await api(c); const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(result.content.replace(/\s/g,'')), c => c.charCodeAt(0)))); populate(value); sha = result.sha; connectedRepo = c.repo; connectedBranch = c.branch; say('최신 내용을 불러왔습니다. 수정 후 사이트에 반영하세요.'); }
  catch (error) {say(error.message);} finally { $('connect').disabled = false; }
};
$('disconnect').onclick = () => { $('token').value = ''; sha = ''; connectedRepo = ''; connectedBranch = ''; say('연결을 해제했습니다.'); };
$('add').onclick = () => {addProduct({name:'',description:'',url:'',image:'',tags:[],published:false});dirty = true;};
$('editor').oninput = () => {dirty = true;};
$('preview-button').onclick = () => {try {renderCards($('preview'),read().products);say('미리보기를 갱신했습니다.');} catch(error) {say(error.message);}};
$('download').onclick = () => {try {const url = URL.createObjectURL(new Blob([JSON.stringify(read(),null,2)+'\n'],{type:'application/json'}));const a = element('a');a.href = url;a.download = 'content.json';a.click();setTimeout(() => URL.revokeObjectURL(url),1000);say('백업 파일을 내려받았습니다.');} catch(error) {say(error.message);}};
$('editor').onsubmit = async event => {
  event.preventDefault(); $('publish').disabled = true;
  try { const value = read(), c = connection(); if (!sha || c.repo !== connectedRepo || c.branch !== connectedBranch) throw Error('먼저 이 저장소의 최신 내용을 불러오세요.');
    const bytes = new TextEncoder().encode(JSON.stringify(value,null,2)+'\n'); const content = btoa(Array.from(bytes,b => String.fromCharCode(b)).join(''));
    const result = await api(c,'PUT',{message:'Update critech page content',content,sha,branch:c.branch}); sha = result.content.sha; dirty = false; say('GitHub에 저장했습니다. Pages 배포가 완료되면 사이트에 반영됩니다.');
  } catch(error) {say(error.message);} finally {$('publish').disabled = false;}
};
window.addEventListener('beforeunload',event => {if (dirty) {event.preventDefault();event.returnValue = '';}});
try {const response = await fetch('./content.json',{cache:'no-store'});if (!response.ok) throw Error('초기 내용을 불러오지 못했습니다.');populate(await response.json());say('공개 중인 내용을 불러왔습니다. 반영하려면 GitHub를 연결하세요.');} catch(error) {say(error.message);}
