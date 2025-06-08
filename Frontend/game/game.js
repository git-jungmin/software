// 전역 변수
let selectedPlayers = 1; // 기본값 1인
let gameStarted = false;
let gameHistory = []; // 게임 결과 기록
let currentGameData = null; // 현재 게임 데이터 저장

// DOM이 로드된 후 실행
document.addEventListener("DOMContentLoaded", function () {
  // 플레이어 수 선택 버튼 이벤트
  const playerBtns = document.querySelectorAll(".player-btn");
  playerBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // 이미 게임이 시작된 경우 변경 불가
      if (gameStarted) {
        alert(
          "게임이 이미 시작되었습니다. 초기화 버튼을 눌러 새 게임을 시작하세요."
        );
        return;
      }

      // 기존 선택 제거
      playerBtns.forEach((b) => b.classList.remove("active"));

      // 새 선택 추가
      this.classList.add("active");

      // 선택된 플레이어 수 저장
      selectedPlayers = parseInt(this.getAttribute("data-players"));

      // 플레이어 영역 초기화
      initializePlayerArea();
    });
  });

  // 기본 선택 (1인)
  playerBtns[0].classList.add("active");
  initializePlayerArea();

  // 게임 시작 버튼 이벤트
  document.getElementById("start-btn").addEventListener("click", startGame);

  // 초기화 버튼 이벤트
  document.getElementById("reset-btn").addEventListener("click", resetGame);

  // 결과 기록 버튼 이벤트
  document.getElementById("history-btn").addEventListener("click", showHistory);

  // 모달 닫기 버튼 이벤트
  document.querySelector(".close-btn").addEventListener("click", function () {
    document.getElementById("history-modal").style.display = "none";
  });

  // 모달 외부 클릭 시 닫기
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("history-modal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
  // BGM 컨트롤 초기화
  initializeAudioControls();
});

// 플레이어 영역 초기화
function initializePlayerArea() {
  const playerContainer = document.getElementById("player-container");
  playerContainer.innerHTML = "";

  const username = localStorage.getItem("username") || "플레이어 1";

  for (let i = 1; i <= selectedPlayers; i++) {
    const playerBox = document.createElement("div");
    playerBox.className = "player-box";
    playerBox.id = `player-${i}`;

    // 플레이어 이름 설정
    const playerName = i === 1 ? username : `플레이어 ${i}`;

    playerBox.innerHTML = `
      <h3>${playerName}</h3>
      <div class="cards">
          <div class="card">
              <img src="cards/card_back.png" alt="카드 뒷면" class="card-image">
          </div>
          <div class="card">
              <img src="cards/card_back.png" alt="카드 뒷면" class="card-image">
          </div>
      </div>    
      <div class="pattern-result">-</div>
      <div class="winner-badge">승리!</div>
    `;

    playerContainer.appendChild(playerBox);
  }
}

// 게임 시작
function startGame() {
  if (gameStarted) {
    alert(
      "게임이 이미 시작되었습니다. 초기화 버튼을 눌러 새 게임을 시작하세요."
    );
    return;
  }

  gameStarted = true;
  document.getElementById("start-btn").disabled = true;
  document.getElementById("reset-btn").disabled = false;

  // API 호출하여 게임 시작
  fetch("/api/game/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ players: selectedPlayers }),
  })
    .then((response) => response.json())
    .then((data) => {
      // 게임 결과 표시
      displayGameResults(data);

      // 현재 게임 데이터 저장
      currentGameData = data;

      // 게임 기록 저장
      saveGameHistory(data);
    })
    .catch((error) => {
      console.error("게임 시작 오류:", error);
      // 오류 발생 시 프론트엔드에서 임시 데이터 생성 (개발용)
      const mockData = generateMockGameData();
      displayGameResults(mockData);
      currentGameData = mockData;
      saveGameHistory(mockData);
    });
}

// 게임 초기화 (카드 재배분 없음)
function resetGame() {
  // 플레이어 영역 초기화 (카드 숨김)
  const playerBoxes = document.querySelectorAll(".player-box");
  playerBoxes.forEach((box) => {
    // 승자 클래스 제거
    box.classList.remove("winner");

    const cardImages = box.querySelectorAll(".card-image");
    cardImages.forEach((img) => {
      img.src = "cards/card_back.png";
      img.alt = "카드 뒷면";
    });
    box.querySelector(".pattern-result").textContent = "-";
  });

  // 게임 결과 영역 초기화
  const gameResult = document.getElementById("game-result");
  gameResult.style.display = "none";
  gameResult.textContent = "";
  gameResult.className = "game-result";

  // 게임 상태 초기화
  gameStarted = false;
  document.getElementById("start-btn").disabled = false;
  document.getElementById("reset-btn").disabled = true;

  // API 호출하여 게임 상태 초기화 (서버에서는 세션만 초기화)
  fetch("/api/game/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ players: selectedPlayers }),
  }).catch((error) => {
    console.error("게임 초기화 오류:", error);
  });
}

