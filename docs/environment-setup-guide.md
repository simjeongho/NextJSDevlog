# DevLog 강의 — 환경 세팅 가이드

> **대상**: 12시간 Next.js 풀스택 교육 수강생
>
> **목표**: 강의 시작 전에 모두가 같은 출발선에 서기

---

## 0. 시작하기 전에

본인의 환경이 **사내망** 인지 **사외망** 인지 먼저 확인해주세요.

| 환경 | 설명 |
|---|---|
| 🏢 **사내망** | 회사 네트워크에 연결된 상태 (프록시 통해 외부 접근) |
| 🏠 **사외망** | 집/카페 등 일반 인터넷 (프록시 불필요) |

### 진행 순서

- **사내망**: 1번 (프록시 설정) → 2번 (설치) → 3번 (시작 레포 클론)
- **사외망**: 2번 (설치) → 3번 (시작 레포 클론)

---

## 1. [사내망] 프록시 설정

> 💡 **사외망 환경이면 이 섹션을 건너뛰고 2번부터 시작해주세요.**

회사 네트워크에서 외부 인터넷에 접근하려면 프록시 설정이 필요합니다. Node.js (npm), Git, VSCode 모두 프록시를 통해 통신해야 외부 패키지 다운로드와 GitHub 접근이 가능합니다.

### 1-1. 프록시 정보

다음 정보는 강의 진행 시 사용할 프록시 설정입니다.

```
HTTP 프록시:  http://70.10.15.10:8080
HTTPS 프록시: http://70.10.15.10:8080
프록시 제외:  sdsdev.co.kr, aipro.sdsdev.co.kr, code.sdsdev.co.kr
```

> 💡 **프록시 제외(NO_PROXY)** — 사내 도메인은 프록시를 거치지 않고 직접 접근해야 합니다. 사내 GitHub (`code.sdsdev.co.kr`) 도 포함해주세요.

### 1-2. Windows 시스템 환경 변수 설정

가장 먼저 시스템 환경 변수에 프록시 정보를 추가합니다. 이후 설치할 도구들이 이 값을 자동으로 인식합니다.

#### 설정 방법

1. 윈도우 검색창에 **"환경 변수"** 입력 → **"시스템 환경 변수 편집"** 클릭
2. 시스템 속성 창에서 **"환경 변수(N)..."** 버튼 클릭
3. **"사용자 변수"** 영역의 **"새로 만들기(N)..."** 클릭
4. 다음 3개 변수를 차례로 추가:

| 변수 이름 | 변수 값 |
|---|---|
| `HTTP_PROXY` | `http://70.10.15.10:8080` |
| `HTTPS_PROXY` | `http://70.10.15.10:8080` |
| `NO_PROXY` | `sdsdev.co.kr,aipro.sdsdev.co.kr,code.sdsdev.co.kr` |

5. 모든 창에서 **"확인"** 클릭하여 저장
6. **PC 재부팅 또는 새 터미널 창 열기** (환경 변수 변경사항 적용)

> 💡 **확인 명령어**:
> ```bash
> echo %HTTP_PROXY%
> echo %HTTPS_PROXY%
> echo %NO_PROXY%
> ```
> 위 명령어로 설정된 값이 출력되면 성공입니다.

### 1-3. npm 프록시 설정

> ⚠️ **이 단계는 Node.js 설치 후 진행해주세요. (2-2 이후)**

Node.js 설치 후 새 터미널에서:

```bash
npm config set proxy http://70.10.15.10:8080
npm config set https-proxy http://70.10.15.10:8080
npm config set noproxy sdsdev.co.kr,aipro.sdsdev.co.kr,code.sdsdev.co.kr

# 확인
npm config get proxy
npm config get https-proxy
npm config get noproxy
```

### 1-4. Git 프록시 설정

> ⚠️ **이 단계는 Git 설치 후 진행해주세요. (2-1 이후)**

Git 설치 후 새 터미널에서:

```bash
git config --global http.proxy http://70.10.15.10:8080
git config --global https.proxy http://70.10.15.10:8080

# 사내 GitHub 은 프록시 제외
git config --global http."https://code.sdsdev.co.kr".proxy ""

# 확인
git config --global --get http.proxy
git config --global --get https.proxy
```

### 1-5. VSCode 프록시 설정

> ⚠️ **이 단계는 VSCode 설치 후 진행해주세요. (2-3 이후)**

#### 방법 A: GUI 로 설정

