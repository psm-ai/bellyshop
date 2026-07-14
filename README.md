# BELLYSHOP 빠른 설치

1. 이 ZIP 파일의 압축을 풉니다.
2. GitHub `psm-ai/bellyshop` 저장소 화면으로 이동합니다.
3. `Add file` → `Upload files`를 누릅니다.
4. 압축을 푼 폴더 안의 파일과 `assets` 폴더를 모두 끌어다 놓습니다.
5. 아래쪽 `Commit changes`를 누릅니다.
6. 1~3분 후 `https://psm-ai.github.io/bellyshop/`에서 확인합니다.

## 카카오톡 채널 주소 변경
`app.js` 파일 첫 줄의 주소를 본인 채널 주소로 바꾸세요.

```js
const KAKAO_LINK = "https://pf.kakao.com/_YOUR_CHANNEL";
```

## 상품 추가/수정
`products.js`의 상품 내용을 복사하여 수정하면 됩니다.
각 상품은 id, name, code, category, size, color, status, images, description으로 구성되어 있습니다.
