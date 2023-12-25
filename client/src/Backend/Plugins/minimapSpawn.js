class MinimapSpawnPlugin {
  constructor() {
    this.minDensity = 1000;
    this.maxDensity = 10000;
    this.selectedCoords = { x: 0, y: 0 }; // Initial coordinates
    this.canvas = document.createElement('canvas');
    this.coordsDiv = document.createElement('div');
    this.coordsDiv.style.textAlign = 'center';
    this.sizeFactor = 500;
    this.clickOccurred = false;
    this.step = 1500;
    this.dot = 5.5;
    this.canvasSize = 600;
    this.InnerNebulaColor = '#00ADE1';// '#21215d';
    this.OuterNebulaColor = '#505050';//'#24247d';
    this.DeepSpaceColor = '#505050';//'#000000';
    this.CorruptedSpaceColor = '#505050'; //'#460046';
    this.xWorld = undefined;
    this.yWorld = undefined;
    this.formatCoords = '(???,???)';
    this.coordsDiv.style.fontSize = '20px';

  }

  async render(div) {
    // Default values

    div.style.width = '400px';
    div.style.height = '400px';




    const radius = ui.getWorldRadius();
    const rim = Math.sqrt(df.getContractConstants().SPAWN_RIM_AREA);

    const image = new Image();
    image.src = '../../../../public/DFARESLogo-v3.svg';

    // Wait for the image to load
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const normalize = (val) => {
      return Math.floor(((val + radius) * this.sizeFactor) / (radius * 2));
    };

    const checkBounds = (a, b, x, y, r) => {
      let dist = (a - x) * (a - x) + (b - y) * (b - y);
      r *= r;
      return dist < r;
    };

    // Sample points in a grid and determine space type

    const generate = () => {
      div.style.width = '99%';
      div.style.height = '99%';
      this.canvas.width = this.canvasSize;
      this.canvas.height = this.canvasSize;
      this.sizeFactor = this.canvasSize - 18;
      let data = [];

      // Generate x coordinates
      for (let i = radius * -1; i < radius; i += this.step) {
        // Generate y coordinates
        for (let j = radius * -1; j < radius; j += this.step) {
          // Filter points within map circle
          if (checkBounds(0, 0, i, j, radius)) {
            // Store coordinate and space type
            data.push({
              x: i,
              y: j,
              type: df.spaceTypeFromPerlin(df.spaceTypePerlin({ x: i, y: j })),
            });
          }
        }
      }

      // Draw mini-map

      const ctx = this.canvas.getContext('2d');

      for (let i = 0; i < data.length; i++) {
        if (data[i].type === 0) {
          ctx.fillStyle = this.InnerNebulaColor;  // Inner nebula
        } else if (data[i].type === 1) {
          ctx.fillStyle = this.OuterNebulaColor; // Outer nebula
        } else if (data[i].type === 2) {
          ctx.fillStyle = this.DeepSpaceColor;// Deep space
        } else if (data[i].type === 3) {
          ctx.fillStyle = this.CorruptedSpaceColor; // Corrupted slightly brighter for better visibility
        }
        ctx.fillRect(normalize(data[i].x) - 1, normalize(data[i].y * -1) + 1, this.dot, this.dot);
      }

      // Recenter viewport based on click location

      this.canvas.style = 'cursor: pointer;';

      // draw outside of map

      let radiusNormalized = normalize(radius) / 2;

      ctx.beginPath();
      ctx.arc(radiusNormalized + 2, radiusNormalized + 3, radiusNormalized, 0, 2 * Math.PI);
      ctx.strokeStyle = 'pink';
      ctx.lineWidth = 4;
      ctx.stroke();

      // draw inner cicrle of map

      let rimNormalized = (normalize(rim) / 2) * 0.91; // idk why here need to be corection??

      ctx.beginPath();
      ctx.arc(
        radiusNormalized, // centerX
        radiusNormalized, // centerY
        rimNormalized, // radius
        0,
        2 * Math.PI
      );
      ctx.fillStyle = 'rgb(255,180,193,1)';//#ffb4c1'; // Fill color
      ctx.fill();

      // draw img to centre
      const drawImageAtCenter = (ctx, image, worldRadius) => {
        // Calculate the position and size for the image
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const trueWidth = worldRadius * 0.8; // Adjust as needed
        const trueHeight = worldRadius * 0.8; // Adjust as needed

        // Draw the image at the center
        ctx.drawImage(
          image,
          centerX - trueWidth / 2 - 10,
          centerY - trueHeight / 2 - 10,
          trueWidth,
          trueHeight
        );
      };

      // Draw the image at the center with the specified rim radius
      drawImageAtCenter(ctx, image, radiusNormalized);
    };

    const toWorldCoord = (val) => {
      return Math.floor((val * radius * 2) / this.sizeFactor - radius);
    };

    const onMouseMove = (event) => {
      const x = event.offsetX;
      const y = event.offsetY;
      const xWorld = toWorldCoord(x);
      const yWorld = toWorldCoord(y) * -1;
      // console.log(`onMouseMove [${xWorld}, ${yWorld}]`);
      if (this.clickOccurred === false) {
        this.xWorld = xWorld;
        this.yWorld = yWorld;
        let formatX = this.xWorld === undefined ? '???' : this.xWorld.toString();
        let formatY = this.yWorld === undefined ? '???' : this.yWorld.toString();
        let formatCoords = '(' + formatX + ',' + formatY + ')';
        this.formatCoords = formatCoords;
      }



      const radius = ui.getWorldRadius();
      const rim = Math.sqrt(df.getContractConstants().SPAWN_RIM_AREA);

      if (checkBounds(0, 0, xWorld, yWorld, rim)) {
        // Inside the rim, change cursor to 'move'
        this.canvas.style.cursor = 'no-drop';
        this.moveInsideRim = false; // Set a flag
        this.coordsDiv.innerText = 'Can\'t Spawn Here 😅';
        this.coordsDiv.style.color = 'pink';


      } else if (checkBounds(0, 0, xWorld, yWorld, radius)) {
        // Inside the world radius but outside the rim, change cursor to 'pointer'
        const spaceType = df.spaceTypeFromPerlin(df.spaceTypePerlin({ x: xWorld, y: yWorld }));

        // Check if the space type is inner nebula (type 0)
        if (spaceType === 0) {
          this.canvas.style.cursor = 'pointer';
          this.moveInsideRim = false;
          this.coordsDiv.innerText = this.formatCoords;
          this.coordsDiv.style.color = this.InnerNebulaColor;

        } else {
          this.canvas.style.cursor = 'no-drop';
          this.moveInsideRim = true; // Reset the flag
          this.coordsDiv.innerText = 'Can\'t Spawn Here 😅';
          this.coordsDiv.style.color = 'pink';



        }
      } else {
        // Outside both world radius and rim, change cursor to 'default'
        this.canvas.style.cursor = 'default';
        this.moveInsideRim = false; // Reset the flag
        this.coordsDiv.innerText = '';
        this.coordsDiv.style.color = '';

      }


    };

    this.canvas.addEventListener('mousemove', onMouseMove);

    generate();
    div.appendChild(this.canvas);



    div.appendChild(this.coordsDiv);

  }

  destroy() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async runAndGetUserCoords() {
    // Create an object to store selected coordinates
    let selectedCoords = { x: 0, y: 0 };

    const radius = ui.getWorldRadius();

    const checkBounds = (a, b, x, y, r) => {
      let dist = (a - x) * (a - x) + (b - y) * (b - y);
      r *= r;
      return dist < r;
    };

    const toWorldCoord = (val) => {
      return Math.floor((val * radius * 2) / this.sizeFactor - radius);
    };
    // Add a click event listener to the canvas
    this.canvas.addEventListener(
      'click',
      (event) => {
        let x = event.offsetX;
        let y = event.offsetY;
        let xWorld = toWorldCoord(x);
        let yWorld = toWorldCoord(y) * -1;
        const radius = ui.getWorldRadius();
        const rim = Math.sqrt(df.getContractConstants().SPAWN_RIM_AREA);

        if (checkBounds(0, 0, xWorld, yWorld, rim)) {
          console.log(`WRONG SELECTION TO CLOSE!!`);
        }
        // Check if the cursor is in the 'pointer' area
        else if (checkBounds(0, 0, xWorld, yWorld, radius)) {
          // Inside the world radius but outside the rim, change cursor to 'pointer'
          const spaceType = df.spaceTypeFromPerlin(df.spaceTypePerlin({ x: xWorld, y: yWorld }));

          // Check if the space type is inner nebula (type 0)
          if (spaceType === 0) {
            selectedCoords = { x: xWorld, y: yWorld };
            console.log(`[${xWorld}, ${yWorld}]`);
            this.clickOccurred = true;
          } else {
            console.log(`WRONG SELECTION TO NOT A SPACE TYPE INNER NEBULA!!`);
          }
        } else {
          console.log(`WRONG SELECTION TO MUCH OUT!!`);
        }
      },
      null
    );

    // Wait for the click event to occur
    while (!this.clickOccurred || this.moveInsideRim) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.canvas.style.cursor = 'default';
    // Return the selected coordinates
    return selectedCoords;
  }
}

export default MinimapSpawnPlugin;