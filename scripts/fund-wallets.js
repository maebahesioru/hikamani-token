// フォーセット(genesisミント)から各ウォレットへSOL送金
const fs = require('fs');
const path = require('path');
const { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const RPC = process.argv[2] || 'http://127.0.0.1:8899';
const AMOUNT = 100; // SOL per wallet
const conn = new Connection(RPC, 'confirmed');

const faucet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('C:/Users/maeba/solana-cli/keys/faucet.json', 'utf8'))));
console.log('faucet:', faucet.publicKey.toBase58());

async function main() {
  for (const role of ['treasury', 'reward', 'ops', 'airdrop']) {
    const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'keys', `${role}.json`), 'utf8'))));
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: faucet.publicKey, toPubkey: kp.publicKey, lamports: AMOUNT * LAMPORTS_PER_SOL })
    );
    const sig = await sendAndConfirmTransaction(conn, tx, [faucet]);
    const bal = await conn.getBalance(kp.publicKey);
    console.log(`${role}: ${kp.publicKey.toBase58()} -> ${bal / LAMPORTS_PER_SOL} SOL (${sig})`);
  }
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
