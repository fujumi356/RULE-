const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const timerDisplay = document.getElementById('time');
const questionArea = document.getElementById('question-area'); // question-area要素をconstで定義
const clearScreen = document.getElementById('clear-screen');
const tweetButton = document.getElementById('tweet-button');
const clearTimeDisplay = document.getElementById('time-result'); // クリアタイム表示要素
const transitionScreen = document.getElementById('transition-screen'); // ★ transition-screen 要素
const transitionMessage = document.getElementById('transition-message'); // ★ transition-message 要素
const nextSetButton = document.getElementById('next-set-button'); // ★ next-set-button 要素

let timer;
let elapsedTime; // 経過時間
let currentQuestionSet = 0; // 現在の問題セット番号
let correctAnswersCount; // 現在の問題セットでの正解数
let answeredQuestions; // 解答済みフラグを配列で管理
// const questionsPerSet = 3; // ★ questionsPerSet 変数を削除
let answerInputs = []; // 動的に生成される answer-input を格納する配列
let hintElements = []; // 動的に生成される hint を格納する配列
let answerButtons = []; // 動的に生成される answer-button を格納する配列

// ★ 正規化のためのマッピングデータ (必要に応じて拡張)
const zenkakuKatakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン゛゜ァィゥｪォッャュョヮヰヱヲ"; // ｪ は変換困難なためそのまま
const hiragana =        "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん゛゜ぁぃぅぇぉっゃゅょゎゐゑを";
const zenkakuEiji =     "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ";
const hankakuEiji =     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// ★ 解答文字列を正規化する関数
function normalizeAnswer(answer) {
    if (!answer) return ""; // answerがnullishの場合空文字を返す

    let normalized = answer.trim(); // 1. 前後の空白を削除

    // 2. 全角スペースを半角スペースに変換
    normalized = normalized.replace(/　/g, ' ');

    // 3. 大文字英字を小文字英字に変換
    normalized = normalized.toLowerCase();

    // 4. カタカナをひらがなに変換
    normalized = normalized.replace(/[ァ-ヶ]/g, function(match) {
        const charCode = match.charCodeAt(0);
        // ァ(12449) - ぁ(12353) = 96 (0x60)
        return String.fromCharCode(charCode - 0x60);
    });

    // 6. 全角英数字を半角英数字に変換
    let tempHankaku = "";
    for(let i=0; i < normalized.length; i++) {
        const char = normalized[i];
        let index = zenkakuEiji.indexOf(char);
        if (index > -1) {
            tempHankaku += hankakuEiji[index];
            continue;
        }
         tempHankaku += char;
    }
    normalized = tempHankaku;
    
    return normalized;
}


// デフォルトのヒント表示までの時間 (秒)
const timeForHint1 = 2; 
const timeForHint2 = 5;//最初からの時間（ヒント１からではない）

