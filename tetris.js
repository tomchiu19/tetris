keyEventListener();

const ccRotate = Math.PI/2;
var currBlock = 0;
var stationaryBlocks = [];
var fillMatrix = new Array(20);
for (var i = 0; i < fillMatrix.length; i++) {
  fillMatrix[i] = new Array(10).fill(0);
}
var isLegalMove = true;
const initialGameSpeed = 300;
var gameSpeed = initialGameSpeed;
var bottomRowSum = 0;

main();

function main() {
  var stationaryBlocks = [];

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl');

  const linesClearedDisplay = document.querySelector('#linesCleared');
  var linesCleared = 0;

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program
  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 118.08 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);


  movingBlock = spawnRandomBlock(gl, programInfo, projectionMatrix);
  var currBlock = setInterval(function(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    stationaryBlocks.forEach(function(item) {
      //Draw O or I block
      if (item.blockID == 0) {
        drawRectangle(gl, programInfo, item.buffer, projectionMatrix, [item.shiftX, item.shiftY, -6.0], (ccRotate*item.rotation), [0,0,1]);
      }
      else if (item.blockID == 1) {
        drawRectangle(gl, programInfo, item.buffer, projectionMatrix, [item.shiftX, item.shiftY, -6.0], (ccRotate*item.rotation), [0,0,1]);
      }
      //Draw S, Z, L, J or T block
      else {
        drawDoubleRectangle(gl, programInfo, item.buffer, projectionMatrix, [item.shiftX, item.shiftY, -6.0], (ccRotate*item.rotation), [0,0,1]);
      }
    })

    //Draw O or I block
    if (movingBlock.blockID == 0) {
      drawRectangle(gl, programInfo, movingBlock.buffer, projectionMatrix, [movingBlock.shiftX, movingBlock.shiftY, -6.0], (ccRotate*movingBlock.rotation), [0,0,1]);
    }
    else if (movingBlock.blockID == 1) {
      drawRectangle(gl, programInfo, movingBlock.buffer, projectionMatrix, [movingBlock.shiftX, movingBlock.shiftY, -6.0], (ccRotate*movingBlock.rotation), [0,0,1]);
    }
    //Draw S, Z, L, J or T block
    else {
      drawDoubleRectangle(gl, programInfo, movingBlock.buffer, projectionMatrix, [movingBlock.shiftX, movingBlock.shiftY, -6.0], (ccRotate*movingBlock.rotation), [0,0,1]);
    }

    var buffers = initVertLineBuffers(gl);
    for(var i = -5; i <= 5; i++) {
      drawLine(gl, programInfo, buffers, projectionMatrix, [i, 0.0, -6.0]);
    }
    var buffers = initHorLineBuffers(gl);
    for(var i = -10; i <= 10; i++) {
      drawLine(gl, programInfo, buffers, projectionMatrix, [0.0, i, -6.0]);
    }

    if(movingBlock.minY <= -10) {
      stationaryBlocks.push(movingBlock);
      fillMatrix = updateFillMatrix(fillMatrix, movingBlock);
      movingBlock = spawnRandomBlock(gl, programInfo, projectionMatrix);
      isLegalMove = legalMove(fillMatrix, movingBlock);
      if(!isLegalMove) {
        alert("Game Over");
        clearInterval(currBlock);
      }
    }

    movingBlock.shiftY--;
    movingBlock.minY--;

    isLegalMove = legalMove(fillMatrix, movingBlock);
    if(!isLegalMove) {
      movingBlock.shiftY++;
      movingBlock.minY++;

      stationaryBlocks.push(movingBlock);
      fillMatrix = updateFillMatrix(fillMatrix, movingBlock);
      movingBlock = spawnRandomBlock(gl, programInfo, projectionMatrix);
      isLegalMove = legalMove(fillMatrix, movingBlock);
      if(!isLegalMove) {
        alert("Game Over");
        clearInterval(currBlock);
      }
    }

    //Clearing bottom row
    var tmpMatrix = JSON.parse(JSON.stringify(fillMatrix));
    bottomRowSum = tmpMatrix[19].reduce(function(a, b) {
      return a + b;
    }, 0);
    if(bottomRowSum == 10) {
      var newFillMatrix = new Array(20);
      var tmpArray = new Array(10).fill(0);
      newFillMatrix[0] = tmpArray;
      for (var i = 1; i < newFillMatrix.length ; i++) {
        tmpArray = JSON.parse(JSON.stringify(fillMatrix[i-1]));
        newFillMatrix[i] = tmpArray;
      }
      fillMatrix = newFillMatrix;

      stationaryBlocks.forEach(function(item) {
        item.minY--;
        item.shiftY--;
      })
      linesCleared++;
      linesClearedDisplay.innerHTML = linesCleared;
    }

    if(movingBlock.restarted) {
      clearInterval(currBlock);
      for (var i = 0; i < fillMatrix.length; i++) {
        for(var j = 0; j < fillMatrix[i].length; j++) {
          fillMatrix[i][j] = 0;
        }
      }
      linesCleared = 0;
      linesClearedDisplay.innerHTML = linesCleared;
      main();
    }

  }, gameSpeed);

}

