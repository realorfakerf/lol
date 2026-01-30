# 배포 가이드

이 문서는 테트리스 건물 경주 게임을 다른 사람들과 함께 플레이할 수 있도록 배포하는 방법을 설명합니다.

## 방법 1: 로컬 네트워크에서 플레이 (같은 Wi-Fi)

같은 공간에 있는 친구들과 빠르게 플레이하고 싶다면 이 방법을 사용하세요.

### 단계:

1. **개발 서버 시작**
   ```bash
   npm run dev
   ```

2. **네트워크 주소 확인**
   터미널에 다음과 같은 메시지가 표시됩니다:
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.0.5:5173/
   ```

3. **친구들 초대**
   - 같은 Wi-Fi에 연결된 친구들에게 Network 주소를 공유하세요
   - 예: `http://192.168.0.5:5173/`
   - 친구들이 해당 주소를 브라우저에 입력하면 게임을 플레이할 수 있습니다

### 주의사항:
- 모두 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다
- 방화벽이 포트 5173을 차단하지 않도록 확인하세요
- 개발 서버를 종료하면 접속이 끊깁니다

---

## 방법 2: Vercel에 온라인 배포 (추천)

전 세계 어디서든 접속 가능한 URL을 만들고 싶다면 이 방법을 사용하세요.

### 사전 준비:
- GitHub 계정
- Vercel 계정 (무료, https://vercel.com)

### 단계:

#### 1. GitHub에 코드 업로드

```bash
# Git 초기화 (아직 안 했다면)
git init

# 변경사항 커밋
git add .
git commit -m "테트리스 건물 경주 게임 완성"

# GitHub 레포지토리 생성 후 연결
git remote add origin https://github.com/your-username/tetris-building-race.git
git push -u origin main
```

#### 2. Vercel에 배포

**방법 A: Vercel CLI 사용**
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

**방법 B: Vercel 웹사이트 사용**
1. https://vercel.com 접속
2. "New Project" 클릭
3. GitHub 레포지토리 선택
4. 설정 확인 (자동으로 감지됨)
5. "Deploy" 클릭

#### 3. URL 공유
배포가 완료되면 다음과 같은 URL을 받게 됩니다:
```
https://tetris-building-race.vercel.app
```

이 URL을 친구들에게 공유하면 누구나 게임을 플레이할 수 있습니다!

### 장점:
- ✅ 전 세계 어디서든 접속 가능
- ✅ HTTPS 자동 적용 (보안)
- ✅ 빠른 로딩 속도 (CDN)
- ✅ 무료!
- ✅ 코드 변경 시 자동 재배포

---

## 방법 3: Netlify에 배포

Vercel 대안으로 Netlify도 사용할 수 있습니다.

### 단계:

1. **Netlify 설정 파일 생성**
   ```bash
   # netlify.toml 파일이 이미 준비되어 있습니다
   ```

2. **Netlify CLI 배포**
   ```bash
   npm install -g netlify-cli
   netlify init
   netlify deploy --prod
   ```

3. **Netlify 웹사이트 사용**
   - https://netlify.com 접속
   - "Add new site" → "Import an existing project"
   - GitHub 레포지토리 선택
   - 자동 배포

---

## 방법 4: GitHub Pages에 배포

무료 정적 호스팅을 원한다면 GitHub Pages도 좋은 선택입니다.

### 단계:

1. **package.json에 homepage 추가**
   ```json
   "homepage": "https://your-username.github.io/tetris-building-race"
   ```

2. **gh-pages 패키지 설치**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **배포 스크립트 추가**
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. **배포**
   ```bash
   npm run deploy
   ```

---

## 게임 플레이 방법

배포 후 플레이어들은:

1. 공유된 URL에 접속
2. "🎮 게임 시작" 버튼 클릭
3. 2명이 같은 키보드를 사용하여 플레이:
   - **플레이어 1**: WASD + Shift
   - **플레이어 2**: 방향키 + Enter

---

## 문제 해결

### 로컬 네트워크에서 접속 안 됨
- 방화벽 설정 확인
- 같은 Wi-Fi 네트워크인지 확인
- `npm run dev`로 서버 재시작

### 빌드 에러
```bash
# 캐시 삭제 후 재설치
rm -rf node_modules
npm install
npm run build
```

### Vercel 배포 실패
- `vercel.json` 파일이 있는지 확인
- 빌드 명령어가 올바른지 확인
- Vercel 대시보드에서 로그 확인

---

## 추가 개선 사항 (선택)

게임을 더욱 개선하고 싶다면:

1. **커스텀 도메인 연결** (예: tetris.yourdomain.com)
2. **분석 도구 추가** (Google Analytics)
3. **리더보드 시스템** (Supabase, Firebase)
4. **온라인 멀티플레이어** (Socket.io, WebRTC)

---

## 지원

문제가 있거나 질문이 있다면 GitHub Issues를 사용하세요!