// 問題データ (画像ファイル名と答えとヒント)
const questions = [
    {
        count: 3, // Ａ
        data: [
            { image: 'a1.JPG', answer: ['おんせん','温泉'], hint: 'a1hint.JPG', hint2: 'unused' },
            { image: 'a2.JPG', answer: ['きーぱー'], hint: 'a2hint.JPG', hint2: 'unused' },
            { image: 'a3.JPG', answer: ['しげん','資源'], hint: 'a3hint.JPG', hint2: 'unused' }
        ],
        hintDelay: 3,
        // セット共通の第2段階ヒントテキストを追加
        hintText: "Ａの法則：丸い形のもの",
        isLastSet: false
    },
    {
        count: 3, // Ｂ
        data: [
            { image: 'b1.JPG', answer: ['サイト','site'], hint: 'b1hint.JPG' },
            { image: 'b2.JPG', answer: ['ねじれ'], hint: 'b2hint.JPG' },
            { image: 'b3.JPG', answer: ['湯水','ゆみず'], hint: 'b3hint.JPG' }
        ],
        hintText: "Bの法則：12星座",
        isLastSet: false
    },
    {
        count: 3, // Ｃ
        data: [
            { image: 'c1.JPG', answer: ['猫','ねこ','cat','きゃっと'], hint: 'c1hint.JPG' },
            { image: 'c2.JPG', answer: ['わいん','wine'], hint: 'c2hint.JPG' },
            { image: 'c3.JPG', answer: ['えーる','yell'], hint: 'c3hint.JPG' }
        ],
        hintText: "Cの法則：アルファベット",
        isLastSet: false
    },
    {
        count: 3, // Ｄ
        data: [
            { image: 'd1.JPG', answer: ['空','そら'], hint: 'd1hint.JPG' },
            { image: 'd2.JPG', answer: ['ろっく','lock'], hint: 'd2hint.JPG' },
            { image: 'd3.JPG', answer: ['しきゅうしき','始球式'], hint: 'd3hint.JPG' }
        ],
        hintText: "Dの法則：人間の体の一部または全体",
        isLastSet: false
    },
    {
        count: 3, // Ｅ
        data: [
            { image: 'e1.JPG', answer: ['あいきどう','合気道'], hint: 'e1hint.JPG' },
            { image: 'e2.JPG', answer: ['onion','オニオン'], hint: 'e2hint.JPG' },
            { image: 'e3.JPG', answer: ['あーす','earth'], hint: 'e3hint.JPG' }
        ],
        hintText: "Eの法則：アイと読むもの",
        isLastSet: false
    },
    {
        count: 3, // Ｆ
        data: [
            { image: 'f1.JPG', answer: ['帽子','ぼうし'], hint: 'f1hint.JPG' },
            { image: 'f2.JPG', answer: ['給料日','きゅうりょうび'], hint: 'f2hint.JPG' },
            { image: 'f3.JPG', answer: ['いぬ','犬'], hint: 'f3hint.JPG' }
        ],
        hintText: "Fの法則：キュウと読むもの",
         isLastSet: false
    },
    {
        count: 3, // Ｇ
        data: [
            { image: 'g1.JPG', answer: ['くつ','靴'], hint: 'g1hint.JPG' },
            { image: 'g2.JPG', answer: ['霊媒師','れいばいし'], hint: 'g2hint.JPG' },
            { image: 'g3.JPG', answer: ['くじ'], hint: 'g3hint.JPG' }
        ],
        hintText: "Gの法則：×の形",
        isLastSet: false
    },
    {
        count: 3, // Ｈ
        data: [
            { image: 'h1.JPG', answer: ['wink','ういんく'], hint: 'h1hint.JPG' },
            { image: 'h2.JPG', answer: ['いわて','岩手','岩手県','いわてけん'], hint: 'h2hint.JPG' },
            { image: 'h3.JPG', answer: ['しわ'], hint: 'h3hint.JPG' }
        ],
        hintText: "Hの法則：九九にあるもの",
        transitionMessage: "追加のルール用紙を見て\nルールを確認してください \n 確認できれば下のボタンを\n押してください",
        isLastSet: false
    },
    {
        count: 4, // 中謎（そのまま）
        data: [
            { image: 'm1.JPG', answer: ['餌','えさ'], hint: 'm1hint.JPG',hint2: 'm1hint2.JPG' },
            { image: 'm2.JPG', answer: ['目黒','めぐろ'], hint: 'm2hint.JPG', hint2: 'm2hint2.JPG' },
            { image: 'm3.JPG', answer: ['おんらいん'], hint: 'm3hint.JPG', hint2: 'm3hint3.JPG' },
            { image: 'm4.JPG', answer: ['all','おーる'], hint: 'm4hint.JPG', hint2: 'm4hint4.JPG' }
        ],
        hintDelay: 420,
        isLastSet: false
    },
    {
        count: 1, // ラス謎（そのまま）
        data: [
            { image: 'last.JPG', answer: ['ばーど','bird'], hint: 'lasthint.JPG', hint2: 'lasthint2.JPG' }
        ],
        hintDelay: 300,
        hintDelay2: 600,
        isLastSet: true
    }
];

