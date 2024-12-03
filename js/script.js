const board = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const levelSelect = document.getElementById("level-select");
const instructions = document.getElementById("instructions");
const endGameButton = document.getElementById("end-game");
const gameTitle = document.getElementById("game-title");

let width = 10; // Default board width
let height = 18; // Default board height
let cells = [];
let currentPosition = 4;
let currentFigure;
let score = 0;
let level = 1;
let gameInterval;
let dropSpeed = 1000;
let isMovingDown = false; // Флаг для контролю, чи рухається фігура вниз

const figures = [
    [   // Рівень 1
        [1, width + 1, width * 2 + 1, 2],  // L
        [0, 1, width, width + 1],          // O
        [1, width, width + 1, width + 2],   // T
        [1, width + 1, width * 2 + 1, width * 3 + 1], // I  (додано)
        [0, 1, width + 1, width + 2]       // Z
    ],
    [   // Рівень 2
        [1, width + 1, width * 2 + 1, width * 3 + 1], // I
        [1, width + 1, width * 2 + 1, 2], // L
        [0, 1, width, width + 1], // O
        [1, width, width + 1, width + 2], // T
        [0, 1, width + 1, width + 2], // Z
    ],
    [   // Рівень 3
        [1, width + 1, width * 2 + 1, 2], // L
        [0, 1, width, width + 1], // O
        [1, width, width + 1, width + 2], // T
        [0, 1, width + 1, width + 2], // Z
        [1, width + 1, width * 2 + 1, width * 3 + 1], // I
        [1, width, width * 2 + 1, width * 2 + 2], // J (нова фігура)
        [0, 1, 2, width + 2], // S (нова фігура)
    ],
    [   // Рівень 4
        [1, width + 1, width * 2 + 1, 2], // L
        [0, 1, width, width + 1], // O
        [1, width, width + 1, width + 2], // T
        [0, 1, width + 1, width + 2], // Z
        [1, width + 1, width * 2 + 1, width * 3 + 1], // I
        [0, 1, width + 1, width + 2, width * 2 + 2], // J (нова фігура)
        [0, 1, 2, width + 2], // S (нова фігура)
        [0, 1, 2, 3], // L (нова фігура для рівня 4)
    ]
];


function createBoard() {
    board.innerHTML = "";
    cells = [];
    board.style.gridTemplateColumns = `repeat(${width}, 30px)`;
    board.style.gridTemplateRows = `repeat(${height}, 30px)`;
    for (let i = 0; i < width * height; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        board.appendChild(cell);
        cells.push(cell);
    }
}

function drawFigure() {
    currentFigure.shape.forEach(index => {
        cells[currentPosition + index]?.classList.add("active");
    });
}

function clearFigure() {
    currentFigure.shape.forEach(index => {
        cells[currentPosition + index]?.classList.remove("active");
    });
}

// Оновлення функції, щоб рух був лише за один такт
function moveDown() {
    if (isMovingDown) return; // Перевірка, чи фігура вже рухається вниз
    isMovingDown = true; // Встановлюємо флаг, що рух йде

    clearFigure(); // Очистити поточне положення фігури
    const isAtBottom = currentFigure.shape.some(
        index => currentPosition + index + width >= width * height ||
            cells[currentPosition + index + width]?.classList.contains("filled")
    );

    if (!isAtBottom) {
        currentPosition += width; // Рух вниз на одну клітинку
    } else {
        lockFigure(); // Якщо фігура дійшла до низу, зафіксувати її
    }

    drawFigure(); // Намалювати фігуру в новому положенні

    // Після завершення руху дозволяємо наступний рух вниз через інтервал
    setTimeout(() => {
        isMovingDown = false;
    }, dropSpeed);
}

function moveLeft() {
    clearFigure();
    const isAtLeftEdge = currentFigure.shape.some(index => (currentPosition + index) % width === 0);
    const isBlocked = currentFigure.shape.some(index => cells[currentPosition + index - 1]?.classList.contains("filled"));

    if (!isAtLeftEdge && !isBlocked) {
        currentPosition -= 1;
    }
    drawFigure();
}

