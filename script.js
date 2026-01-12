// --- 画像アセットの準備 ---
// ※ご自身で用意した画像ファイルを使う場合は、
// boyImage.src = 'images/boy.png'; のように書き換えてください。

// 仮の男の子ドット絵 (青い服のキャラ)
const boyDataURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADtJREFUOE9jZKAQcAEZx0D4PxDLwykjVh8DA8N/EjG6Abg0kRVgU4RNEZbi/0RjBqoCNFIfjUwF2AAAlIE5gf2Q/b0AAAAASUVORK5CYII=";
// 仮のコロッケドット絵 (オレンジの楕円)
const itemDataURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADRJREFUOE9jZKAQcEAxNoyPz0DSo4z///+PgoH//wkwI5cBpI/mBgYcCtA8j00RNgVIBQCutT/B+I04qQAAAABJRU5ErkJggg==";

const boyImage = new Image();
boyImage.src = boyDataURI;
const itemImage = new Image();
itemImage.src = itemDataURI;


// --- ゲーム設定 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('game-overlay');
const bgm = document.getElementById('game-bgm'); // BGM要素を取得

// キャンバスサイズ（ドット感を出すため小さめに設定しCSSで引き伸ばす）
canvas.width = 400;
canvas.height = 200;

let gameActive = false;
let score = 0;
// キャラクター設定 (画像に合わせてサイズ調整)
let boy = { x: 50, y: 150, w: 32, h: 32, dy: 0, jump: -9, grounded: false };
let obstacles = [];
let items = [];
let frame = 0;

// ゲームループ
function update() {
    if (!gameActive) return;
    // 背景クリア（空色で塗りつぶし）
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 地面を描画
    ctx.fillStyle = "#654321";
    ctx.fillRect(0, 182, canvas.width, 18);


    // --- キャラクターの物理計算と描画 ---
    boy.dy += 0.6; // 重力
    boy.y += boy.dy;
    // 地面に着地
    if (boy.y + boy.h > 182) {
        boy.y = 182 - boy.h;
        boy.dy = 0;
        boy.grounded = true;
    }

    // 画像で描画 (読み込みが完了していれば表示)
    if (boyImage.complete) {
         // 影を描画
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(boy.x + 5, boy.y + boy.h - 2, boy.w - 10, 4);
        // 本体を描画
        ctx.drawImage(boyImage, boy.x, boy.y, boy.w, boy.h);
    } else {
        // 画像ロード前は仮の四角
        ctx.fillStyle = "#33f";
        ctx.fillRect(boy.x, boy.y, boy.w, boy.h);
    }


    // --- オブジェクト生成 ---
    // 障害物(トゲ)
    if (frame % 110 === 0) {
        obstacles.push({ x: 400, y: 162, w: 20, h: 20 });
    }
    // コロッケ
    if (frame % 160 === 0) {
        // 高さをランダムに
        let randomY = Math.random() * (120 - 50) + 50;
        items.push({ x: 400, y: randomY, w: 32, h: 32 });
    }

    // --- 障害物移動・描画 ---
    ctx.fillStyle = "#DC143C"; // トゲの色
    obstacles.forEach((obs, i) => {
        obs.x -= 4; // 移動速度
        // トゲの形（三角形）を描画
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.h);
        ctx.lineTo(obs.x + obs.w/2, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.fill();

        // 当たり判定（少し判定を甘く調整）
        if (boy.x < obs.x + obs.w - 5 && boy.x + boy.w > obs.x + 5 &&
            boy.y < obs.y + obs.h - 5 && boy.y + boy.h > obs.y + 5) {
            gameOver();
        }
        // 画面外に出たら削除
        if(obs.x + obs.w < 0) obstacles.splice(i, 1);
    });

    // --- アイテム移動・描画 ---
    items.forEach((it, i) => {
        it.x -= 4;
        // コロッケ画像描画
        if (itemImage.complete) {
            ctx.drawImage(itemImage, it.x, it.y, it.w, it.h);
        } else {
            ctx.fillStyle = "orange";
            ctx.fillRect(it.x, it.y, it.w, it.h);
        }

        // 当たり判定
        if (boy.x < it.x + it.w && boy.x + boy.w > it.x &&
            boy.y < it.y + it.h && boy.y + boy.h > it.y) {
            items.splice(i, 1);
            score++;
            if (score >= 3) winGame();
        }
         // 画面外に出たら削除
         if(it.x + it.w < 0) items.splice(i, 1);
    });

    // スコア表示
    ctx.fillStyle = "#000";
    ctx.font = "16px DotGothic16";
    ctx.fillText("コロッケ: " + score + "/3", 10, 30);

    frame++;
    requestAnimationFrame(update);
}

