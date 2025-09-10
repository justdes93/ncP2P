import { test, expect } from '@playwright/test'
import config from 'config'
import jwt from 'jsonwebtoken'
import mongoose, { Types } from 'mongoose'

const MONGO_URI = config.get('mongoUri')

test.beforeAll(async () => {
  mongoose.set('strictQuery', false)

  // Устанавливаем подключение
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  console.log('✅ MongoDB connected for tests')
})


test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await page.getByRole('textbox', { name: 'Login' }).click()
  await page.getByRole('textbox', { name: 'Login' }).fill('justdes')
  await page.getByRole('textbox', { name: 'Login' }).press('Tab')
  await page.getByRole('textbox', { name: 'Password' }).fill('chuprin03091993')
  await page.getByRole('button', { name: 'Lets Go' }).click()
  await page.waitForTimeout(2000)

  const { default: User } = await import('../layers/models/User.model')

  const user = await User.findOne({ _id: new Types.ObjectId("67b07478949ac4df08f10ca2") })
  const token = user?.twoFA
  if(!user || !token) { return }

  const secret = config.get('authSecret')
  const decoded = jwt.verify(token, secret)
  const code = decoded?.code?.toString()
  if(!code) { return }

  await page.getByRole('textbox', { name: 'Code' }).click()
  await page.getByRole('textbox', { name: 'Code' }).fill(code)
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Approve' }).click()
})

await page.getByRole('link', { name: ' Pay-in' }).click();
await page.getByRole('link', { name: ' Pay-out' }).click();
await page.getByRole('link', { name: ' Pool' }).click();
await page.getByRole('link', { name: ' Proof' }).click();
await page.getByText('ALL').click();
await page.getByText('ALL').click();
await page.getByRole('link', { name: ' Make' }).click();
await page.getByRole('textbox', { name: 'Card' }).click();
await page.getByRole('textbox', { name: 'Card' }).fill('4111111111111111');
await page.getByRole('textbox', { name: 'Amount' }).click();
await page.getByRole('textbox', { name: 'Amount' }).fill('3333');
await page.getByRole('textbox', { name: 'Course' }).click();
await page.getByRole('textbox', { name: 'Course' }).fill('42');
await page.getByRole('textbox', { name: 'Ref Id' }).click();
await page.getByRole('textbox', { name: 'Ref Id' }).fill('345kfkf');
await page.getByRole('button', { name: 'Create' }).click();
await page.locator('div').filter({ hasText: 'Make PaymentCreate' }).nth(3).click({
    button: 'right'
  });
await page.goto('http://localhost:3000/make');
await page.getByRole('link', { name: ' Proof' }).click();
await page.getByRole('link', { name: ' Make' }).click();
await page.getByRole('textbox', { name: 'Card' }).click();
await page.getByRole('textbox', { name: 'Card' }).fill('4111111111111111');
await page.getByRole('textbox', { name: 'Amount' }).click();
await page.getByRole('textbox', { name: 'Amount' }).fill('50000');
await page.getByRole('textbox', { name: 'Course' }).click();
await page.getByRole('textbox', { name: 'Course' }).fill('45');
await page.getByRole('textbox', { name: 'Ref Id' }).click();
await page.getByRole('textbox', { name: 'Ref Id' }).fill('loshra22');
await page.getByRole('button', { name: 'Create' }).click();
await page.locator('div').filter({ hasText: 'Make PaymentCreate' }).nth(3).click();
await page.locator('div').filter({ hasText: 'Make PaymentCreate' }).nth(3).click({
    button: 'right'
  });
await page.getByRole('button', { name: 'Create' }).click();
await page.getByRole('link', { name: ' Proof' }).click();
await page.getByRole('link', { name: ' Pay-out' }).click();
await page.getByRole('link', { name: ' Pay-in' }).click();
await page.getByRole('link', { name: ' Pay-out' }).click();
await page.getByRole('link', { name: ' Pool' }).click();
await page.getByRole('link', { name: ' Pay-out' }).click();
await page.getByRole('main').click({
    button: 'right'
  });
await page.goto('http://localhost:3000/payments');
await page.getByRole('button', { name: 'Freeze', exact: true }).first().click();
await page.getByRole('button', { name: 'Freeze', exact: true }).first().click();
await page.locator('button:nth-child(3)').first().click();
await page.getByRole('main').click();
await page.locator('body').press('ControlOrMeta+Shift+R');
await page.getByRole('main').click();
await page.locator('body').press('ControlOrMeta+Shift+R');
await page.getByRole('main').click({
    button: 'right'
  });
await page.locator('button:nth-child(3)').first().click();
await page.getByText('PreviosNext').click();
await page.getByRole('link', { name: ' Pay-out' }).click();
await page.getByRole('link', { name: ' Pool' }).click();