function moveRight() {
    clearFigure();
    const isAtRightEdge = currentFigure.shape.some(index => (currentPosition + index) % width === width - 1);
    const isBlocked = currentFigure.shape.some(index => cells[currentPosition + index + 1]?.classList.contains("filled"));

    if (!isAtRightEdge && !isBlocked) {
        currentPosition += 1;
    }
    drawFigure();
}

function lockFigure() {
    currentFigure.shape.forEach(index => {
        cells[currentPosition + index]?.classList.add("filled");
    });
    checkFullLines();
    spawnFigure(); // Створити нову фігуру після того, як поточна зафіксувалась
}

function checkFullLines() {
    for (let row = 0; row < height; row++) {
        const start = row * width;
        const isFull = cells.slice(start, start + width).every(cell => cell.classList.contains("filled"));
        if (isFull) {
            score += calculateScore();

            removeLine(start); // Якщо рядок заповнений, видаляємо його
            row--; // Перевіряємо той самий рядок після видалення
        }
    }
    updateScore(); // Оновлення рахунку
}

function removeLine(start) {
    for (let i = start; i < start + width; i++) {
        cells[i].classList.remove("filled");
    }
    for (let i = start - 1; i >= 0; i--) {
        if (cells[i].classList.contains("filled")) {
            cells[i].classList.remove("filled");
            cells[i + width].classList.add("filled");
        }
    }
}

function isTopRowFilled() {
    for (let i = 0; i < width; i++) {
        if (cells[i].classList.contains("filled")) {
            return true; // Якщо є хоча б одна заповнена клітинка, то верхня частина зайнята
        }
    }
    return false;
}
function spawnFigure() {
    if (isTopRowFilled()) {
        endGame();
        return;
    }
    // Фігури для кожного рівня
    const levelFigures = [
        [   // Рівень 1
            [1, width + 1, width * 2 + 1, 2],  // L
            [0, 1, width, width + 1],          // O
            [1, width, width + 1, width + 2],   // T
            [1, width + 1, width * 2 + 1, width * 3 + 1], // I  (додано)
            [0, 1, width + 1, width + 2]       // Z
        ],
        [ // Рівень 2
            [1, width + 1, width * 2 + 1, 2], // L
            [0, 1, width, width + 1], // O
            [1, width, width + 1, width + 2], // T
            [0, 1, width + 1, width + 2], // Z
        ],
        [ // Рівень 3
            [1, width + 1, width * 2 + 1, 2], // L
            [0, 1, width, width + 1], // O
            [1, width, width + 1, width + 2], // T
            [0, 1, width + 1, width + 2], // Z
            [1, width + 1, width * 2 + 1, width * 3 + 1], // I
        ],
        [ // Рівень 4
            [1, width + 1, width * 2 + 1, 2], // L
            [0, 1, width, width + 1], // O
            [1, width, width + 1, width + 2], // T
            [0, 1, width + 1, width + 2], // Z
            [1, width + 1, width * 2 + 1, width * 3 + 1], // I
            [0, 1, width + 1, width + 2, width * 2 + 2], // J (новий тип фігури)
        ]
    ];

    // Вибір фігури з рівня
    const figureType = Math.floor(Math.random() * levelFigures[level - 1].length);
    const baseShape = levelFigures[level - 1][figureType];

    // Випадковий вибір кута повороту (0, 90, 180, 270)
    const randomRotation = Math.floor(Math.random() * 4);  // Вибір випадкового кута (0, 1, 2, 3)

    // Визначення орієнтацій для кожної фігури
    const rotations = [
        // L
        [
            [1, width + 1, width * 2 + 1, 2],
            [width, width + 1, width + 2, 2],
            [1, width + 1, width * 2 + 1, width * 2 + 2],
            [0, 1, 2, width + 2]
        ],
        // O
        [
            [0, 1, width, width + 1],
            [0, 1, width, width + 1],  // О не змінюється
            [0, 1, width, width + 1],
            [0, 1, width, width + 1]   // О не змінюється
        ],
        // T
        [
            [1, width, width + 1, width + 2],
            [1, width + 1, width + 2, width * 2 + 1],
            [1, width, width + 1, width + 2],
            [width, width + 1, width + 2, width * 2 + 1]
        ],
        // Z
        [
            [0, 1, width + 1, width + 2],
            [1, width, width + 1, width * 2 + 1],
            [0, 1, width + 1, width + 2],
            [1, width, width + 1, width * 2 + 1]
        ],
        // I
        [
            [1, width + 1, width * 2 + 1, width * 3 + 1],
            [1, width, width + 1, width + 2],
            [1, width + 1, width * 2 + 1, width * 3 + 1],
            [1, width, width + 1, width + 2]
        ],
        // J
        [
            [0, 1, width + 1, width * 2 + 1],
            [0, 1, width, width + 1],
            [0, 1, width + 1, width * 2 + 1],
            [0, 1, width, width + 1]
        ]
    ];

    // Вибір форми і орієнтації
    currentFigure = {
        type: figureType,
        rotation: randomRotation,
        shape: rotations[figureType][randomRotation],
    };

    currentPosition = 4;  // Початкова позиція фігури
    drawFigure();  // Намалювати фігуру
}


