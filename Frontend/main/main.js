// Frontend/main/main.js

const BACKEND_URL = "http://127.0.0.1:5000";

async function autoLoginOrRegister() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const resultElement = document.getElementById("result");

  if (!username || !password) {
    resultElement.textContent = "아이디와 비밀번호를 모두 입력해주세요.";
    return;
  }

  try {
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ 추가
      body: JSON.stringify({ username, password }),
    });

    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.token) {
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("username", username);
      resultElement.textContent = "...게임을 시작합니다...";

      await fetchUserInfo();

      setTimeout(() => {
        window.location.href = "../game/game.html";
      }, 1500);
    } else {
      // 로그인 실패 시 회원가입
      const registerRes = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ 추가
        body: JSON.stringify({ username, password }),
      });

      const registerData = await registerRes.json();

      if (registerRes.ok) {
        resultElement.textContent = "회원가입 성공! 다시 로그인해주세요.";
      } else {
        resultElement.textContent = `회원가입 실패: ${
          registerData.error || "알 수 없는 오류"
        }`;
      }
    }
  } catch (err) {
    console.error("에러 발생:", err);
    resultElement.textContent = "서버와 연결에 실패했습니다.";
  }
}

async function fetchUserInfo() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${BACKEND_URL}/user/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include", // ✅ 추가
    });

    const data = await res.json();
    console.log("현재 로그인된 사용자 정보:", data.user);
  } catch (err) {
    console.error("사용자 정보 요청 실패:", err);
  }
}
