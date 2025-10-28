import bcrypt from "bcrypt";
const hash = await bcrypt.hash("Benbenek123", 10);
console.log(hash);