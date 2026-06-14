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
                    padding: 30px;
                    background-color: #0d0d0d;
                    display: flex;
                    justify-content: center;
                }
                .ticket-container {
                    width: 420px;
                    background: #1a1a1a;
                    border: 1px solid #d4af37;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    color: #ffffff;
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
                    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcIAAADwCAMAAAC3qfdVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAblQTFRF///3S0v/VFT///f///b//fX3//X3//v9//v7//v19f//3v/1//X7///e///W9/X//+79//n7///O///G///E///A///7///5//f5//f3//f1//f////////////79/X37v315v313v31zv31xv31tv31lv31jv31fv31bv31Xv31Vv31Tv31Rv31Pv31Nv31Lv31Jv31Hv31Bv319v337v3u5v3m3v3Xzv3Lxv3Gtv3Clv3Gjv2+fv22bv2qXv2iVv2aTv2SRv2KPv2CNv2ALv14Hv1wBv1oBv1gBv1Y9/X19vX37vXe5vXe3vXevvXervXeovXenpXelvXejvXefvXebvXeVvXeTvXeRvXePvXeNvXeLvXeJvXeHvXeBvXe9vb37vbm5vbi3vbevvbevubevvXOvvXGvvXCvvW+vvW2vvWqvunOnvmejvmaduWadvWZduaZduaRduaJduV9duV1duVtduttdetldetddetVdetNdetFdet9det1detldetVdetNdetFdet9det1detVdeu9deu1deuldeuadeuVdeuNdeuFdeu9deu1deuldeuadeuVdeuNdeuFdeu9deu1deulduv///92Y17DAAAAIXRSTlMA//////////////////////////////////////////8AEv43PAAAByBJREFUeNrsnXdfE0cUwOdmwYKKvYsVFSv23nvvXbF37F2x994r9o4dE8v3wzN3lywJyS6b7G6S9/vD79u9ZOfN7b2b3TfLAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAsAnV6gL8T0AnC0InC0InC169YkXgWvWKAq+vCl67vYIXu1vwarvP6gL8T2D36gL8T7BvTQEeArM26gI8AGXwVwUAnG646w8A0N2gKwCgdENXAACD/TAVwECpYVfCQKl8g6+

        // 4. Avvia Puppeteer in modalità "headless" (in background) per generare il PDF
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Imposta l'HTML della pagina
        await page.setContent(htmlTemplate);
        
        // Genera il PDF impostando le dimensioni per farlo sembrare un biglietto da smartphone
        const pdfBuffer = await page.pdf({
            width: '450px',
            height: '750px',
            printBackground: true
        });

        await browser.close();

        // 5. Rispondi inviando il PDF al client
        res.contentType("application/pdf");
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).send("Errore del server durante la generazione del biglietto.");
    }
});

// Avvia il server in ascolto
app.listen(PORT, () => {
    console.log(`Server attivo sulla porta ${PORT}`);
});