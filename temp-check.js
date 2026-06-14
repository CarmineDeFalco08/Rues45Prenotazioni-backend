const QRCode=require('qrcode');
const puppeteer=require('puppeteer');
const { PDFDocument }=require('pdf-lib');
(async()=>{
  const qr=await QRCode.toDataURL('x');
  const html = `<!DOCTYPE html>
  <html lang="it">
  <head>
    <meta charset="UTF-8">
    <style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&display=swap'); body{font-family:'Montserrat',sans-serif;margin:0;padding:20px;background:#0d0d0d;display:flex;justify-content:center;align-items:center;-webkit-print-color-adjust:exact}.ticket-container{width:400px;background:#1a1a1a;border:1px solid #d4af37;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.5);color:#fff;page-break-inside:avoid}.header{background:#000;text-align:center;padding:15px;font-size:11px;font-weight:600;letter-spacing:3px;color:#d4af37;border-bottom:1px solid #2a2a2a;text-transform:uppercase}.logo-container{background:#000;padding:25px 10px;text-align:center}.logo-container img{width:180px;height:auto}.content{padding:30px 25px;text-align:center}.guest-info{font-size:14px;color:#aaa;margin-bottom:25px;text-transform:uppercase;letter-spacing:1px}.guest-name{font-size:22px;font-weight:800;color:#fff;margin-top:5px;display:block;letter-spacing:.5px}.details-box{background:#222;border-left:4px solid #d4af37;border-radius:8px;padding:18px;text-align:left;margin-bottom:30px;font-size:14px;color:#ddd;line-height:2}.details-box i{color:#d4af37;margin-right:8px;width:18px;text-align:center}.details-box strong{color:#fff;font-weight:600}.qr-section{background:#fff;padding:15px;border-radius:12px;display:inline-block;margin:10px 0 25px 0;box-shadow:0 4px 15px rgba(0,0,0,.2)}.qr-section img{width:180px;height:180px;display:block}.warning-box{border:1px dashed #ff4d4d;background:rgba(255,77,77,.05);border-radius:8px;padding:12px;color:#ff4d4d;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase}.footer{font-size:11px;color:#555;margin-top:30px;letter-spacing:1px}</style></head><body><div class="ticket-container"><div class="header">PRENOTAZIONE CONFERMATA</div><div class="logo-container"><img src="https://vostro-dominio-o-github.io/imgs/logo.jpeg" alt="Rues 45"></div><div class="content"><div class="guest-info">Tavolo Riservato per<span class="guest-name">Nome Cognome</span></div><div class="details-box"><strong>Location:</strong> Via San Clemente, snc - Casamarciano (NA)<br><strong>Data e Ora:</strong> 14/06/2026 20:30<br><strong>Ospiti:</strong> 4 Persone<br><strong>Contatto:</strong> 3331234567</div><div class="qr-section"><img src="${qr}" alt="QR"></div><div class="warning-box">?? Mostra questo QR all'arrivo nel locale</div><div class="footer">Rues 45 Wine Garden • Servizio Prenotazioni</div></div></div></body></html>`;
  const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox','--disable-setuid-sandbox']});
  const page=await browser.newPage();
  await page.setContent(html);
  const metrics=await page.evaluate(()=>({
    bodyScrollHeight: document.body.scrollHeight,
    bodyOffsetHeight: document.body.offsetHeight,
    bodyClientHeight: document.body.clientHeight,
    htmlHeight: document.documentElement.scrollHeight,
    htmlOffsetHeight: document.documentElement.offsetHeight,
    htmlClientHeight: document.documentElement.clientHeight,
  }));
  console.log('metrics', metrics);
  const pdf=await page.pdf({width:'440px',height:'780px',printBackground:true,margin:{top:'0px',right:'0px',bottom:'0px',left:'0px'}});
  const doc=await PDFDocument.load(pdf);
  console.log('pdfBytes', pdf.length, 'pages', doc.getPageCount());
  await browser.close();
})();
