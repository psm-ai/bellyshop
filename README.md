# BELLYSHOP FINAL 적용 방법

1. GitHub 저장소의 기존 파일을 모두 삭제합니다.
2. 이 ZIP을 압축 해제합니다.
3. 압축 해제 후 보이는 아래 5개 파일을 저장소 최상단에 모두 업로드합니다.
   - index.html
   - style.css
   - app.js
   - firestore.rules
   - README.md
4. Firebase 콘솔 → Firestore → 규칙에서 기존 내용을 지우고 `firestore.rules` 내용을 붙여넣은 뒤 **게시**합니다.
5. GitHub 저장소 → Settings → Pages에서 `main` / `(root)`로 저장합니다.
6. 사이트 주소: https://psm-ai.github.io/bellyshop/

## 관리자 로그인
- 아이디: admin
- 비밀번호: Firebase Authentication에 만든 `mjh380801@naver.com` 계정 비밀번호

## 상품 이미지
관리자 상품 등록 화면에 공개 이미지 URL을 입력합니다.

## 상담 설정
관리자 로그인 → 사이트 설정에서 카카오톡 채널 URL, 전화번호 또는 이메일을 입력합니다.
