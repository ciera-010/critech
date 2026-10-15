import {validate,element,renderCards} from './content-lib.js?v=upload1';
const $ = id => document.getElementById(id);
let data, sha = '', connectedRepo = '', connectedBranch = '', dirty = false, pendingImages = 0;
const say = text => $('status').textContent = text;
if (location.hostname.endsWith('.github.io')) $('repo').value = `${location.hostname.split('.')[0]}/${location.pathname.split('/').filter(Boolean)[0] || `${location.hostname.split('.')[0]}.github.io`}`;
function read() {
  if (pendingImages) throw Error('이미지를 처리 중입니다. 잠시 후 다시 시도하세요.');
  return validate({headline:$('headline').value.trim(),subtitle:$('subtitle').value.trim(),sectionTitle:$('sectionTitle').value.trim(),products:[...$('products').children].map(card => Object.fromEntries(['name','description','url','image','tags','published'].map(key => { const field = card.querySelector(`[name="${key}"]`); return [key,key === 'published' ? field.checked : key === 'tags' ? [...new Set(field.value.split(/[\s,#]+/).filter(Boolean))] : field.value.trim()]; })))});
}
function addProduct(p) {
  const card = element('div','admin-product'), fieldset = element('fieldset'); fieldset.append(element('legend','',p.name || '새 제품'));
  for (const [key,title] of [['name','제품명'],['description','설명'],['url','서비스 주소'],['tags','태그'],['published','사이트에 공개']]) {
    const label = element('label','',title), input = element(key === 'description' ? 'textarea' : 'input'); input.name = key;
    if (key === 'published') { input.type = 'checkbox'; input.checked = p.published; } else { input.value = key === 'tags' ? p.tags.map(t => `#${t}`).join(' ') : p[key]; if (key === 'name') input.required = true; if (['image','url'].includes(key)) input.type = 'url'; }
    label.append(input); fieldset.append(label);
  }
  const imageValue = element('input'); imageValue.type = 'hidden'; imageValue.name = 'image'; imageValue.value = p.image;
  const uploadLabel = element('label','','썸네일 이미지 업로드'), upload = element('input'); upload.type = 'file'; upload.accept = 'image/jpeg,image/png,image/webp';
  const imageStatus = element('p','hint',p.image ? '등록된 이미지가 있습니다.' : '이미지를 선택하지 않으면 제품명 커버가 표시됩니다.');
  const clearImage = element('button','button','이미지 제거'); clearImage.type = 'button';
  clearImage.onclick = () => { imageValue.value = ''; upload.value = ''; imageStatus.textContent = '이미지를 제거했습니다. 사이트에 반영하면 적용됩니다.'; dirty = true; refreshPreview(); };
  upload.onchange = async () => {
    const file = upload.files[0]; if (!file) return;
    upload.disabled = true; pendingImages++; $('publish').disabled = true;
    try { imageValue.value = await prepareThumbnail(file); imageStatus.textContent = `${file.name} · 준비 완료. 사이트에 반영하면 업로드됩니다.`; dirty = true; }
    catch (error) { upload.value = ''; imageStatus.textContent = error.message; }
    finally { upload.disabled = false; pendingImages--; $('publish').disabled = pendingImages > 0; refreshPreview(); }
  };
  uploadLabel.append(upload); fieldset.append(imageValue,uploadLabel,imageStatus,clearImage);
  const remove = element('button','button danger','제품 삭제'); remove.type = 'button'; remove.onclick = () => { if (confirm('이 제품을 목록에서 삭제할까요? 사이트에 반영하기 전까지 공개 페이지는 바뀌지 않습니다.')) {card.remove();dirty = true;refreshPreview();} }; fieldset.append(remove); card.append(fieldset); $('products').append(card);
}
async function prepareThumbnail(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw Error('JPG, PNG, WebP 이미지를 선택하세요.');
  if (file.size > 10 * 1024 * 1024) throw Error('10MB 이하의 이미지를 선택하세요.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(bitmap.width * scale)); canvas.height = Math.max(1,Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    for (const quality of [0.85,0.7,0.5,0.3]) { const result = canvas.toDataURL('image/jpeg',quality); if (result.length <= 200000) return result; }
    throw Error('이미지가 복잡해 압축하지 못했습니다. 더 작은 이미지를 선택하세요.');
  } finally { bitmap.close(); }
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
function refreshPreview() { try { const value = read(); renderCards($('preview'),value.products); for (const card of $('products').children) card.querySelector('legend').textContent = card.querySelector('[name="name"]').value || '새 제품'; } catch(error) { say(error.message); } }
$('editor').oninput = () => {dirty = true; refreshPreview(); say('수정한 내용을 미리보기에 반영했습니다. 정보 저장하기를 누르면 공개 사이트에도 적용됩니다.');};
$('preview-button').onclick = () => {try {renderCards($('preview'),read().products);say('미리보기를 갱신했습니다.');} catch(error) {say(error.message);}};
$('download').onclick = () => {try {const url = URL.createObjectURL(new Blob([JSON.stringify(read(),null,2)+'\n'],{type:'application/json'}));const a = element('a');a.href = url;a.download = 'content.json';a.click();setTimeout(() => URL.revokeObjectURL(url),1000);say('백업 파일을 내려받았습니다.');} catch(error) {say(error.message);}};
$('editor').onsubmit = async event => {
  event.preventDefault(); $('publish').disabled = true;
  try { const value = read(); renderCards($('preview'),value.products); const c = connection(); if (!sha || c.repo !== connectedRepo || c.branch !== connectedBranch) throw Error('먼저 이 저장소의 최신 내용을 불러오세요.');
    const bytes = new TextEncoder().encode(JSON.stringify(value,null,2)+'\n'); if (bytes.length > 900000) throw Error('전체 이미지 용량이 큽니다. 일부 이미지를 제거하거나 더 작은 이미지로 바꿔 주세요.'); const content = btoa(Array.from(bytes,b => String.fromCharCode(b)).join(''));
    const result = await api(c,'PUT',{message:'Update critech page content',content,sha,branch:c.branch}); sha = result.content.sha; dirty = false; say('정보를 저장했습니다. 아래 카드에도 적용되었으며 Pages 배포가 완료되면 공개 사이트에 반영됩니다.');
  } catch(error) {say(error.message);} finally {$('publish').disabled = false;}
};
window.addEventListener('beforeunload',event => {if (dirty) {event.preventDefault();event.returnValue = '';}});
try {const response = await fetch('./content.json',{cache:'no-store'});if (!response.ok) throw Error('초기 내용을 불러오지 못했습니다.');populate(await response.json());say('공개 중인 내용을 불러왔습니다. 반영하려면 GitHub를 연결하세요.');} catch(error) {say(error.message);}
