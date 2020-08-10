const FOOT_CHAR = '🦶'; //'&#129462;';
const PALM_CHAR = '✋'; // '&#9995;';
const hamburgerEl = document.getElementById('hamburger');
const menuEl = document.getElementById('menu');
const fieldEl = document.getElementById('field');
const btnStart = document.getElementById('btnStart');
const btnPrevMove = document.getElementById('btnPrevMove');
const btnNextMove = document.getElementById('btnNextMove');
const btnFail = document.getElementById('btnFail');
const infoEl = document.getElementById('info');
const plyaersInfoEl = document.getElementById('players-info');
const toggleFullScreenElement = document.getElementById('toggle-full-screen');

const history = [];
let currentMove = 0;

const LIMB_NAMES_MAP = {
    lh: 'left   ' + PALM_CHAR,
    rh: 'right ' + PALM_CHAR,
    lf: 'left   ' + FOOT_CHAR,
    rf: 'right ' + FOOT_CHAR,
};
const COLOR_NAMES_MAP = {
    g: 'green',
    y: 'yellow',
    b: 'blue',
    r: 'red'
};
let isHover = false;

class Player {
    constructor(name) {
        this.name = name;
        this.limbs = {
            lh: null,
            rh: null,
            lf: null,
            rf: null
        };
    }
    setPositoin(limbName, position) {
        this.limbs[limbName] = position;
        return {
            limbName: limbName,
            player: this
        };
    }
    freePosition(limbName) {
        this.limbs[limbName] = null;
    }
    isFreeLimb() {
        return Object.values(this.limbs).some(l => !l);
    }
    getRandomLimb() {
        const limbNames = Object.keys(this.limbs);
        return limbNames[~~(Math.random() * limbNames.length)];
    }
    getFreeRandomLimb() {
        const limbNames = Object.keys(this.limbs).filter(k => !this.limbs[k]);
        return limbNames[~~(Math.random() * limbNames.length)];
    }
    info() {
        return '<ul>' + Object.keys(this.limbs).filter(ln => !!this.limbs[ln])
            .map(limbName => `<li>${LIMB_NAMES_MAP[limbName].replace(/\s/g, '&nbsp;')} ${COLOR_NAMES_MAP[this.limbs[limbName].color]} ${this.limbs[limbName].index + 1}</li>`)
            .join(' ') + '</ul>';
    }
}

const players = [
    new Player('Player 1'),
    new Player('Player 2'),
    new Player('Player 3'),
    new Player('Player 4'),
];

players.forEach((player, index) => {
    const key = 'player-' + index;
    const savedName = localStorage.getItem(key);
    if (savedName && savedName.length) {
        player.name = savedName;
        document.getElementById(key).value = player.name;
    }
});

const field = {
    g: [null, null, null, null, null, null],
    y: [null, null, null, null, null, null],
    b: [null, null, null, null, null, null],
    r: [null, null, null, null, null, null]
};
let currentPlayerIndex = -1, currentLimb = null, currentPosition = null, isCanFail = true;

