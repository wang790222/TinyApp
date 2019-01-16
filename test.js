function generateRandomString() {

  let randomStringLength = 6;

  let lowerCase = "abcdefghijklmnopqrstuvwxyz".split('');
  let captial = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  let number = "0123456789".split('');

  let randomString = "";

  for (i = 0; i < randomStringLength; i++) {
    let chooseType = Math.floor(Math.random() * 3 + 1);
    switch(chooseType) {
      case 1:
        randomString += lowerCase[Math.floor(Math.random() * 26)];
        break;
      case 2:
        randomString += captial[Math.floor(Math.random() * 26)];
        break;
      case 3:
        randomString += number[Math.floor(Math.random() * 10)];
        break;
      default:
        console.log("Something wrong.");
        break;
    }
  }
  return randomString;
}

console.log(generateRandomString());
