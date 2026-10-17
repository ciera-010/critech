export function safeImage(value) { return typeof value === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) && value.length <= 200000 ? value : safeUrl(value); }
export function safeUrl(value) {
  if (!value) return '';
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function validate(data) {
  if (!data || !['headline','subtitle','sectionTitle'].every(k => typeof data[k] === 'string' && data[k].trim() && data[k].length <= 200) || !Array.isArray(data.products) || data.products.length > 100) throw Error('페이지 문구와 제품 목록을 확인하세요.');
  if (data.navNote === undefined) data.navNote = '작은 기술, 새로운 일상';
  if (typeof data.navNote !== 'string' || data.navNote.length > 200) throw Error('상단 오른쪽 문구는 200자 이하로 입력하세요.');
  for (const p of data.products) {
    if (!p || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100 || typeof p.description !== 'string' || p.description.length > 1000 || typeof p.published !== 'boolean' || !Array.isArray(p.tags) || p.tags.length > 20 || p.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 30)) throw Error('제품명, 설명, 태그를 확인하세요.');
    if (typeof p.url !== 'string' || typeof p.image !== 'string' || (p.url && !safeUrl(p.url)) || (p.image && !safeImage(p.image)) || (p.published && !p.url)) throw Error('제품과 이미지 주소는 https://로 시작해야 합니다. 공개 제품에는 링크가 필요합니다.');
  }
  return data;
}
export function selectProducts(data, tag = '') { return data.products.filter(p => p.published && (!tag || p.tags.includes(tag))); }
export function element(tag, className, text) { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; }
export function renderCards(container, products) {
  container.replaceChildren();
  for (const p of products) {
    const card = element(p.url ? 'a' : 'article', 'card'); if (p.url) card.href = safeUrl(p.url);
    const thumb = element('div','thumbnail'); thumb.append(element('span','cover-word',p.name));
    if (safeImage(p.image)) { const image = element('img'); image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.src = safeImage(p.image); image.addEventListener('error', () => image.remove()); thumb.append(image); }
    const body = element('div','card-body'), tags = element('div','tags'); p.tags.forEach(t => tags.append(element('span','',`#${t}`)));
    const action = element('div','card-action'); action.append(element('span','',p.url ? '서비스 만나보기' : '준비 중'),element('span','',p.url ? '↗' : '·'));
    body.append(tags,element('h3','',p.name),element('p','',p.description),action); card.append(thumb,body); container.append(card);
  }
}
