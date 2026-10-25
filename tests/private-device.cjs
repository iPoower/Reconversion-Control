"use strict";
// Existing personal-storage tests explicitly choose their fictional private device.
// Public/default-access tests never use this helper.
async function enter(page){
 const screen=page.locator("#rc-access-screen");
 if(await screen.isVisible()){
  await page.locator("#rc-private-confirm").check();
  await page.locator("#rc-private-enter").click();
 }
 await page.waitForFunction(()=>document.documentElement.dataset.rcPrivateReady==="yes");
}
async function legacyEmail(page){const d=page.locator("#rc-sync-legacy");if(await d.count()&&await d.getAttribute("open")===null)await d.locator("summary").click();}
module.exports={enter,legacyEmail};
