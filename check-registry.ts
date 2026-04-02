import { getUsernameRegistry } from "./src/lib/github";

async function check() {
    try {
        const reg = await getUsernameRegistry();
        console.log("Registry Content:", JSON.stringify(reg, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

check();