// 결과 기록 표시
function showHistory() {
  const historyContainer = document.getElementById("history-container");
  historyContainer.innerHTML = "";

  // API 호출하여 게임 기록 가져오기
  fetch("/api/game/history")
    .then((response) => response.json())
    .then((data) => {
      renderHistoryItems(data);
    })
    .catch((error) => {
      console.error("게임 기록 조회 오류:", error);
      // 오류 발생 시 로컬 기록 사용
      renderHistoryItems(gameHistory);
    });

  // 모달 표시
  document.getElementById("history-modal").style.display = "block";
}

// 게임 결과 표시
function displayGameResults(data) {
  const username = localStorage.getItem("username") || "플레이어 1"; // ✅ 여기 추가

  data.players.forEach((player, index) => {
    const playerBox = document.getElementById(`player-${index + 1}`);
    if (!playerBox) return;

    // ✅ 플레이어 이름 설정
    const playerName = index === 0 ? username : `플레이어 ${index + 1}`;
    playerBox.querySelector("h3").textContent = playerName; // ✅ 여기에서 이름 적용

    // 승자 표시
    if (player.isWinner) {
      playerBox.classList.add("winner");
    } else {
      playerBox.classList.remove("winner");
    }

    const cardImages = playerBox.querySelectorAll(".card-image");
    const patternResult = playerBox.querySelector(".pattern-result");

    // 카드 이미지 표시
    cardImages[0].src = `cards/card_${player.cards[0].month}_${player.cards[0].type}.png`;
    cardImages[0].alt = `${player.cards[0].month}월 ${
      player.cards[0].type === 1 ? "광" : "열"
    }`;

    cardImages[1].src = `cards/card_${player.cards[1].month}_${player.cards[1].type}.png`;
    cardImages[1].alt = `${player.cards[1].month}월 ${
      player.cards[1].type === 1 ? "광" : "열"
    }`;

    // 족보 결과 표시
    patternResult.textContent = player.pattern;
  });

  // 게임 결과 영역에 승자 표시
  const gameResult = document.getElementById("game-result");
  gameResult.style.display = "block";

  if (data.isDraw > 0) {
    gameResult.textContent = "무승부!";
    gameResult.className = "game-result draw";
  } else if (data.isDraw < 0) {
    gameResult.textContent = "구사패 재경기!";
    gameResult.className = "game-result draw";
  } else if (data.winner >= 0) {
    gameResult.textContent = `플레이어 ${data.winner + 1} 승리!`;
    gameResult.className = "game-result winner";
  } else {
    gameResult.style.display = "none";
  }
}

// 게임 기록 저장
function saveGameHistory(data) {
  // 최대 10개까지만 저장
  if (gameHistory.length >= 10) {
    gameHistory.shift(); // 가장 오래된 기록 제거
  }

  // 타임스탬프 추가
  data.timestamp = new Date().toLocaleString();

  // ✅ 사용자 이름을 첫 번째 플레이어에 주입
  const username = localStorage.getItem("username") || "플레이어 1";
  if (data.players && data.players.length > 0) {
    data.players[0].username = username;
  }

  // 기록 추가
  gameHistory.push(data);
}

