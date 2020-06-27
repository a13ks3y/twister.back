const FOOT_CHAR = '🦶'; //'&#129462;';
const PALM_CHAR = '✋'; // '&#9995;';
const hamburgerEl = document.getElementById('hamburger');
const menuEl = document.getElementById('menu');
const fieldEl = document.getElementById('field');
const btnStart = document.getElementById('btnStart');
const btnNextMove = document.getElementById('btnNextMove');
const btnFail = document.getElementById('btnFail');
const infoEl = document.getElementById('info');
const plyaersInfoEl = document.getElementById('players-info');
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
        return limbNames[~~(Math.random()*limbNames.length)];
    }
    getFreeRandomLimb() {
        const limbNames = Object.keys(this.limbs).filter(k => !this.limbs[k]);
        return limbNames[~~(Math.random()*limbNames.length)];
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
    return options[~~(Math.random()*options.length)]
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
                    cellEl.classList.add('occupied');
                } else {
                    cellEl.title = '';
                    cellEl.classList.remove('occupied');
                }
            }
        })
    });
}
function renderPlayersInfo() {
    plyaersInfoEl.innerHTML = '<ul>' +
    players.map(player => `<li>${player.name} ${player.info()}</li>`).join('\n') + '</ul>';
}
function render() {
    renderCurrentMove();
    renderField();
    renderPlayersInfo();
}

function nextMove() {
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
    render();
}

function start() {
    players.forEach((player, index) => {
        const key = 'player-' + index;
        player.name = document.getElementById(key).value;
        localStorage.setItem(key, player.name);
    });
    btnStart.setAttribute('disabled', 'disabled');
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

hamburgerEl.addEventListener('click', () => {
    if (menuEl.classList.contains('visible')) {
        menuEl.classList.remove('visible');
    } else {
        menuEl.classList.add('visible');
    }
 });
 
 btnStart.addEventListener('click', start);
 btnNextMove.addEventListener('click', nextMove);
 btnFail.addEventListener('click', fail);

 fieldEl.addEventListener('click', function(e) {
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
 document.body.addEventListener('click', function(){
    if (infoEl.classList.contains('visible')) {
        infoEl.classList.remove('visible');
    }
 });
 