// Оновлення функції, щоб фігура рухалася по 1 клітинці за раз
function updateScore() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    clearInterval(gameInterval); // Очистити попередній інтервал
    gameInterval = setInterval(moveDown, dropSpeed); // Запустити новий інтервал
}

function calculateScore() {
    // Класичний підрахунок очок у Тетрісі
    switch (level) {
        case 1: return 40 * (level + 1);
        case 2: return 100 * (level + 1);
        case 3: return 300 * (level + 1);
        case 4: return 1200 * (level + 1); // Тетріс!
        default: return 0;
    }
}

function startGame(selectedLevel) {
    // Схожий процес як і раніше, тільки інтервал буде налаштований на рух лише одного кроку за такт
    gameTitle.style.display = "none";

    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();

    instructions.style.opacity = "0";
    levelSelect.style.opacity = "0";
    setTimeout(() => {
        instructions.style.display = "none";
        levelSelect.style.display = "none";
        board.classList.add("active");
        endGameButton.style.display = "block"; // Display "End Game" button
        document.getElementById("score-board").style.display = "block"; // Show Score and Level
    }, 1000);

    level = selectedLevel;
    width = 10 + (level - 1) * 2; // Increase width per level
    height = 18; // Keep height constant

    // Зміна швидкості для кожного рівня
    // Швидкість зменшується на кожному рівні
    dropSpeed = 500 - (level - 1) * 100; // зменшуємо швидкість на 200 мілісекунд на кожному рівні

    createBoard();
    spawnFigure();
    updateScore();
    gameInterval = setInterval(moveDown, dropSpeed); // Ініціалізація інтервалу руху
}

function endGame() {
    clearInterval(gameInterval);
    createBoard();
    gameTitle.style.display = "block"; // Show title again
    levelSelect.style.display = "block";
    levelSelect.style.opacity = "1";
    instructions.style.display = "block";
    instructions.style.opacity = "1";
    board.classList.remove("active");
    endGameButton.style.display = "none";
    score = 0;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = "1";

    const backgroundMusic = document.getElementById('background-music');
    backgroundMusic.pause();

}

document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") moveLeft();
    if (e.key === "ArrowRight") moveRight();
    if (e.key === "ArrowDown") {
        if (!isMovingDown) moveDownOneStep();; // Рух тільки якщо не рухається вниз
    }
});

function moveDownOneStep() {
    clearFigure(); // Очистити поточне положення фігури

    // Перевірка, чи фігура досягла дна або блокується іншим об'єктом
    const isAtBottom = currentFigure.shape.some(
        index => currentPosition + index + width >= width * height ||
            cells[currentPosition + index + width]?.classList.contains("filled")
    );

    if (!isAtBottom) {
        currentPosition += width; // Рух фігури вниз на одну клітинку
    } else {
        lockFigure(); // Якщо фігура досягла дна або заблокована, фіксуємо її
    }

    drawFigure(); // Намалювати фігуру в новому положенні
}