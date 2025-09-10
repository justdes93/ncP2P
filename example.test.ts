import * as playwright from "@playwright/test"

playwright.test("Login p2p", async ({page}) => {
    await page.goto("http://localhost:3000/")
    
})