let hintTimers = []; // ヒントタイマーを配列で管理


// タイマー開始 (カウントアップ)
function startTimer() {
    // quizStartTime と quizElapsedTime をローカルストレージから取得
    const storedStartTime = localStorage.getItem("quizStartTime");
    const storedElapsedTime = localStorage.getItem("quizElapsedTime");

    if (storedStartTime && storedElapsedTime) {
        const timeDifference = Math.floor((Date.now() - Number(storedStartTime)) / 1000);
        elapsedTime = Number(storedElapsedTime) + timeDifference;
    } else {
        elapsedTime = 0;
        localStorage.setItem("quizStartTime", Date.now());
        localStorage.setItem("quizElapsedTime", elapsedTime);
    }

    timerDisplay.style.position = 'relative';
    timerDisplay.style.zIndex = '100';
    timerDisplay.textContent = formatTime(elapsedTime);

    timer = setInterval(() => {
        elapsedTime++;
        timerDisplay.textContent = formatTime(elapsedTime);
        localStorage.setItem("quizElapsedTime", elapsedTime); // 経過時間を保存
    }, 1000);
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// ヒント表示のアニメーション効果（level: 'first' または 'second'）
function showHintWithAnimation(imageElement, level) {
    imageElement.style.opacity = '0';
    if (level === 'first') {
        // 第1段階ヒント画像に切り替え
        imageElement.src = imageElement.dataset.hint;
    } else if (level === 'second') {
        // 第2段階ヒント画像に切り替え
        imageElement.src = imageElement.dataset.hint2;
    }
    let opacity = 0;
    const fadeIn = setInterval(() => {
        opacity += 0.1;
        imageElement.style.opacity = opacity;
        if (opacity >= 1) clearInterval(fadeIn);
    }, 50);
}


// 正解時のエフェクト
function showCorrectEffect(inputElement) {
    inputElement.style.backgroundColor = '#2ecc71'; // 緑色で固定
    inputElement.style.color = 'white';
}


// 不正解時のエフェクト
function showIncorrectEffect(inputElement) {
    inputElement.style.backgroundColor = '#e74c3c';
    inputElement.style.color = 'white';
    setTimeout(() => {
        inputElement.style.backgroundColor = '';
        inputElement.style.color = '';
    }, 1000);
}


// ヒント表示タイマーをする関数（2段階）
function startHintTimers() {
    hintTimers = []; // タイマー配列を初期化
    const currentSet = questions[currentQuestionSet];
    // 第1段階のヒント表示までの待機時間
    const delay1 = (currentSet.hintDelay !== undefined ? currentSet.hintDelay : timeForHint1) * 1000;
    // 第2段階のヒント表示までの待機時間
    const delay2 = (currentSet.hintDelay2 !== undefined ? currentSet.hintDelay2 : timeForHint2) * 1000;
    
    // 個別ヒント画像 (第1段階) のタイマー設定
    for (let i = 0; i < getCurrentQuestionCount(); i++) { 
        hintTimers.push(setTimeout(() => showHintWithAnimation(hintElements[i], 'first'), delay1));
    }
    
    // セット共通の第2段階ヒントテキストが定義されていれば、そちらを表示
    if (currentSet.hintText) {
        hintTimers.push(setTimeout(showCommonHintText, delay2));
    } else {
        // 定義がなければ、従来通り各問題ごとの second ヒント処理（必要に応じて）
        for (let i = 0; i < getCurrentQuestionCount(); i++) {
            hintTimers.push(setTimeout(() => showHintWithAnimation(hintElements[i], 'second'), delay2));
        }
    }
}

function showCommonHintText() {
    // common-hint-text がなければ作成し、questionArea の上に配置
    let commonHint = document.getElementById('common-hint-text');
    if (!commonHint) {
        commonHint = document.createElement('p');
        commonHint.id = 'common-hint-text';
        commonHint.style.opacity = '0';
        commonHint.style.transition = 'opacity 0.5s';
        // questionArea の直前に挿入（レイアウトに合わせて位置調整）
        questionArea.parentNode.insertBefore(commonHint, questionArea);
    }
    // 現在のセットの hintText を表示
    commonHint.textContent = questions[currentQuestionSet].hintText;
    setTimeout(() => {
        commonHint.style.opacity = '1';
    }, 50);
}


// ヒントタイマーをクリアする関数
function clearHintTimers() {
    hintTimers.forEach(timer => clearTimeout(timer));
    hintTimers = []; // タイマー配列をクリア
}


// クイズ開始処理
function startQuiz() {
    startScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    transitionScreen.classList.add('hidden'); // ★ transitionScreen を非表示にする
    clearScreen.classList.add('hidden'); // 念のため非表示
    currentQuestionSet = 0; // 問題セットをリセット
    loadQuestionSet(currentQuestionSet);
    localStorage.setItem("quizStartTime", Date.now()); // 追加: クイズ開始時刻を保存
    startTimer();
    startHintTimers(); // ヒントタイマー開始
}

// 問題セットをロード
function loadQuestionSet(setIndex) {
    clearQuestionArea();
    answerInputs = [];
    hintElements = []; // ヒント画像要素を格納
    answerButtons = [];
    transitionScreen.classList.add('hidden');

    // 前のセットで作成された共通ヒントテキスト要素があれば削除
    let commonHint = document.getElementById('common-hint-text');
    if(commonHint) {
        commonHint.remove();
    }
    
    if (setIndex < questions.length) {
        const currentSet = questions[setIndex];
        const questionCount = currentSet.count;
        const questionDataArray = currentSet.data;
        correctAnswersCount = 0;
        answeredQuestions = Array(questionCount).fill(false);
    
        for (let i = 0; i < questionCount; i++) {
            const questionData = questionDataArray[i];
    
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question');
    
            // 画像要素を生成し、オリジナル画像とヒント画像パスをデータ属性に保存
            const questionImg = document.createElement('img');
            questionImg.src = questionData.image;
            questionImg.alt = `問題${i + 1}`;
            questionImg.dataset.original = questionData.image;
            questionImg.dataset.hint = questionData.hint;
            questionDiv.appendChild(questionImg);
            hintElements.push(questionImg);
    
            // 解答入力欄生成
            const answerInput = document.createElement('input');
            answerInput.type = 'text';
            answerInput.classList.add('answer-input');
            answerInput.id = `answer-${i + 1}`;
            questionDiv.appendChild(answerInput);
            answerInputs.push(answerInput);
    
            // 解答ボタン生成
            const answerButton = document.createElement('button');
            answerButton.classList.add('answer-button-single');
            answerButton.id = `answer-button-${i + 1}`;
            answerButton.textContent = '解答する';
            answerButton.dataset.questionIndex = i;
            answerButton.addEventListener('click', () => checkAnswer(i));
            questionDiv.appendChild(answerButton);
            answerButtons.push(answerButton);
    
            questionArea.appendChild(questionDiv);
        }
    
        quizScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
    
    } else {
        clearInterval(timer);
        clearHintTimers();
        showClearScreen();
    }
}

// 問題セット間のトランジション画面を表示する関数
function showTransitionScreen(message) {
    quizScreen.classList.add('hidden'); // ★ quiz-screen を非表示
    transitionMessage.textContent = message; // メッセージを設定
    transitionScreen.classList.remove('hidden'); // transition-screen を表示
}

// 次の問題セットへ進む関数
function nextQuestionSet() {
    transitionScreen.classList.add('hidden'); // transition-screen を非表示
    currentQuestionSet++; // 問題セット番号をインクリメント
    loadQuestionSet(currentQuestionSet); // 次の問題セットをロード
    startHintTimers(); // ヒントタイマー再開
}

// next-set-button にイベントリスナーを設定
nextSetButton.addEventListener('click', nextQuestionSet);


// 現在の問題セットの問題数を取得する関数
function getCurrentQuestionCount() {
    return questions[currentQuestionSet].count;
}


// question-area の子要素を全て削除する関数
function clearQuestionArea() {
    while (questionArea.firstChild) {
        questionArea.removeChild(questionArea.firstChild);
    }
}


// 個別解答チェック関数 (問題番号を引数で受け取る)
function checkAnswer(questionIndex) {
    if (answeredQuestions[questionIndex]) return; // すでに解答済みなら何もしない
    const currentSet = questions[currentQuestionSet];
    const userAnswer = normalizeAnswer(answerInputs[questionIndex].value);
    
    // 正解候補（配列）を取得し、各候補も正規化
    const candidateAnswers = currentSet.data[questionIndex].answer;
    const normalizedCandidates = candidateAnswers.map(ans => normalizeAnswer(ans));
    
    if (normalizedCandidates.includes(userAnswer)) {
        correctAnswersCount++;
        showCorrectEffect(answerInputs[questionIndex]); // 正解エフェクト
        answerInputs[questionIndex].disabled = true;
        answeredQuestions[questionIndex] = true; // 解答済みに設定
    } else {
        showIncorrectEffect(answerInputs[questionIndex]); // 不正解エフェクト
    }
    checkAllAnswers(); // 全て正解したかチェック
}


// 全て正解したかチェックし、次の問題セットに進むかクリア画面へ
function checkAllAnswers() {
    const questionCount = getCurrentQuestionCount();
    const allAnswered = answeredQuestions.every(answered => answered);
    if (allAnswered && correctAnswersCount === questionCount) {
        if (questions[currentQuestionSet].isLastSet) {
            showClearScreen();
            clearInterval(timer);
            clearHintTimers();
        } else if (questions[currentQuestionSet].transitionMessage) {  // transitionMessageがあれば
            showTransitionScreen(questions[currentQuestionSet].transitionMessage);
            clearInterval(timer);
            clearHintTimers();
        } else {
            setTimeout(() => {
                currentQuestionSet++;
                loadQuestionSet(currentQuestionSet);
                clearHintTimers();
                startHintTimers();
            }, 1000);
        }
    }
}

// 追加: タイマーのキャッシュを削除するヘルパー関数
function clearTimerCache() {
    localStorage.removeItem("quizStartTime");
}

// 変更: クリア画面表示時にタイマーキャッシュを削除するようにする
function showClearScreen() {
    quizScreen.classList.add('hidden');
    transitionScreen.classList.add('hidden'); // ★ transitionScreen を非表示
    clearScreen.classList.remove('hidden');
    clearTimeDisplay.textContent = formatTime(elapsedTime); // クリアタイムを表示
    clearTimerCache(); // タイマーのキャッシュを削除
}

// スタート画面表示（リトライ時など）時にも開始時刻を削除
function showStartScreen() {
    quizScreen.classList.add('hidden');
    transitionScreen.classList.add('hidden'); // ★ transitionScreen を非表示
    clearScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    timerDisplay.textContent = '0'; // タイマー表示をリセット (0秒)
    clearTimerCache(); // 追加: タイマーのキャッシュを削除
}

// X (旧Twitter) シェア機能
tweetButton.addEventListener('click', () => {
    const tweetText = encodeURIComponent(`「RULE EXCLUDE」をクリアしました！ タイムは ${formatTime(elapsedTime)} 秒でした！`); // シェアするテキストにタイムを追加
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(tweetUrl, '_blank');
});


// イベントリスナー
startButton.addEventListener('click', startQuiz);


// 初期状態: スタート画面を表示
showStartScreen();