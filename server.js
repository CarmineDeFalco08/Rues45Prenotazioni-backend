const express = require('express');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Abilita i moduli CORS (per far comunicare il Frontend su GitHub Pages con questo Server)
app.use(cors());
// Permette al server di leggere i dati in formato JSON inviati dal form
app.use(express.json());

// Rotta principale per gestire la prenotazione
app.post('/api/prenota', async (req, res) => {
    const { nome, cognome, telefono, dataOra, persone } = req.body;

    // Formatta la data in modo leggibile (da "2026-06-26T20:00" a qualcosa di più pulito)
    const dataFormattata = new Date(dataOra).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // 1. Stringa di dati che verrà inserita DENTRO il QR Code
    const datiQR = `Prenotazione Ristorante\nCliente: ${nome} ${cognome}\nTel: ${telefono}\nData: ${dataFormattata}\nPersone: ${persone}`;

    try {
        // 2. Genera il QR Code in formato Base64 (stringa di testo immagine)
        const qrCodeBase64 = await QRCode.toDataURL(datiQR);

        // 3. Il Template HTML del biglietto (ispirato al tuo screenshot)
        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&display=swap');
                
                body {
                    font-family: 'Montserrat', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #0d0d0d;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    -webkit-print-color-adjust: exact;
                }
                .ticket-container {
                    width: 400px;
                    background: #1a1a1a;
                    border: 1px solid #d4af37;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    color: #ffffff;
                    page-break-inside: avoid;
                }
                .header {
                    background-color: #000000;
                    text-align: center;
                    padding: 15px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 3px;
                    color: #d4af37;
                    border-bottom: 1px solid #2a2a2a;
                }
                .logo-container {
                    background: #000000;
                    padding: 25px 10px;
                    text-align: center;
                }
                .logo-container img {
                    width: 180px;
                    height: auto;
                }
                .content {
                    padding: 30px 25px;
                    text-align: center;
                }
                .guest-info {
                    font-size: 14px;
                    color: #aaaaaa;
                    margin-bottom: 25px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .guest-name {
                    font-size: 22px;
                    font-weight: 800;
                    color: #ffffff;
                    margin-top: 5px;
                    display: block;
                    letter-spacing: 0.5px;
                }
                .details-box {
                    background-color: #222222;
                    border-left: 4px solid #d4af37;
                    border-radius: 8px;
                    padding: 18px;
                    text-align: left;
                    margin-bottom: 30px;
                    font-size: 14px;
                    color: #dddddd;
                    line-height: 1.8;
                }
                .details-box strong {
                    color: #d4af37;
                }
                .qr-section {
                    background: #ffffff;
                    padding: 15px;
                    border-radius: 12px;
                    display: inline-block;
                    margin: 10px 0 25px 0;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .qr-section img {
                    width: 180px;
                    height: 180px;
                    display: block;
                }
                .warning-box {
                    border: 1px dashed #ff4d4d;
                    background: rgba(255, 77, 77, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    color: #ff4d4d;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .footer {
                    font-size: 11px;
                    color: #555555;
                    margin-top: 30px;
                    letter-spacing: 1px;
                }
            </style>
        </head>
        <body>
            <div class="ticket-container">
                <div class="header">PRENOTAZIONE CONFERMATA</div>
                
                <div class="logo-container">
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcIAAADwCAMAAAC3qfdVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAblQTFRF///3S0v/VFT///f///b//fX3//X3//v9//v7//v19f//3v/1//X7///e///W9/X//+79//n7///O///G///E///A///7///5//f5//f3//f1//f////////////79/X37v315v313v31zv31xv31tv31lv31jv31fv31bv31Xv31Vv31Tv31Rv31Pv31Nv31Lv31Jv31Hv31Bv319v337v3u5v3m3v3Xzv3Lxv3Gtv3Clv3Gjv2+fv22bv2qXv2iVv2aTv2SRv2KPv2CNv2ALv14Hv1wBv1oBv1gBv1Y9/X19vX37vXe5vXe3vXevvXervXeovXenpXelvXejvXefvXebvXeVvXeTvXeRvXePvXeNvXeLvXeJvXeHvXeBvXe9vb37vbm5vbi3vbevvbevubevvXOvvXGvvXCvvW+vvW2vvWqvunOnvmejvmaduWadvWZduaZduaRduaJduV9duV1duVtduttdetldetddetVdetNdetFdet9det1detldetVdetNdetFdet9det1detVdeu9deu1deuldeuadeuVdeuNdeuFdeu9deu1deuldeuadeuVdeuNdeuFdeu9deu1deulduv///92Y17DAAAAIXRSTlMA//////////////////////////////////////////8AEv43PAAAByBJREFUeNrsnXdfE0cUwOdmwYKKvYsVFSv23nvvXbF37F2x994r9o4dE8v3wzN3lywJyS6b7G6S9/vD79u9ZOfN7b2b3TfLAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAsAnV6gL8T0AnC0InC0InC169YkXgWvWKAq+vCl67vYIXu1vwarvP6gL8T2D36gL8T7BvTQEeArM26gI8AGXwVwUAnG646w8A0N2gKwCgdENXAACD/TAVwECpYVfCQKl8g6+MgVIp466SgVKR8VfKQKl6k8ZdBwOl1pt2fwwA2Xmzpgh3B8oGg3DngfLw6XgX7gyUTw1mG6vNuyUGSl8byzb6WhgofW6x6Lz7p80wS1f/NllqCg866W6y9LzZZKnpPGTZZ7npPHTFcrOpO/jMstNo6g48scxo7A40F5vNxe7AMs9mY3dwuWDzWpI/uByyOSXJHywKNo8V+YNFAZunSvyRshhskXv6IWWwWSbV9EPKYLPFp/NIsFmtyR+xWvxhF0Zg6C1msfP6SDB0FrP6Yf0pMPwWq79R7mNguC1W02p8w12S/8wXv7I82PqE3u9vD/jX2S+6mB18KofgR7+w/Zf5N9V9v3Iyf8b868e/D/h3wN/Yfsf88X0U99WbLveZ/HwW7qW608G8S77r4fRPwX4E91Tf6y/+9K6rI/N/O/n0Y7KZ8o3vMvzv86b8CezNf6I7Of67u9m/9l2A31Bvd7PnPrK7vG+fP8W+pPv/Vof/m8C+6+b+6P68A/wnmDbyH+TfV/G/2e+XOf34B7wL9Svf+Z7X/Wd9v9b/b8rO9Y+2P8z2wfcgW4Bvxbqs9/7fGftb4H9Gf8e2Zf4v76UPhT269ZfX+D/7X9GvU9Xf7X9vtswB8Bv6b6XfP+Y/yv7Tdr6I/b/wz7V/Z72L+y38P+9eM6wP/V6vvX77fA3z+uA/z9OvvX79fB36+D/8W6wP/VukD/9esY/9er4/xff6I/A39/oj8Bf79R/q8b1wG9e6b66+vvD/fXj+v38ffr9vT9Rvm/3pD+WMOO+gX9IfojDX1b+fX9CfpF/f6I/4X99wH9fUD/fUD//gD+A9XnO6gC/B9Zf/8Z7wF9v9YvGPhfXUf/Eftf68/g/7p+EwZ+wUOfqT9w7w38DfpD9fsc6X9T/f3n9Xub+nO2/6vWf11fS3/i/9eE/l+v/2fM//q9wL8K//83of8Z879+b/DfUf9D7O8N/gPr/zv8B9b/R4Z/B/+h9UvBfy74z1W/OfOfG/6D7b89999r7f/N6p+1/U/a/gftvz3332vt/f+Y6z9p+x9P/8MOf/p3f8P7UvAfG/5jw99Y/R/6v2vOf9D2P5j+h02Yf2P9f4f/YPunvWf7p86f9v9D/3dr7T9p/9T50/7fTf8f2L9W/+fA3z/+V8NfNf76pZfO//VLSN98r4X//vXFfS389+6+FfP923G7+F95M9Z3Mdbn9/f7+/3969eX/N9+3wG9b7p6z++Wf/S/9T9p/+r9Y9N/0v4T9r9Z/+vVb3R8Fp/P96695bX4g1v8U/tX9f/U73S8Fv83D/83D/+qP608X9fXwXz38Vw//1cN/w/037mPhv3vW/O/G6fC/G/g34f+/Tfi3Yw9Y/0p/9v7X8v8D//9v8N9o/+v9X23X/3rwf70J/+vN49+XAn858G8S//83/6vBf7Ph3wX8vVv+v8b/vS3/vXb9r+zff1H9r4X/7gE9+vM6oX/vFv/XwN/96f7eO9bfe0ftK677BfrV8Bf1Z8N/vP5v5X+2gL8V+P6Z+Wp8Wp0aI6jX69V6q07WqYv69B9D8/n0X3HOnYvvFvX3UoP9vWThv838b/b3WjUeK7bHio1G/f3fGv/9/l7762O/v39D/uXGv1wZ9wG9MvGf8+vA/0vI37sF/u8b8M8H+pLwzwX/YvDPRfyZ888G/1yAn89fCHwBf77mP1v4zwb8mZp/pvhP1Xh8gT+9MfiCgT89DfgCf3oL8An+9DLgn47805F/8Wb+xby9vX0X9/bu0f+p9Z66Z6zveH7vTvv96vIfejKfxXgWfRfjWZzxLIpnUTyL4lkUz6J4FsWz麒5F8SyKZ1E8iwMvBvgf8DehWl2Ar2b/CzAA115i3p+X00YAAAAASUVORK5CYII=" alt="Rues 45 Wine Garden">
                </div>

                <div class="content">
                    <div class="guest-info">
                        Tavolo Riservato per
                        <span class="guest-name">${nome} ${cognome}</span>
                    </div>

                    <div class="details-box">
                        📍 <strong>Location:</strong> Via San Clemente, snc - 80032, Casamarciano (NA)<br>
                        📅 <strong>Data e Ora:</strong> ${dataFormattata}<br>
                        👥 <strong>Ospiti:</strong> ${persone} Persone<br>
                        📞 <strong>Contatto:</strong> ${telefono}
                    </div>

                    <div class="qr-section">
                        <img src="${qrCodeBase64}" alt="QR Code Rues 45">
                    </div>

                    <div class="warning-box">
                        ⚠️ Mostra questo QR all'arrivo nel locale
                    </div>

                    <div class="footer">
                        Rues 45 Wine Garden • Servizio Prenotazioni
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // 4. Avvia Puppeteer con flag di compatibilità per hosting Linux (es. Render)
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Imposta l'HTML della pagina
        await page.setContent(htmlTemplate);
        
        // Forza l'attesa del caricamento dei web font (Montserrat) prima di stampare il PDF
        await page.evaluateHandle('document.fonts.ready');

        // Genera il PDF impostando dimensioni personalizzate prive di margini di stampa
        const pdfBuffer = await page.pdf({
            width: '440px',
            height: '780px',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });

        await browser.close();

        // 5. Rispondi inviando il PDF al client
        res.contentType("application/pdf");
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Errore generazione PDF:", error);
        res.status(500).send("Errore del server durante la generazione del biglietto.");
    }
});

// Avvia il server in ascolto
app.listen(PORT, () => {
    console.log(`Server attivo sulla porta ${PORT}`);
});