1. VSCode 실행
2. **Ctrl + ,** (설정 열기)
3. 검색창에 `proxy` 입력
4. **Http: Proxy** 항목에 `http://70.10.15.10:8080` 입력
5. **Http: Proxy Strict SSL** 체크 해제 (사내 환경에 따라)

#### 방법 B: settings.json 직접 편집

1. **Ctrl + Shift + P** → "Preferences: Open User Settings (JSON)" 선택
2. 다음 내용 추가:

```json
{
  "http.proxy": "http://70.10.15.10:8080",
  "http.proxyStrictSSL": false
}
```

> 💡 시스템 환경 변수 (1-2) 가 설정되어 있으면 VSCode 가 자동 인식하는 경우도 많지만, 명시적으로 설정하시는 게 안전합니다.

### 1-6. 프록시 설정 확인

모든 설정 후 다음 명령어로 외부 접근이 정상인지 확인:

```bash
# npm 으로 패키지 정보 가져오기
npm view react

# git 으로 외부 저장소 접근
git ls-remote https://github.com/vercel/next.js.git
```

응답이 정상적으로 오면 ✅ 프록시 설정 완료. 다음 단계 (2번 설치) 로 이동하세요.

---

## 2. 설치 (사내망/사외망 공통)

이제 강의에 필요한 도구들을 설치합니다. 사내망과 사외망 모두 같은 방식으로 진행하시면 됩니다.

> 💡 **사내망 환경**: 각 도구 설치 후 1번 섹션의 해당 프록시 설정도 함께 진행해주세요.
> - Git 설치 후 → 1-4 (Git 프록시)
> - Node.js 설치 후 → 1-3 (npm 프록시)
> - VSCode 설치 후 → 1-5 (VSCode 프록시)

### 2-1. Git 설치

#### 다운로드

- 다운로드: https://git-scm.com/download/win
- 64-bit Git for Windows Setup 선택

#### 설치 과정

1. 다운로드한 `.exe` 파일 실행
2. 라이선스 동의 → "Next"
3. 설치 경로: 기본값 유지 → "Next"
4. 컴포넌트 선택: 기본값 유지 → "Next"
5. 시작 메뉴 폴더: 기본값 유지 → "Next"
6. 기본 에디터 선택: **"Use Visual Studio Code as Git's default editor"** 권장 → "Next"

   > 💡 VSCode 가 아직 설치 안 됐다면 기본 (Vim) 유지하셔도 됩니다. 나중에 변경 가능.

7. 초기 브랜치 이름: **"Override the default branch name for new repositories"** 선택 → `main` 입력 → "Next"
8. PATH 환경 변수: **"Git from the command line and also from 3rd-party software"** 선택 → "Next"
9. 나머지 옵션: 모두 **기본값 유지** 하며 "Next" 진행
10. "Install" 클릭 → 설치 완료

#### 확인

새 터미널 (cmd 또는 PowerShell) 에서:

```bash
git --version
# git version 2.x.x.windows.x
```

#### 사용자 정보 설정

설치 후 본인 정보를 등록합니다 (커밋 시 사용됨):

```bash
git config --global user.name "본인이름"
git config --global user.email "본인이메일"
```

> 💡 **사내망**: 설치 완료 후 [1-4. Git 프록시 설정] 진행

---

### 2-2. Node.js 22.x 설치

> ⚠️ **버전 통일을 위해 22.x LTS 권장합니다 (정확히는 22.20.0 또는 그 이상)**.

#### 다운로드

- 다운로드: https://nodejs.org/ko/download
- **22.x LTS** 버전 선택
- Windows Installer (.msi), 64-bit 선택

#### 설치 과정

