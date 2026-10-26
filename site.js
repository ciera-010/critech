import {validate,selectProducts,element,renderCards} from './content-lib.js?v=webp1';
const status = document.querySelector('#status');
try {
  const response = await fetch('./content.json', {cache:'no-store'}); if (!response.ok) throw Error('load');
  const data = validate(await response.json());
  for (const [id,key] of [['headline','headline'],['subtitle','subtitle'],['nav-note','navNote'],['section-title','sectionTitle']]) document.getElementById(id).textContent = data[key];
  document.title = `${data.headline} — ${data.subtitle}`;
  const filters = document.querySelector('#filters');
  const tags = [...new Set(['사주','채팅','뷰티','스타일링',...selectProducts(data).flatMap(p => p.tags)])];
  for (const tag of ['',...tags]) {
    const button = element('button','',tag ? `#${tag}` : '전체'); button.type = 'button'; button.setAttribute('aria-pressed',String(!tag));
    button.addEventListener('click', () => { filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b === button))); show(tag); }); filters.append(button);
  }
  function show(tag) { const products = selectProducts(data,tag); renderCards(document.querySelector('#grid'),products); document.querySelector('#count').textContent = `${products.length}개의 서비스`; status.textContent = products.length ? '' : '이 카테고리의 서비스는 준비 중입니다.'; }
  show('');
} catch { status.textContent = '제품을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.'; }