function increaseGameSpeed() {
  gameSpeed = initialGameSpeed/2;
}

function decreaseGameSpeed() {
  gameSpeed = initialGameSpeed;
}

function rotateBlock(block) {
  block.rotation++;
  if(block.rotation > 3) {
    block.rotation = 0;
  }

  //O block, nothing changes
  //I block
  if (block.blockID == 1) {
    if(block.rotation == 0) {
      block.minX -= 2;
      block.maxX += 1;
      block.minY += 1;
    }
    else if (block.rotation == 1) {
      block.minX += 2;
      block.maxX -= 1;
      block.minY -= 2;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.maxX += 2;
      block.minY += 2;
    }
    else if (block.rotation == 3) {
      block.minX += 1;
      block.maxX -= 2;
      block.minY -= 1;
    }
  }
  //S block
  else if (block.blockID == 2) {
    if(block.rotation == 0) {
      block.maxX += 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
      block.minY -= 1;
    }
  }
  //Z block
  else if (block.blockID == 3) {
    if(block.rotation == 0) {
      block.maxX += 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
      block.minY -= 1;
    }
  }
  //L block
  else if (block.blockID == 4) {
    if(block.rotation == 0) {
      block.maxX += 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
      block.minY -= 1;
    }
  }
  //J block
  else if (block.blockID == 5) {
    if(block.rotation == 0) {
      block.maxX += 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
      block.minY -= 1;
    }
  }
  //T block
  else if (block.blockID == 6) {
    if(block.rotation == 0) {
      block.maxX += 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
      block.minY -= 1;
    }
  }
}

function unrotateBlock(block) {
  block.rotation--;
  if(block.rotation < 0) {
    block.rotation = 3;
  }

  //O block, nothing changes
  //I block
  if (block.blockID == 1) {
    if(block.rotation == 0) {
      block.minX -= 2;
      block.maxX += 1;
      block.minY += 2;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
      block.maxX -= 2;
      block.minY -= 2;
    }
    else if (block.rotation == 2) {
      block.minX -= 1;
      block.maxX += 2;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.minX += 2;
      block.maxX -= 1;
      block.minY -= 1;
    }
  }
  //S block
  else if (block.blockID == 2) {
    if(block.rotation == 0) {
      block.minX -= 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
      block.minY -= 1;
    }
    else if (block.rotation == 2) {
      block.maxX += 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
    }
  }
  //Z block
  else if (block.blockID == 3) {
    if(block.rotation == 0) {
      block.minX -= 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
      block.minY -= 1;
    }
    else if (block.rotation == 2) {
      block.maxX += 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
    }
  }
  //L block
  else if (block.blockID == 4) {
    if(block.rotation == 0) {
      block.minX -= 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
      block.minY -= 1;
    }
    else if (block.rotation == 2) {
      block.maxX += 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
    }
  }
  //J block
  else if (block.blockID == 5) {
    if(block.rotation == 0) {
      block.minX -= 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
      block.minY -= 1;
    }
    else if (block.rotation == 2) {
      block.maxX += 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
    }
  }
  //T block
  else if (block.blockID == 6) {
    if(block.rotation == 0) {
      block.minX -= 1;
    }
    else if (block.rotation == 1) {
      block.minX += 1;
      block.minY -= 1;
    }
    else if (block.rotation == 2) {
      block.maxX += 1;
      block.minY += 1;
    }
    else if (block.rotation == 3) {
      block.maxX -= 1;
    }
  }
}