// 기록 항목 렌더링
function renderHistoryItems(historyData) {
  const historyContainer = document.getElementById("history-container");

  if (historyData.length === 0) {
    historyContainer.innerHTML = "<p>게임 기록이 없습니다.</p>";
    return;
  }

  // 최근 기록부터 표시 (최대 10개)
  const recentHistory = historyData.slice(-10).reverse();

  recentHistory.forEach((game, gameIndex) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    // 게임 헤더 (번호, 시간)
    const historyHeader = document.createElement("div");
    historyHeader.className = "history-header";
    historyHeader.innerHTML = `
            <span>게임 #${recentHistory.length - gameIndex}</span>
            <span>${game.timestamp || "기록 없음"}</span>
        `;

    // 승자 또는 무승부 정보 추가
    let winnerInfo = "";
    if (game.isDraw > 0) {
      winnerInfo = " (무승부)";
    } else if (game.isDraw < 0) {
      winnerInfo = " (구사패 재경기!)";
    } else if (game.winner >= 0) {
      winnerInfo = ` (플레이어 ${game.winner + 1} 승리)`;
    }

    historyHeader.innerHTML = `
            <span>게임 #${recentHistory.length - gameIndex}</span>
            <span>${game.timestamp || "기록 없음"}${winnerInfo}</span>
        `;

    // 플레이어 결과
    const historyPlayers = document.createElement("div");
    historyPlayers.className = "history-players";

    game.players.forEach((player, playerIndex) => {
      const historyPlayer = document.createElement("div");
      historyPlayer.className = player.isWinner
        ? "history-player winner"
        : "history-player";

      // ✅ 이름 우선순위: 저장된 username > 플레이어 n
      const playerName = player.username || `플레이어 ${playerIndex + 1}`;

      historyPlayer.innerHTML = `
        <div class="history-cards">
          <div class="history-card">
            <img src="cards/card_${player.cards[0].month}_${
        player.cards[0].type
      }.png" 
                 alt="${player.cards[0].month}월 ${
        player.cards[0].type === 1 ? "광" : "열"
      }" 
                 class="history-card-image">
          </div>
          <div class="history-card">
            <img src="cards/card_${player.cards[1].month}_${
        player.cards[1].type
      }.png" 
                 alt="${player.cards[1].month}월 ${
        player.cards[1].type === 1 ? "광" : "열"
      }" 
                 class="history-card-image">
          </div>
        </div>
        <div class="pattern-result">${playerName}: ${player.pattern}</div>
        ${player.isWinner ? '<div class="winner-badge">승리!</div>' : ""}
      `;

      historyPlayers.appendChild(historyPlayer);
    });

    historyItem.appendChild(historyHeader);
    historyItem.appendChild(historyPlayers);
    historyContainer.appendChild(historyItem);
  });
}

// BGM 컨트롤 초기화
function initializeAudioControls() {
  // BGM 요소
  bgmPlayer = document.getElementById("bgm");

  // 볼륨 설정
  bgmPlayer.volume = 0.5;

  // 재생 버튼
  document.getElementById("play-btn").addEventListener("click", function () {
    bgmPlayer.play();
    this.classList.add("active");
    document.getElementById("pause-btn").classList.remove("active");
  });

  // 일시정지 버튼
  document.getElementById("pause-btn").addEventListener("click", function () {
    bgmPlayer.pause();
    this.classList.add("active");
    document.getElementById("play-btn").classList.remove("active");
  });

  // 음소거 버튼
  document.getElementById("mute-btn").addEventListener("click", function () {
    if (bgmPlayer.muted) {
      bgmPlayer.muted = false;
      this.textContent = "🔊";
    } else {
      bgmPlayer.muted = true;
      this.textContent = "🔇";
    }
  });

  // 볼륨 슬라이더
  document
    .getElementById("volume-slider")
    .addEventListener("input", function () {
      bgmPlayer.volume = this.value / 100;
    });

  // 페이지 로드 시 자동 재생 (사용자 상호작용 필요)
  document.addEventListener(
    "click",
    function autoPlayHandler() {
      bgmPlayer.play().catch((error) => {
        console.log("자동 재생 실패:", error);
      });
      document.removeEventListener("click", autoPlayHandler);
    },
    { once: true }
  );
}

// 개발용 임시 데이터 생성 함수 (백엔드 연동 전 테스트용)
function generateMockGameData() {
  const cardTypes = [1, 2]; // 1: 광, 2: 열
  const patternNames = [
    "38광땡",
    "장땡",
    "9땡",
    "알리",
    "독사",
    "구삥",
    "장삥",
    "장사",
    "7끗",
    "4끗",
  ];

  const players = [];

  for (let i = 0; i < selectedPlayers; i++) {
    // 랜덤 카드 생성
    const card1 = {
      month: Math.floor(Math.random() * 10) + 1,
      type: cardTypes[Math.floor(Math.random() * cardTypes.length)],
    };

    const card2 = {
      month: Math.floor(Math.random() * 10) + 1,
      type: cardTypes[Math.floor(Math.random() * cardTypes.length)],
    };

    // 랜덤 족보 선택
    const pattern =
      patternNames[Math.floor(Math.random() * patternNames.length)];

    players.push({
      cards: [card1, card2],
      pattern: pattern,
    });
  }

  return {
    players: players,
    timestamp: new Date().toLocaleString(),
  };
}
