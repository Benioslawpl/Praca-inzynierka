import bcrypt from "bcryptjs";

const password = "Test123!"; // tu wpisz hasło, które chcesz zhashować

const hash = await bcrypt.hash(password, 10);
console.log("Hasło:", password);
console.log("Hash bcrypt:", hash);