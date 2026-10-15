# critech

정적 제품 디렉터리와 GitHub 저장 방식의 관리 화면입니다.

- 공개 페이지: `index.html`
- 관리 화면: `admin.html`
- 페이지 문구, 제품명, 설명, 업로드한 썸네일, 링크, 태그, 공개 여부: `content.json`
- 제품 썸네일을 비워 두거나 로딩에 실패하면 제품명 커버가 표시됩니다.
- 예시 제품은 비공개입니다. 야화기방 설명과 카테고리는 임시 편집 문구이므로 운영자가 조정할 수 있습니다.

## 로컬 실행

```sh
python3 -m http.server 8765
node test.mjs
```

`http://localhost:8765` 및 `/admin.html`에 접속합니다. 파일을 직접 더블클릭하면 JSON 로딩이 차단될 수 있습니다.

## 배포

GitHub에 이 파일들을 올리고 Settings → Pages → Source를 GitHub Actions로 설정합니다. main 브랜치에 push하면 테스트 후 공개 파일만 배포합니다.

## 수정과 권한

관리 화면은 누구나 볼 수 있지만 저장은 저장소에 쓰기 권한이 있는 GitHub 토큰이 필요합니다. 해당 저장소만 선택한 fine-grained token의 Contents read/write 권한을 사용합니다. 토큰은 브라우저 저장소, 파일, 소스 코드에 보관하지 않습니다. GitHub API에만 전달하며 연결 해제 시 입력값을 지웁니다.

최신 내용 불러오기 → 편집 → 미리보기 → 사이트에 반영 순서로 사용합니다. GitHub의 파일 SHA로 동시 수정 충돌을 방지합니다. 충돌 시 백업을 내려받고 최신 내용을 다시 불러와 변경을 재적용하세요. 저장 완료와 Pages 배포 완료는 별개입니다.

썸네일은 JPG·PNG·WebP(10MB 이하)를 업로드하며 최대 1200px JPEG로 자동 압축됩니다. 이미지는 content.json에 함께 저장되고 전체 파일은 900KB 이하로 제한됩니다. 기존 HTTPS 이미지 URL도 계속 표시됩니다. 백업 파일을 복구하려면 저장소의 content.json을 교체하세요.
