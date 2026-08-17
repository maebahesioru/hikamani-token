// HMC ミント+配分+renounce (node・正確な金額制御)
const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const {
  TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync,
  mintToChecked, transferChecked, setAuthority, AuthorityType,
} = require('@solana/spl-token');

const RPC = process.argv[2] || 'http://127.0.0.1:8899';
const MINT = process.argv[3] || 'C1im4d84j1k5hPZriivogQqd4XZg8Ef2cjrXTtvu34Fe';
const DECIMALS = 9;
const KEYDIR = process.argv[4] || path.join(__dirname, '..', 'keys');
const ADDRFILE = process.argv[5] || path.join(__dirname, '..', 'addresses.json');
const conn = new Connection(RPC, 'confirmed');

const UNIT = 10n ** BigInt(DECIMALS);
const TOTAL = 1000000000n * UNIT;      // 10億
const REWARD = 500000000n * UNIT;      // 50%
const OPS = 200000000n * UNIT;         // 20%
const AIRDROP = 300000000n * UNIT;     // 30%

function load(role) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(KEYDIR, `${role}.json`), 'utf8'))));
}

async function main() {
  const treasury = load('treasury');
  const mint = new PublicKey(MINT);
  const addrs = JSON.parse(fs.readFileSync(ADDRFILE, 'utf8'));
  const ata = {};
  for (const role of ['treasury', 'reward', 'ops', 'airdrop']) {
    ata[role] = getAssociatedTokenAddressSync(mint, new PublicKey(addrs[role]), false, TOKEN_2022_PROGRAM_ID);
  }
  console.log('mint:', mint.toBase58());
  console.log('treasury ATA:', ata.treasury.toBase58());

  // 1. ミント(供給が0のときだけ)
  const supply0 = await conn.getTokenSupply(mint);
  if (supply0.value.uiAmountString === '0') {
    const sig1 = await mintToChecked(conn, treasury, mint, ata.treasury, treasury, TOTAL, DECIMALS, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log('ミント 10億:', sig1);
  } else {
    console.log('ミント済み(skip):', supply0.value.uiAmountString, 'HMC');
  }

  // 2. 配分送付 (引数順: connection, payer, source, mint, destination, owner, ...)
  // 冪等性: 宛先に既に残高があればスキップ
  async function balOf(ata) {
    try { const b = await conn.getTokenAccountBalance(ata); return BigInt(b.value.amount); } catch (e) { return 0n; }
  }
  if ((await balOf(ata.reward)) === 0n) {
    const sig2 = await transferChecked(conn, treasury, ata.treasury, mint, ata.reward, treasury, REWARD, DECIMALS, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log('reward 50%:', sig2);
  } else { console.log('reward: 済み(skip)'); }
  if ((await balOf(ata.ops)) === 0n) {
    const sig3 = await transferChecked(conn, treasury, ata.treasury, mint, ata.ops, treasury, OPS, DECIMALS, [], undefined, TOKEN_2022_PROGRAM_ID);
    console.log('ops 20%:', sig3);
  } else { console.log('ops: 済み(skip)'); }
  if ((await balOf(ata.airdrop)) === 0n) {
    // airdrop は treasury の残り全部 (端数は treasury 側で処理)
    const tbal = await conn.getTokenAccountBalance(ata.treasury);
    const remain = BigInt(tbal.value.amount);
    if (remain > 0n) {
      const sig4 = await transferChecked(conn, treasury, ata.treasury, mint, ata.airdrop, treasury, remain, DECIMALS, [], undefined, TOKEN_2022_PROGRAM_ID);
      console.log('airdrop(残り):', sig4, '(' + (Number(remain) / 1e9) + ' HMC)');
    } else {
      console.log('airdrop: 残高なし');
    }
  } else { console.log('airdrop: 済み(skip)'); }

  // 3. renounce (ミント権限を放棄)
  const sig5 = await setAuthority(conn, treasury, mint, treasury.publicKey, AuthorityType.MintTokens, null, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log('renounce mint authority:', sig5);

  // 4. 検証
  const supply = await conn.getTokenSupply(mint);
  console.log('=== 検証 ===');
  console.log('供給量:', supply.value.uiAmountString, 'HMC');
  const mintInfo = await conn.getParsedAccountInfo(mint);
  console.log('mint権限:', mintInfo.value.data.parsed.info.mintAuthority || 'NULL (renounce済み)');
  for (const role of ['treasury', 'reward', 'ops', 'airdrop']) {
    try {
      const b = await conn.getTokenAccountBalance(ata[role]);
      console.log(role, ':', b.value.uiAmountString, 'HMC');
    } catch (e) { console.log(role, ': 0'); }
  }
  console.log('MINT ADDRESS:', mint.toBase58());
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