// ゲーム開始
startBtn.addEventListener('click', () => {
    resetGameData();
    gameActive = true;
    overlay.style.display = "none";
    bgm.currentTime = 0; // 音楽を最初から
    bgm.play(); // BGM再生
    update();
});

// ジャンプ操作
function jump(e) {
    // スクロール防止
    if(e.cancelable) e.preventDefault(); 
    
    if (boy.grounded && gameActive) {
        boy.dy = boy.jump;
        boy.grounded = false;
    }
}
// スマホとPCの両方のイベントに対応
canvas.addEventListener('touchstart', jump, { passive: false });
canvas.addEventListener('mousedown', jump);


// ゲームオーバー処理
function gameOver() {
    gameActive = false;
    bgm.pause(); // BGM停止
    overlay.innerHTML = '<p class="pixel-text">残念！</p><button id="retry-btn" class="pixel-btn flicker">もう一度！</button>';
    overlay.style.display = "block";
    document.getElementById('retry-btn').addEventListener('click', () => {
        // ページをリロードしてリセット
        location.reload(); 
    });
}

// ゲームクリア処理
function winGame() {
    gameActive = false;
    bgm.pause(); // BGM停止
    overlay.style.display = "none";
    setTimeout(() => {
        alert("クリア！\n「ワンコロを撫でてあげて」");
        resetGameData();
        overlay.innerHTML = '<p class="pixel-text">クリア済</p>';
        overlay.style.display = "block";
    }, 100);
}

// データリセット
function resetGameData() {
    score = 0;
    obstacles = [];
    items = [];
    frame = 0;
    boy.y = 150;
    boy.dy = 0;
}


// --- 撫でるアクション（ヘッダー） ---
let lastX = 0;
let directionChanges = 0;
let direction = '';
const header = document.getElementById('header-area');
const rubHint = document.querySelector('.rub-hint');

header.addEventListener('mousemove', handleRub);
header.addEventListener('touchmove', (e) => handleRub(e.touches[0]), { passive: true });

function handleRub(e) {
    let currentX = e.clientX || e.pageX;
    if (lastX > 0) {
        if ((lastX < currentX && direction !== 'right') || (lastX > currentX && direction !== 'left')) {
            direction = lastX < currentX ? 'right' : 'left';
            directionChanges++;
            // ヒントの表示を変更して反応してる感を出す
            rubHint.textContent = "（" + "ワシャ".repeat(directionChanges) + "…）";

            if (directionChanges >= 8) { // 4往復くらいで発動
                document.getElementById('pw-modal').classList.remove('hidden');
                directionChanges = 0;
                rubHint.textContent = "（…撫でてみて？）";
            }
        }
    }
    lastX = currentX;
}

// --- パスワード処理 ---
const pwInput = document.getElementById('pw-input');
const pwError = document.getElementById('pw-error');

document.getElementById('pw-submit').addEventListener('click', checkPassword);

function checkPassword() {
    if (pwInput.value === "0807") {
        document.getElementById('pw-modal').classList.add('hidden');
        // ページ切り替えアニメーション風
        document.getElementById('page1').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('page1').classList.add('hidden');
            document.getElementById('page2').classList.remove('hidden');
            window.scrollTo(0, 0);
        }, 500);
    } else {
        pwError.classList.remove('hidden');
        pwInput.value = "";
    }
}

// 宝箱オープン
function openChest() {
    // 新しいタブで動画を開く
    window.open("https://youtu.be/9jZpQtLCQSU", "_blank");
}