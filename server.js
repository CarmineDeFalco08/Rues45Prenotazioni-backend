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

    // Formatta la data in modo leggibile
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
        // 2. Genera il QR Code in formato Base64
        const qrCodeBase64 = await QRCode.toDataURL(datiQR);

        // 3. Il Template HTML del biglietto aggiornato coordinato con il tuo index.html
        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
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
                    text-transform: uppercase;
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
                    line-height: 2;
                }
                /* Stile per le icone coordinate nel PDF */
                .details-box i {
                    color: #d4af37;
                    margin-right: 8px;
                    width: 18px;
                    text-align: center;
                }
                .details-box strong {
                    color: #ffffff;
                    font-weight: 600;
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
                    <img src="https://vostro-dominio-o-github.io/imgs/logo.jpeg" alt="Rues 45 Wine Garden" onerror="this.style.display='none';">
                    <h2 style="color: #d4af37; font-size: 20px; margin: 5px 0 0 0; font-family: 'Montserrat'; letter-spacing: 2px;">RUES 45</h2>
                </div>

                <div class="content">
                    <div class="guest-info">
                        Tavolo Riservato per
                        <span class="guest-name">${nome} ${cognome}</span>
                    </div>

                    <div class="details-box">
                        <i class="fa-solid fa-location-dot"></i> <strong>Location:</strong> Via San Clemente, snc - Casamarciano (NA)<br>
                        <i class="fa-solid fa-clock"></i> <strong>Data e Ora:</strong> ${dataFormattata}<br>
                        <i class="fa-solid fa-users"></i> <strong>Ospiti:</strong> ${persone} Persone<br>
                        <i class="fa-solid fa-phone"></i> <strong>Contatto:</strong> ${telefono}
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
        
        // Forza l'attesa del caricamento dei web font (Montserrat) e delle icone prima di stampare il PDF
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