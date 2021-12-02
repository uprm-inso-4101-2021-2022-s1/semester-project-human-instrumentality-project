class Tinder4Logic {
    constructor(selector){
        this.ROWS = 6;
        this.COLS = 7;
        this.player = 'teal';
        this.selector = selector;
        this.isGameOver = false;
        this.onPlayerMove = function () {};
        this.createGrid();
        this.setEventListener();
    }
//$-refers to jquery convention
    createGrid(){
        const $gameboard = $(this.selector);  
        $gameboard.empty();
        this.isGameOver = false;    
        this.player = 'teal';
        for (let row=0; row<this.ROWS; row++){
            const $row = $('<div>')
            .addClass('row');
            for (let col=0; col<this.COLS; col++){
                const $col = $('<div>')
                .addClass('col empty')
                .attr('data-col', col)
                .attr('data-row', row);
                $row.append($col);
            }
            $gameboard.append($row);
        }
    }  

    setEventListener(){
        const $gameboard = $(this.selector);
        const memory = this;

        function findLastEmptyCell(col){
            const cells = $(`.col[data-col='${col}']`);
            for (let i = cells.length - 1; i >= 0; i--){
                const $cell = $(cells[i]);
                if ($cell.hasClass('empty')){
                    return $cell;
                }
            }
            return null;
        }

        
        $gameboard.on('mouseenter', '.col.empty', function(){
            if (memory.isGameOver) return;
            const col = $(this).data('col');
            const $lastEmptyCell = findLastEmptyCell(col);
            $lastEmptyCell.addClass(`next-${memory.player}`);
        });

        $gameboard.on('mouseleave', '.col', function() {
            $('.col').removeClass(`next-${memory.player}`);
        });

        $gameboard.on('click', '.col.empty', function(){
            if (memory.isGameOver) return;
            const col = $(this).data('col');
            const row = $(this).data('row');
            const $lastEmptyCell = findLastEmptyCell(col);

            $lastEmptyCell.removeClass(`empty next-${memory.player}`);
            $lastEmptyCell.addClass(memory.player);
            $lastEmptyCell.data('player', memory.player);
            
            const win = memory.checkForWinner($lastEmptyCell.data('row'), $lastEmptyCell.data('col'));
            if (win){
                memory.isGameOver = true;
                //alert should use players username
                alert(`Game has finished, ${memory.player} has won!`);
                $('.col.empty').removeClass('empty');
                return;
            }
            memory.player = (memory.player === 'teal') ? 'red' : 'teal';
            //make into username
            memory.onPlayerMove();
            $(this).trigger("mouseenter");
        })

    }

    checkForWinner(row, col){ 
        const mem = this;

        function $getCell(i, j){
            return $(`.col[data-row='${i}'][data-col='${j}']`);
        }

        function checkDir(dir){
            let total = 0;
            let i = row + dir.i;
            let j = col + dir.j;
            let $next = $getCell(i,j);
            while(i >= 0 &&
                i < mem.ROWS &&
                j >= 0 &&
                j < mem.COLS &&
                $next.data('player') === mem.player)
                {
                total++;
                i += dir.i;
                j += dir.j;
                $next = $getCell(i, j);
            }
                return total;
        }

        function checkWin(dirA, dirB){
            const total = 1 + 
            checkDir(dirA) +
            checkDir(dirB);
            if (total >= 4) {
                return mem.player;
            }
            else {
                return null;
            }
        }

        function checkVerticals(){ 
            return checkWin({i: -1, j: 0}, {i: 1, j: 0});
        }
        function checkHorizontals(){ 
            return checkWin({i: 0, j: -1}, {i: 0, j: 1});
        }
        function checkDiagonalBLtoTR(){
            return checkWin({i: 1, j: -1}, {i: 1, j: 1});
        }
        function checkDiagonalTLtoBR(){
            return checkWin({i: 1, j: 1}, {i: -1, j: -1});
            //return checkWin({i: 1, j: -1}, {i: -1, j: 1});
        }


        return checkVerticals() || checkHorizontals() ||
            checkDiagonalBLtoTR() || checkDiagonalTLtoBR();
        
    
    }
    //lock restart to when one person wins, othersie just send them back to the play section
    restart(){
        this.createGrid();
        this.onPlayerMove();
    }
}


