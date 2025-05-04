const express = require('express');
const bodyParser = require('body-parser');
const { TronWeb } = require('tronweb');


// ایجاد اتصال به TronWeb
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',  // آدرس نود ترون
});

// ایجاد یک اپلیکیشن Express
const app = express();
const port = 3000;

// استفاده از body-parser برای پردازش داده‌های JSON
app.use(bodyParser.json());

// ساخت کیف پول جدید
app.post('/create-wallet', async (req, res) => {
    try {
        const wallet = await tronWeb.createAccount();
        res.json({
            message: 'کیف پول ساخته شد',
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            address: wallet.address.base58
        });
    } catch (error) {
        res.status(500).json({ message: 'خطا در ساخت کیف پول', error: error.message });
    }
});

// ارسال ترون
app.post('/send-tron', async (req, res) => {
    const { privateKey, toAddress, amount, senderAddress } = req.body;

    if (!privateKey || !toAddress || !amount || !senderAddress) {
        return res.status(400).json({ message: 'تمامی فیلدها باید پر شوند' });
    }

    try {
        // ساخت تراکنش
        const transaction = await tronWeb.transactionBuilder.sendTrx(
            toAddress,
            tronWeb.toSun(amount), // تبدیل مقدار ترون به واحد Sun
            senderAddress
        );

        // امضای تراکنش
        const signedTransaction = await tronWeb.trx.sign(transaction, privateKey);

        // ارسال تراکنش
        const broadcast = await tronWeb.trx.sendRawTransaction(signedTransaction);

        res.json({
            message: 'تراکنش ارسال شد',
            tx : transaction.txID,
        });
    } catch (error) {
        res.status(500).json({ message: 'خطا در ارسال تراکنش', error: error.message });
    }
});

// بررسی موجودی کیف پول
app.get('/check-balance/:address', async (req, res) => {
    const address = req.params.address;

    try {
        const balance = await tronWeb.trx.getBalance(address);
        res.json({
            message: 'موجودی کیف پول دریافت شد',
            balance: tronWeb.fromSun(balance) // تبدیل Sun به TRX
        });
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت موجودی', error: error.message });
    }
});
// راه‌اندازی سرور
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