function updateFillMatrix(fillMatrix, block) {
  minCol = convertXtoCol(block.minX);
  minRow = convertYtoRow(block.minY);

  //O block
  if(block.blockID == 0) {
    fillMatrix[minRow - 1][minCol] = 1;
    fillMatrix[minRow - 1][minCol + 1] = 1;
    fillMatrix[minRow][minCol] = 1;
    fillMatrix[minRow][minCol + 1] = 1;
  }
  //I block
  else if (block.blockID == 1) {
    if(block.rotation == 0) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
      fillMatrix[minRow][minCol + 3] = 1;
    }
    else if (block.rotation == 1) {
      fillMatrix[minRow - 3][minCol] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow][minCol] = 1;
    }
    else if (block.rotation == 2) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
      fillMatrix[minRow][minCol + 3] = 1;
    }
    else if (block.rotation == 3) {
      fillMatrix[minRow - 3][minCol] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow][minCol] = 1;
    }
  }
  //S block
  else if (block.blockID == 2) {
    if(block.rotation == 0) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 2] = 1;
    }
    else if (block.rotation == 1) {
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
    }
    else if (block.rotation == 2) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 2] = 1;
    }
    else if (block.rotation == 3) {
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
    }
  }
  //Z block
  else if (block.blockID == 3) {
    if(block.rotation == 0) {
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
    }
    else if (block.rotation == 1) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol + 1] = 1;
    }
    else if (block.rotation == 2) {
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
    }
    else if (block.rotation == 3) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol + 1] = 1;
    }
  }
  //L block
  else if (block.blockID == 4) {
    if(block.rotation == 0) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 2] = 1;
    }
    else if (block.rotation == 1) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
    }
    else if (block.rotation == 2) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
      fillMatrix[minRow - 1][minCol + 2] = 1;
    }
    else if (block.rotation == 3) {
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
    }
  }
  //J block
  else if (block.blockID == 5) {
    if(block.rotation == 0) {
      fillMatrix[minRow][minCol + 2] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 2] = 1;
    }
    else if (block.rotation == 1) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
      fillMatrix[minRow - 2][minCol + 1] = 1;
    }
    else if (block.rotation == 2) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
    }
    else if (block.rotation == 3) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol + 1] = 1;
    }
  }
  //T block
  else if (block.blockID == 6) {
    if(block.rotation == 0) {
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol + 2] = 1;
    }
    else if (block.rotation == 1) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol] = 1;
    }
    else if (block.rotation == 2) {
      fillMatrix[minRow][minCol] = 1;
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow][minCol + 2] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
    }
    else if (block.rotation == 3) {
      fillMatrix[minRow][minCol + 1] = 1;
      fillMatrix[minRow - 1][minCol] = 1;
      fillMatrix[minRow - 1][minCol + 1] = 1;
      fillMatrix[minRow - 2][minCol + 1] = 1;
    }
  }
  return fillMatrix;
}

