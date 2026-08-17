// HMC エアドロップ配布スクリプト(6ヶ月リニア・月次実行)
// 使い方: node scripts/airdrop.js <RPC_URL> <CSVファイル>
// CSV形式: アドレス,HMC枚数(UI単位・10億まで)
// 例:     Gstw5MTUsUXkpefB1JA5txdHFQeRBLLXUnVWgZATC5ta,50000000
// ※二重送信防止: sent_airdrop.json に送信済みハッシュを記録
const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const {
  TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount, transferChecked,
} = require('@solana/spl-token');

const RPC = process.argv[2] || 'https://api.mainnet-beta.solana.com';
const CSV = process.argv[3];
const MINT = new PublicKey('DZS1tKGJsgwqYGNMpQw5KpjBqi8shox8SE28vJhNfxM9');
const DECIMALS = 9;
const SENT_LOG = path.join(__dirname, '..', 'sent_airdrop.json');

if (!CSV) { console.error('CSVファイルを指定してください'); process.exit(1); }

const conn = new Connection(RPC, 'confirmed');
const airdropKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'mainnet-keys', 'airdrop.json'), 'utf8'))));

function loadSent() {
  try { return JSON.parse(fs.readFileSync(SENT_LOG, 'utf8')); } catch { return {}; }
}
function saveSent(sent) { fs.writeFileSync(SENT_LOG, JSON.stringify(sent, null, 2)); }

async function main() {
  const sent = loadSent();
  const lines = fs.readFileSync(CSV, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#'));
  console.log('宛先数:', lines.length);

  const src = getAssociatedTokenAddressSync(MINT, airdropKey.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const srcBal = await conn.getTokenAccountBalance(src).catch(() => null);
  console.log('airdrop残高:', srcBal ? srcBal.value.uiAmountString : 'ATAなし', 'HMC');
  console.log('送金元SOL:', (await conn.getBalance(airdropKey.publicKey)) / 1e9, 'SOL');

  let ok = 0, skip = 0, fail = 0;
  for (const line of lines) {
    const [addrRaw, amountRaw] = line.split(',');
    const addr = addrRaw.trim();
    const amount = BigInt(Math.round(parseFloat(amountRaw.trim()) * 10 ** DECIMALS));
    if (sent[addr]) { console.log(`skip(送信済み): ${addr.slice(0,8)}...`); skip++; continue; }
    if (amount <= 0n) { console.log(`skip(金額0): ${addr.slice(0,8)}...`); skip++; continue; }
    try {
      const owner = new PublicKey(addr);
      const dst = await getOrCreateAssociatedTokenAccount(conn, airdropKey, MINT, owner, false, TOKEN_2022_PROGRAM_ID);
      const sig = await transferChecked(conn, airdropKey, MINT, src, dst.address, airdropKey, amount, DECIMALS, [], undefined, TOKEN_2022_PROGRAM_ID);
      sent[addr] = { amount: amountRaw.trim(), sig, at: new Date().toISOString() };
      saveSent(sent);
      console.log(`OK: ${addr.slice(0,8)}... ${amountRaw.trim()} HMC (${sig.slice(0,16)}...)`);
      ok++;
    } catch (e) {
      console.log(`FAIL: ${addr.slice(0,8)}... ${e.message.slice(0,80)}`);
      fail++;
    }
  }
  console.log(`=== 完了: OK ${ok} / skip ${skip} / FAIL ${fail} ===`);
  const bal2 = await conn.getTokenAccountBalance(src).catch(() => null);
  console.log('airdrop残高:', bal2 ? bal2.value.uiAmountString : '0', 'HMC');
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
