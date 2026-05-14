// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "devlog",
      script: ".next/standalone/server.js", // 싫행할 진입점 (standalone build 결과)
      cwd: ".", // ⭐ 프로젝트 루트
      env: {
        // 런타임 환경 변수
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0", // 외부에서 접근 가능
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M", // 메모리 한계 (이상 시 자동 재시작)
    },
  ],
};
