document.addEventListener('keydown', function(e) {
    // F5 または Ctrl+R によるリロードを無効化
    if (e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        console.log("リロードは無効化されています");
    }
});

// スマホのプル・ツー・リフレッシュを無効化
let lastTouchY = 0;

document.addEventListener('touchstart', function(e) {
    // タッチ開始時の Y 座標を保存
    if (e.touches.length === 1) {
        lastTouchY = e.touches[0].clientY;
    }
}, {passive: true});

document.addEventListener('touchmove', function(e) {
    // 画面最上部で下方向へのスワイプの場合、リロードを防止
    const touchY = e.touches[0].clientY;
    if (window.scrollY === 0 && touchY > lastTouchY) {
        e.preventDefault();
    }
}, {passive: false});
