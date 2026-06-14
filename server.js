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
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #ffffff;
                    display: flex;
                    justify-content: center;
                }
                .ticket-container {
                    width: 400px;
                    border: 2px solid #000;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
                .header {
                    background-color: #000000;
                    color: #ffffff;
                    text-align: center;
                    padding: 12px;
                    font-size: 14px;
                    font-weight: bold;
                    letter-spacing: 2px;
                }
                .content {
                    padding: 25px;
                    text-align: center;
                }
                .restaurant-name {
                    font-size: 22px;
                    font-weight: 900;
                    margin-bottom: 20px;
                    letter-spacing: 1px;
                }
                .guest-info {
                    font-size: 16px;
                    color: #555;
                    margin-bottom: 25px;
                }
                .guest-name {
                    font-size: 18px;
                    font-weight: bold;
                    color: #000;
                }
                .details-box {
                    background-color: #f8f9fa;
                    border-radius: 12px;
                    padding: 15px;
                    text-align: left;
                    margin-bottom: 25px;
                    font-size: 15px;
                    color: #333;
                    line-height: 1.6;
                }
                .qr-section {
                    margin: 20px 0;
                }
                .qr-section img {
                    width: 200px;
                    height: 200px;
                }
                .warning-box {
                    border: 2px dashed #ff4d4d;
                    border-radius: 8px;
                    padding: 12px;
                    color: #ff4d4d;
                    font-size: 12px;
                    font-weight: bold;
                    margin-top: 20px;
                    text-transform: uppercase;
                }
                .footer {
                    font-size: 11px;
                    color: #888;
                    margin-top: 25px;
                }
            </style>
        </head>
        <body>
            <div class="ticket-container">
                <div class="header">BIGLIETTO DIGITALE</div>
                
                <div class="content">
                    <div class="restaurant-name">IL RISTORANTE</div>
                    
                    <div class="guest-info">
                        Invitato: <span class="guest-name">${nome} ${cognome}</span><br>
                        <span style="font-size: 13px; color: #888;">Tel: ${telefono}</span>
                    </div>

                    <div class="details-box">
                        📍 <strong>Luogo:</strong> Via del Ristorante, Saviano (NA)<br>
                        📅 <strong>Data e Ora:</strong> ${dataFormattata}<br>
                        👥 <strong>Coperti:</strong> ${persone} Persone
                    </div>

                    <div class="qr-section">
                        <img src="${qrCodeBase64}" alt="QR Code Prenotazione">
                    </div>

                    <div class="warning-box">
                        ⚠️ Il biglietto va presentato all'ingresso<br>(Solo in forma digitale)
                    </div>

                    <div class="footer">
                        Gestito da Sistema Prenotazioni Rues45
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

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