1. 다운로드한 `.msi` 파일 실행
2. 라이선스 동의 → "Next"
3. 설치 경로: 기본값 (`C:\Program Files\nodejs\`) → "Next"
4. **Custom Setup**: 기본값 그대로 → "Next"
5. **Tools for Native Modules**: 체크 해제 권장 (없어도 본 강의 진행 가능)
6. "Install" 클릭 → 관리자 권한 허용 → 설치 완료

#### 확인

새 터미널에서:

```bash
node --version
# v22.x.x

npm --version
# 10.x.x
```

> 💡 버전이 안 보이면 PATH 환경 변수 적용을 위해 **터미널을 새로 열거나 PC 재부팅** 해보세요.

> 💡 **사내망**: 설치 완료 후 [1-3. npm 프록시 설정] 진행

---

### 2-3. VSCode 설치

#### 다운로드

- 다운로드: https://code.visualstudio.com/Download
- **Windows x64 User Installer** 선택

#### 설치 과정

1. 다운로드한 `.exe` 실행
2. 라이선스 동의 → "다음"
3. 설치 경로: 기본값 유지 → "다음"
4. 시작 메뉴 폴더: 기본값 유지 → "다음"
5. **추가 작업 선택**: 다음 항목 모두 체크 권장
   - ✅ 바탕 화면에 아이콘 만들기 (선택)
   - ✅ **파일 탐색기의 파일 상황에 맞는 메뉴에 "Code(으)로 열기" 작업 추가**
   - ✅ **파일 탐색기의 디렉터리 상황에 맞는 메뉴에 "Code(으)로 열기" 작업 추가**
   - ✅ 지원되는 파일 형식의 편집기로 Code 등록
   - ✅ **PATH에 추가** (중요)
6. "설치" 클릭 → 완료

#### 확인

새 터미널에서:

```bash
code --version
# 1.x.x
```

또는 시작 메뉴에서 "Visual Studio Code" 검색 → 실행.

> 💡 **사내망**: 설치 완료 후 [1-5. VSCode 프록시 설정] 진행

---

### 2-4. VSCode 확장 (Extension) 설치

VSCode 실행 후 좌측 사이드바의 **확장 아이콘** (Ctrl + Shift + X) 을 클릭하시면 확장 마켓플레이스가 열립니다.

다음 4개 확장을 검색 후 **"Install"** 버튼으로 설치해주세요.

#### ① Auto Rename Tag

- 검색: `Auto Rename Tag`
- 제작자: **Jun Han**
- 역할: HTML/JSX 의 여는 태그를 수정하면 닫는 태그가 자동으로 함께 변경됨
- 예: `<div>` → `<section>` 으로 바꾸면 닫는 `</div>` 도 자동으로 `</section>` 으로

#### ② ESLint

- 검색: `ESLint`
- 제작자: **Microsoft**
- 역할: JavaScript/TypeScript 코드 품질 검사 (저장 시 실시간 검사)
- 예: 안 쓰는 import, useEffect 의존성 누락, React 훅 규칙 위반 등을 빨간/노란 줄로 표시

#### ③ Prettier - Code Formatter

- 검색: `Prettier - Code Formatter`
- 제작자: **Prettier**
- 역할: 코드 자동 포맷 (들여쓰기, 줄바꿈, 따옴표 통일 등)

#### ④ Rainbow Brackets (또는 Rainbow Brackets v2)

- 검색: `Rainbow Brackets`
- 역할: 중첩된 괄호 `()`, `[]`, `{}` 를 색깔로 구분
- 깊게 중첩된 JSX 나 콜백에서 짝 찾기 쉬워짐

### 2-4-1. ⭐ Prettier 자동 포맷 설정 (권장)

저장 시 자동으로 코드가 정렬되고 ESLint 가 자동 수정해주도록 설정합니다.

#### 설정 방법

1. VSCode 에서 **Ctrl + Shift + P** 눌러 명령 팔레트 열기
2. 입력: `Preferences: Open User Settings (JSON)` → 선택
3. `settings.json` 파일이 열리면 다음 내용을 추가:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

> 💡 기존에 다른 설정이 있다면 위 내용을 적절히 병합해주세요 (JSON 의 중괄호 `{}` 안에 추가하시면 됩니다).

#### 각 설정의 의미

| 설정 | 효과 |
|---|---|
| `editor.formatOnSave` | **저장 시 (Ctrl+S) 자동으로 Prettier 포맷** 적용 |
| `editor.defaultFormatter` | 기본 포매터를 Prettier 로 지정 |
| `editor.codeActionsOnSave` | 저장 시 **ESLint 자동 수정** (`source.fixAll.eslint`) |
| `[javascript]` 등 | JS/TS/JSX/TSX/JSON 파일에서 Prettier 사용 명시 |

설정 후 임의의 `.tsx` 파일을 들여쓰기 엉망으로 만들어 저장해보세요. **자동으로 정리** 되면 ✅

---

### 2-5. PostgreSQL 17 설치

#### 다운로드

- 다운로드: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
- **Windows x86-64** / **17.x** 버전 선택
- 인증 없이 직접 다운로드 가능

#### 설치 과정

1. 다운로드한 `.exe` (예: `postgresql-17.x-windows-x64.exe`) 실행
2. 관리자 권한 허용 → 설치 마법사 시작
3. **Installation Directory**: 기본값 (`C:\Program Files\PostgreSQL\17`) → "Next"
4. **Select Components**: **모두 체크** → "Next"
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder
   - ✅ Command Line Tools
5. **Data Directory**: 기본값 → "Next"
6. **⭐ 비밀번호 설정**: `devlog` 입력 → "Next"

   > ⚠️ **중요**: 강의 통일성을 위해 비밀번호는 `devlog` 로 설정해주세요. 잊지 마세요!

7. **Port**: `5432` (기본값) → "Next"
8. **Locale**: `Default locale` 또는 `Korean, Korea` → "Next"
9. 설정 요약 확인 → "Next" → 설치 시작
10. 설치 완료 후 **Stack Builder 실행 여부**: **체크 해제** 하고 "Finish" (필요 없음)

#### pgAdmin 4 로 연결 확인

1. 시작 메뉴에서 **"pgAdmin 4"** 검색 → 실행
2. 처음 실행 시 **마스터 비밀번호** 설정 창이 뜸 → 본인이 기억할 비밀번호 입력 (예: `devlog`)
3. 좌측 트리에서 **Servers → PostgreSQL 17** 클릭
4. PostgreSQL 비밀번호 입력 (위에서 설정한 `devlog`) → 연결

연결 성공하면 ✅

#### devlog 데이터베이스 생성

강의에서 사용할 빈 데이터베이스를 미리 만들어둡니다.

1. pgAdmin 좌측 트리: **PostgreSQL 17 → Databases** 우클릭
2. **Create → Database...** 클릭
3. **Database** 필드: `devlog` 입력
4. **Owner**: `postgres` (기본값)
5. **Save** 클릭

좌측 트리에 `devlog` 데이터베이스가 보이면 ✅

> 💡 이 데이터베이스는 챕터 15 에서 Drizzle ORM 으로 테이블을 생성할 때 사용됩니다.

---

## 3. 시작 레포 클론

빈 시작 레포 (boilerplate) 를 본인 노트북으로 가져옵니다. 이 레포는 `create-next-app` 으로 생성된 초기 상태로, 강의에서 챕터 01 부터 차근차근 살을 붙여나갈 출발점입니다.

### 3-1. 작업 폴더 준비

본인이 작업할 폴더로 이동합니다 (없으면 만드세요).

```bash
# 예시 — 본인 환경에 맞게 경로 수정
cd C:\Users\본인이름
mkdir projects
cd projects
```

### 3-2. 클론

> 💡 본인 환경에 맞는 명령어를 사용해주세요.

#### 🏢 [사내망] 사내 GitHub 에서 클론

```bash
git clone https://code.sdsdev.co.kr/jeongho/devlog-boilerplate.git devlog
```

> 💡 사내 GitHub 접근 시 사번/비밀번호 또는 토큰 입력이 필요할 수 있습니다.

#### 🏠 [사외망] GitHub 에서 클론

```bash
git clone https://github.com/simjeongho/devlog-boilerplate.git devlog
```

### 3-3. 의존성 설치

클론한 폴더로 이동 후 npm 패키지를 설치합니다.

```bash
cd devlog
npm install
```

> ⚠️ **사내망 환경**: 이 단계에서 ETIMEDOUT 또는 ECONNREFUSED 에러가 발생하면 1-3 (npm 프록시 설정) 이 되어 있는지 확인해주세요.

> 💡 설치는 몇 분 정도 걸릴 수 있습니다. 진행 표시가 멈춰 보여도 기다려주세요.

### 3-4. 첫 실행

설치가 완료되면 개발 서버를 실행해봅니다.

```bash
npm run dev
```

다음과 같은 메시지가 보이면 정상입니다:

```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Network:      http://...

✓ Ready in ...ms
```

브라우저에서 **http://localhost:3000** 접속 → Next.js 기본 시작 페이지가 보이면 ✅

> 💡 **시작 레포 구성**: 이 레포는 다음 옵션으로 생성된 `create-next-app` 의 초기 상태입니다.
> ```bash
> npx create-next-app@latest devlog \
>   --typescript --tailwind --app --eslint \
>   --no-src-dir --import-alias "@/*"
> ```
> 즉 TypeScript + Tailwind CSS + App Router + ESLint 가 기본 설정되어 있습니다.

서버를 멈추려면 터미널에서 **Ctrl + C** 누르시면 됩니다.

---

## 4. 환경 확인 체크리스트

강의 시작 전 다음 항목을 모두 확인해주세요.

### 4-1. 도구 설치 확인

새 터미널을 열고 다음 명령어를 실행:

```bash
node --version
# ✅ v22.x.x

npm --version
# ✅ 10.x.x

git --version
# ✅ git version 2.x.x

code --version
# ✅ 1.x.x
```

### 4-2. [사내망] 프록시 설정 확인

```bash
# 환경 변수
echo %HTTP_PROXY%
echo %HTTPS_PROXY%
echo %NO_PROXY%

# npm 프록시
npm config get proxy
npm config get https-proxy

# git 프록시
git config --global --get http.proxy
git config --global --get https.proxy
```

각각 설정된 값이 출력되면 ✅

### 4-3. VSCode 확장 4개 확인

VSCode → Ctrl+Shift+X → 좌측 상단의 **"Installed"** 탭에서 다음 4개가 모두 설치되어 있는지 확인:

- ✅ Auto Rename Tag
- ✅ ESLint
- ✅ Prettier - Code Formatter
- ✅ Rainbow Brackets (또는 v2)

### 4-4. Prettier 저장 시 포맷 동작 확인

VSCode 에서 임의의 `.tsx` 파일을 열어 들여쓰기를 일부러 엉망으로 만든 후 **Ctrl+S** 저장 → 자동으로 정렬되면 ✅

### 4-5. PostgreSQL 확인

pgAdmin 4 실행 → Servers → PostgreSQL 17 → Databases → **devlog** 가 보이면 ✅

### 4-6. 시작 레포 동작 확인

```bash
cd devlog
npm run dev
```

브라우저 http://localhost:3000 접속 → Next.js 시작 페이지가 정상 표시되면 ✅

---

## 5. 자주 발생하는 문제 (트러블슈팅)

### Q1. `node --version` 또는 `npm --version` 이 안 됨

**원인**: PATH 환경 변수 미적용

**해결**:
1. 터미널을 완전히 닫고 새로 열기
2. 그래도 안 되면 PC 재부팅
3. 그래도 안 되면 Node.js 재설치 (설치 시 PATH 추가 옵션 확인)

### Q2. `npm install` 시 `ETIMEDOUT` 또는 `ECONNREFUSED` 에러

**원인**: 사내망인데 npm 프록시 설정이 안 됨

**해결**: [1-3. npm 프록시 설정] 확인 후 재시도

### Q3. `git clone` 시 인증 오류 (401, 403)

**원인**: 사내 GitHub 또는 GitHub 인증 정보 필요

**해결**:
- 사내 GitHub: 사번/비밀번호 또는 Personal Access Token 사용
- GitHub.com: 본인 계정 로그인 또는 Personal Access Token 사용

### Q4. `git clone` 시 SSL/TLS 관련 에러 (사내망)

**원인**: 사내 환경의 SSL 인증서 문제

**해결** (임시):
```bash
git config --global http.sslVerify false
```

> ⚠️ 이는 보안상 권장되지 않으나, 사내 환경 한정으로 사용 가능합니다. 강의 종료 후 다시 `true` 로 변경하시는 게 좋습니다.

### Q5. pgAdmin 4 에서 PostgreSQL 17 연결 실패

**원인**: PostgreSQL 서비스가 실행 중이 아님

**해결**:
1. 윈도우 검색창에 "서비스" 입력 → 실행
2. 목록에서 **"postgresql-x64-17"** 찾기
3. 상태가 "실행 중" 인지 확인 — 아니면 우클릭 → "시작"
4. 시작 유형이 "자동" 인지 확인 — 아니면 우클릭 → 속성 → 시작 유형 "자동" 으로 변경

### Q6. VSCode 확장 설치가 안 됨 (사내망)

**원인**: VSCode 프록시 미설정

**해결**: [1-5. VSCode 프록시 설정] 확인

### Q7. `npm run dev` 가 실행되지 않음

**원인 1**: `npm install` 안 됨

**해결**: `npm install` 먼저 실행

**원인 2**: Node.js 버전 불일치

**해결**: `node --version` 으로 22.x 확인. 아니면 재설치.

**원인 3**: 다른 프로그램이 3000 포트 사용 중

**해결**: 다음 명령어로 포트 변경 가능:
```bash
npm run dev -- -p 3001
```

### Q8. 한글 입력 시 코드가 깨짐

**원인**: 파일 인코딩 문제

**해결**: VSCode 하단의 인코딩 표시 클릭 → "Save with Encoding" → **UTF-8** 선택

---

## 6. 다음 단계

환경 세팅이 완료되면 강의를 시작할 준비가 끝났습니다.

- 강의 진행: 챕터 01 부터 차례로 진행
- 강의 자료: [강의 자료 경로 — 강사가 별도 안내]
- 문의: 강사 또는 조교에게 문의

수고하셨습니다! 좋은 강의 되시길 바랍니다 🙌
