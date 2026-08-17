const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
const roles = ['treasury', 'reward', 'ops', 'airdrop'];
const AMOUNT = 2; // SOL per wallet

async function main() {
  for (const role of roles) {
    const secret = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'keys', `${role}.json`), 'utf8'));
    const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
    const sig = await conn.requestAirdrop(kp.publicKey, AMOUNT * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig);
    const bal = await conn.getBalance(kp.publicKey);
    console.log(`${role}: ${kp.publicKey.toBase58()} -> ${bal / LAMPORTS_PER_SOL} SOL`);
  }
}
main().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
