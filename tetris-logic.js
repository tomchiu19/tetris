function keyEventListener() {
  var isKeyDown = false;
  document.addEventListener('keydown', (event) => {
    const keyname = event.key;
    console.log('keydown event: ' + keyname);
    if(keyname == 'q') {
      window.close();
    }
    else if(keyname == 'r') {
      //console.log("yea?");
      movingBlock.restarted = true;
    }
    else if(keyname == 'ArrowDown') {
      if(!isKeyDown) {
        isKeyDown = true;
        movingBlock.minY--;
        movingBlock.shiftY--;
        isLegalMove = legalMove(fillMatrix, movingBlock);
        if(!isLegalMove) {
          movingBlock.minY++;
          movingBlock.shiftY++;
        }
      }
    }
    else if(keyname == 'ArrowRight') {
      if(!isKeyDown) {
        isKeyDown = true;
        movingBlock.minX++;
        movingBlock.maxX++;
        movingBlock.shiftX++;

        isLegalMove = legalMove(fillMatrix, movingBlock);
        if(!isLegalMove || movingBlock.maxX > 5) {
          movingBlock.minX--;
          movingBlock.maxX--;
          movingBlock.shiftX--;
        }
      }
    }
    else if(keyname == 'ArrowLeft') {
      if(!isKeyDown) {
        isKeyDown = true;
        movingBlock.minX--;
        movingBlock.maxX--;
        movingBlock.shiftX--;

        isLegalMove = legalMove(fillMatrix, movingBlock);
        if(!isLegalMove || movingBlock.minX < -5) {
          movingBlock.minX++;
          movingBlock.maxX++;
          movingBlock.shiftX++;
        }
      }
    }
    else if(keyname == 'ArrowUp') {
      if(!isKeyDown) {
        isKeyDown = true;
        rotateBlock(movingBlock);

        isLegalMove = legalMove(fillMatrix, movingBlock);
        if(!isLegalMove) {
          unrotateBlock(movingBlock);
        }
      }
    }
    else if(keyname == ' ') {
      if(!isKeyDown) {
        isKeyDown = true;
        movingBlock.minY--;
        movingBlock.shiftY--;
        isLegalMove = legalMove(fillMatrix, movingBlock);
        while(isLegalMove) {
          movingBlock.minY--;
          movingBlock.shiftY--;
          isLegalMove = legalMove(fillMatrix, movingBlock);
        }
        movingBlock.minY++;
        movingBlock.shiftY++;
      }
    }

  })
  //trying to prevent some bugs that happened when button mashing
  document.addEventListener('keyup', (event) => {
    const keyname = event.key;
    //console.log('keyup event: ' + keyname);
    /*else if(keyname == 'r') {
      restarted = true;
      main();
    }*/
    if(keyname == 'ArrowDown') {
      isKeyDown = false;
    }
    else if(keyname == 'ArrowRight') {
      isKeyDown = false;
    }
    else if(keyname == 'ArrowLeft') {
      isKeyDown = false;
    }
    else if(keyname == 'ArrowUp') {
      isKeyDown = false;
    }
    else if(keyname == ' ') {
      isKeyDown = false;
    }
  })
}