function legalMove(fillMatrix, block) {
  minCol = convertXtoCol(block.minX);
  minRow = convertYtoRow(block.minY);

  if(block.minX < -5) {
    return false;
  }
  if(block.minY < -10) {
    return false;
  }
  if(block.maxX > 5) {
    return false;
  }

  //O block
  if(block.blockID == 0) {
    if (fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1) {
      return false;
    }
  }
  //I block
  else if (block.blockID == 1) {
    if(block.rotation == 0) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1 || fillMatrix[minRow][minCol + 3] == 1) {
        return false;
      }
    }
    else if (block.rotation == 1) {
      if (fillMatrix[minRow - 3][minCol] == 1 || fillMatrix[minRow - 2][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow][minCol] == 1) {
        return false;
      }
    }
    else if (block.rotation == 2) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1 || fillMatrix[minRow][minCol + 3] == 1) {
        return false;
      }
    }
    else if (block.rotation == 3) {
      if (fillMatrix[minRow - 3][minCol] == 1 || fillMatrix[minRow - 2][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow][minCol] == 1) {
        return false;
      }
    }
  }
  //S block
  else if (block.blockID == 2) {
    if(block.rotation == 0) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 1) {
      if (fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol] == 1) {
        return false;
      }
    }
    else if (block.rotation == 2) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 3) {
      if (fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol] == 1) {
        return false;
      }
    }
  }
  //Z block
  else if (block.blockID == 3) {
    if(block.rotation == 0) {
      if (fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 1) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol + 1] == 1) {
        return false;
      }
    }
    else if (block.rotation == 2) {
      if (fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 3) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol + 1] == 1) {
        return false;
      }
    }
  }
  //L block
  else if (block.blockID == 4) {
    if(block.rotation == 0) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 1) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 2][minCol] == 1) {
        return false;
      }
    }
    else if (block.rotation == 2) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1 || fillMatrix[minRow - 1][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 3) {
      if (fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol] == 1) {
        return false;
      }
    }
  }
  //J block
  else if (block.blockID == 5) {
    if(block.rotation == 0) {
      if (fillMatrix[minRow][minCol + 2] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 1) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 2][minCol] == 1 || fillMatrix[minRow - 2][minCol + 1] == 1) {
        return false;
      }
    }
    else if (block.rotation == 2) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1 || fillMatrix[minRow - 1][minCol] == 1) {
        return false;
      }
    }
    else if (block.rotation == 3) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol + 1] == 1) {
        return false;
      }
    }
  }
  //T block
  else if (block.blockID == 6) {
    if(block.rotation == 0) {
      if (fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol + 2] == 1) {
        return false;
      }
    }
    else if (block.rotation == 1) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol] == 1) {
        return false;
      }
    }
    else if (block.rotation == 2) {
      if (fillMatrix[minRow][minCol] == 1 || fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow][minCol + 2] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1) {
        return false;
      }
    }
    else if (block.rotation == 3) {
      if (fillMatrix[minRow][minCol + 1] == 1 || fillMatrix[minRow - 1][minCol] == 1 || fillMatrix[minRow - 1][minCol + 1] == 1 || fillMatrix[minRow - 2][minCol + 1] == 1) {
        return false;
      }
    }
  }

  return true;
}

function convertXtoCol(x) {
  return (x + 5);
}

function convertYtoRow(y) {
  if(Math.sign(y) == -1) {
    var row = Math.abs(y);
  }
  else {
    var row = -Math.abs(y);
  }
  return (row + 9);

}

function spawnRandomBlock(gl, programInfo, projectionMatrix) {
  const block = {};
  var blockID = getRndInteger(0, 6);
  //var blockID = 0;
  var rndShiftX = getRndInteger(-3, 2);
  if(blockID != 0) {
    rndShiftX += 0.5;
  }
  var rndRotation = getRndInteger(0, 3);

  //O block
  if (blockID == 0) {
    var movingBlockBuffer = initOBlockBuffers(gl);
    var shiftY = 9.0;
    var minY = shiftY - 1;
    var minX = rndShiftX - 1;
    var maxX = rndShiftX + 1;
  }
  //I block
  else if (blockID == 1) {
    var movingBlockBuffer = initIBlockBuffers(gl);
    if(rndRotation == 0) {
      var shiftY = 9.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 2.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 1) {
      var shiftY = 8.5;
      var minY = shiftY - 2.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 0.5;
    }
    else if (rndRotation == 2) {
      var shiftY = 9.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 2.5;
    }
    else if (rndRotation == 3) {
      var shiftY = 7.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 0.5;
    }
  }
  //S block
  else if (blockID == 2) {
    var movingBlockBuffer = initSBlockBuffers(gl);
    if(rndRotation == 0) {
      var shiftY = 9.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 1) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 2) {
      var shiftY = 8.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 3) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 0.5;
    }
  }
  //Z block
  else if (blockID == 3) {
    var movingBlockBuffer = initZBlockBuffers(gl);
    if(rndRotation == 0) {
      var shiftY = 9.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 1) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 2) {
      var shiftY = 8.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if (rndRotation == 3) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 0.5;
    }
  }
  //L block
  else if (blockID == 4) {
    var movingBlockBuffer = initLBlockBuffers(gl);
    if(rndRotation == 0) {
      var shiftY = 9.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 1) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 2) {
      var shiftY = 8.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 3) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 0.5;
    }
  }
  //J block
  else if (blockID == 5) {
    var movingBlockBuffer = initJBlockBuffers(gl);
    if(rndRotation == 0) {
      var shiftY = 9.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 1) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 2) {
      var shiftY = 8.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 3) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 0.5;
    }
  }
  //T block
  else if (blockID == 6) {
    var movingBlockBuffer = initTBlockBuffers(gl);
    if(rndRotation == 0) {
      var shiftY = 9.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 1) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 0.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 2) {
      var shiftY = 8.5;
      var minY = shiftY - 0.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 1.5;
    }
    else if(rndRotation == 3) {
      var shiftY = 8.5;
      var minY = shiftY - 1.5;
      var minX = rndShiftX - 1.5;
      var maxX = rndShiftX + 0.5;
    }
  }

  block.blockID = blockID;
  block.shiftX = rndShiftX;
  block.shiftY = shiftY;
  block.minY = minY;
  block.minX = minX;
  block.maxX = maxX;
  block.rotation = rndRotation;
  block.buffer = movingBlockBuffer;
  block.restarted = false;
  return block;
}

function initVertLineBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     0.0,  10.0,
    0.0,  -10.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    0.1,  0.1,  0.1,  1.0,
    0.1,  0.1,  0.1,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initHorLineBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     5.0,  0.0,
    -5.0,  0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    0.1,  0.1,  0.1,  1.0,
    0.1,  0.1,  0.1,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initOBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    1.0,  1.0,  0.0,  1.0,
    1.0,  1.0,  0.0,  1.0,
    1.0,  1.0,  0.0,  1.0,
    1.0,  1.0,  0.0,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initIBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     1.5,  0.5,
    -2.5,  0.5,
     1.5, -0.5,
    -2.5, -0.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    0.0,  1.0,  1.0,  1.0,
    0.0,  1.0,  1.0,  1.0,
    0.0,  1.0,  1.0,  1.0,
    0.0,  1.0,  1.0,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initSBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     1.5,  0.5,
    -0.5,  0.5,
     1.5, -0.5,
    -0.5, -0.5,
    0.5,  -0.5,
   -1.5,  -0.5,
    0.5, -1.5,
   -1.5, -1.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
    0.0,  1.0,  0.0,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initZBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     0.5,  0.5,
    -1.5,  0.5,
     0.5, -0.5,
    -1.5, -0.5,
    1.5,  -0.5,
   -0.5,  -0.5,
    1.5, -1.5,
   -0.5, -1.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
    1.0,  0.0,  0.0,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initLBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     1.5,  0.5,
    -1.5,  0.5,
     1.5, -0.5,
    -1.5, -0.5,
    -0.5,  -0.5,
   -1.5,  -0.5,
    -0.5, -1.5,
   -1.5, -1.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
    1.0,  0.6,  0.0,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initJBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     1.5,  0.5,
    -1.5,  0.5,
     1.5, -0.5,
    -1.5, -0.5,
    1.5,  -0.5,
   0.5,  -0.5,
    1.5, -1.5,
   0.5, -1.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
    0.0,  0.0,  1.0,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}

function initTBlockBuffers(gl) {

  const buffer = {};

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
     1.5,  0.5,
    -1.5,  0.5,
     1.5, -0.5,
    -1.5, -0.5,
    0.5,  -0.5,
   -0.5,  -0.5,
    0.5, -1.5,
   -0.5, -1.5,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
    0.5,  0.0,  0.5,  1.0,
  ];

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  buffer.position = positionBuffer;
  buffer.color = colorBuffer;

  return buffer;
}


function drawRectangle(gl, programInfo, buffers, projectionMatrix, translateArray, rotateAngle, rotateAxis) {

  var modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix,
                 modelViewMatrix,
                 translateArray);

  mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                rotateAngle,
                rotateAxis);

  {
    var numComponents = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  {
    var numComponents = 4;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    var offset = 0;
    var vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

function drawDoubleRectangle(gl, programInfo, buffers, projectionMatrix, translateArray, rotateAngle, rotateAxis) {

  var modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix,
                 modelViewMatrix,
                 translateArray);

  mat4.rotate(modelViewMatrix,
                modelViewMatrix,
                rotateAngle,
                rotateAxis);

  {
    var numComponents = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  {
    var numComponents = 4;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    var offset = 0;
    var vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    gl.drawArrays(gl.TRIANGLE_STRIP, offset+4, vertexCount);
  }
}

function drawLine(gl, programInfo, buffers, projectionMatrix, translateArray) {


  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  var modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 translateArray);  // amount to translate

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    var numComponents = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    var numComponents = 4;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    var offset = 0;
    var vertexCount = 2;
    gl.drawArrays(gl.LINE_STRIP, offset, vertexCount);
  }
}

// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}