function getFreeRandomPosition() {
    const options = [];
    Object.keys(field).forEach(color => {
        field[color].forEach((cell, index) => {
            !cell && options.push({
                color, index
            });
        });
    });
    return options[~~(Math.random() * options.length)]
}
function cellId(color, index) {
    return `cell-${color}-${index}`;
}
function renderCurrentMove() {
    const currentMoveEl = document.getElementById('current-move');
    const currentPlayer = players[currentPlayerIndex];
    currentMoveEl.innerHTML = '&nbsp;';
    if (!currentLimb || !currentPosition) return;
    currentMoveEl.innerHTML = `${currentPlayer.name} ${LIMB_NAMES_MAP[currentLimb]}on ${COLOR_NAMES_MAP[currentPosition.color]}-${currentPosition.index + 1}`;
}
function renderField() {
    Object.keys(field).forEach(color => {
        field[color].forEach((cell, i) => {
            const cellEl = document.getElementById(cellId(color, i));
            if (cellEl) {
                if (cell) {
                    cellEl.title = cell.player.name + ' ' + LIMB_NAMES_MAP[cell.limbName];
                    (!isHover || cell.player.isHover) && cellEl.classList.add('occupied');
                    if (cell.player.isHover) {
                        cellEl.style.borderColor = '#f90';
                    } else {
                        cellEl.style.borderColor = 'inherit';
                    }
                } else {
                    cellEl.title = '';
                    cellEl.classList.remove('occupied');
                }
            }
        })
    });
}
function renderPlayersInfo() {
    plyaersInfoEl.innerHTML = '<ul class="ul-first">' +
        players.map(player => `<li class="li-first" onmouseleave="pipka('${player.name}');" onmouseover="enter('${player.name}');"><span>${player.name}</span> ${player.info()}</li>`).join('\n') + '</ul>';
}
function render() {
    renderCurrentMove();
    renderField();
    renderPlayersInfo();
}
function prevMove() {
    if (currentMove == 0) {
        btnPrevMove.setAttribute('disabled', true);
    } else {
        currentMove--;
        players.forEach(player => {
            player.limbs = history[currentMove][player.name];
        });

        render();
    }
}
function nextMove() {
    btnFail.removeAttribute('disabled');
    btnPrevMove.removeAttribute('disabled');
    if (currentMove < history.length - 1) {
        currentMove++;
        players.forEach(player => {
            player.limbs = history[currentMove][player.name];
        });
    } else {
        history[currentMove] = {};
        players.forEach(player => {
            history[currentMove][player.name] = Object.assign({}, player.limbs);
        });
        currentMove++;
        // cycle through players
        currentPlayerIndex = players.length - 1 > currentPlayerIndex ? currentPlayerIndex + 1 : 0;
        const currentPlayer = players[currentPlayerIndex];
        // todo DRY
        if (currentPlayer.isFreeLimb()) {
            currentLimb = currentPlayer.getFreeRandomLimb();
            currentPosition = getFreeRandomPosition();
            const positionInfo = currentPlayer.setPositoin(currentLimb, currentPosition);
            field[currentPosition.color][currentPosition.index] = positionInfo;

        } else {
            // choose from all limbs
            currentLimb = currentPlayer.getRandomLimb();
            currentPosition = getFreeRandomPosition();
            field[currentPlayer.limbs[currentLimb].color][currentPlayer.limbs[currentLimb].index] = null;
            currentPlayer.freePosition(currentLimb);
            const positionInfo = currentPlayer.setPositoin(currentLimb, currentPosition);
            field[currentPosition.color][currentPosition.index] = positionInfo;
        }
        isCanFail = true;
    }
    render();
}

function start() {
    players.forEach((player, index) => {
        const key = 'player-' + index;
        player.name = document.getElementById(key).value;
        player.limbs = {
            lh: null,
            rh: null,
            lf: null,
            rf: null
        };
        localStorage.setItem(key, player.name);
    });
    toggleMenu();
    btnFail.setAttribute('disabled', true);
    //btnStart.setAttribute('disabled', 'disabled');

    render();
}

function fail() {
    const currentPlayer = players[currentPlayerIndex];
    if (!isCanFail || !currentPlayer) return;
    currentPlayer.freePosition('lh');
    currentPlayer.freePosition('rh');
    currentPlayer.freePosition('lf');
    currentPlayer.freePosition('rf');

    Object.keys(field).forEach(color => {
        field[color].forEach((cell, index) => {
            if (cell && cell.player === currentPlayer) {
                field[color][index] = null;
            }
        })
    });

    players.splice(currentPlayerIndex, 1);
    currentPosition = null;
    currentLimb = null;
    render();
    isCanFail = false;
    if (players.length <= 1) {
        alert(`Player ${players[0].name} is win!`);
        location.reload();
    }
}

function enter(playerName) {
    console.log('enter', playerName);
    const player = players.find(player => player.name === playerName);
    if (player) {
        player.isHover = true;
        isHover = true;
    }
    setTimeout(render, 0);
}
function pipka(playerName) {
    console.log('leave', playerName);
    const player = players.find(player => player.name === playerName);
    if (player) {
        player.isHover = false;
    }
    isHover = false;
    render();
}

function toggleMenu() {
    if (menuEl.classList.contains('visible')) {
        menuEl.classList.remove('visible');
    } else {
        menuEl.classList.add('visible');
    }
}

hamburgerEl.addEventListener('click', toggleMenu);
toggleFullScreenElement.addEventListener("change", e => {
    const isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);

    const docElm = document.documentElement;
    if (!isInFullScreen) {
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
});

btnStart.addEventListener('click', start);
btnPrevMove.addEventListener('click', prevMove);
btnNextMove.addEventListener('click', nextMove);
btnFail.addEventListener('click', fail);

fieldEl.addEventListener('click', function (e) {
    if (e.target.classList.contains('occupied')) {
        infoEl.innerHTML = e.target.title;
        if (infoEl.classList.contains('visible')) {
            infoEl.classList.remove('visible');
        } else {
            infoEl.classList.add('visible');
        }
        e.stopPropagation();
    }

});
document.body.addEventListener('click', function () {
    if (infoEl.classList.contains('visible')) {
        infoEl.classList.remove('visible');
    }
});
