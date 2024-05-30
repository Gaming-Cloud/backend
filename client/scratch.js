// ANSI escape codes for colors
const colors = {
    navy: '\x1b[44m',   // Background Blue
    red: '\x1b[41m',    // Background Red
    white: '\x1b[47m',  // Background White
    grey: '\x1b[100m',  // Background Bright Black (Gray)
    reset: '\x1b[0m',   // Reset
  };
  
  // Define the size of the square
  const squareSize = 5;
  
  // Function to create a colored square
  const createColoredSquare = (color) => {
    let square = '';
    for (let i = 0; i < squareSize; i++) {
      for (let j = 0; j < squareSize; j++) {
        square += `${color}  `; // Two spaces to make it more square-like
      }
      square += `${colors.reset}\n`; // Reset color and move to the next line
    }
    return square;
  };
  
  // Example usage
  console.log(createColoredSquare(colors.navy)); // Navy square
  console.log(createColoredSquare(colors.red)); // Red square
  console.log(createColoredSquare(colors.white)); // White square
  console.log(createColoredSquare(colors.grey)); // Grey square
  