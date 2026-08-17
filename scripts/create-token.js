// Hikamani Coin (HMC) トークン作成スクリプト (Solana Token-2022)
// 使い方: node scripts/create-token.js <RPC_URL> <METADATA_URI>
// 例: node scripts/create-token.js http://127.0.0.1:8899 https://gist.githubusercontent.com/.../raw/metadata.json
const fs = require('fs');
const path = require('path');
const {
  Connection, Keypair, PublicKey, Transaction, SystemProgram,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
  TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction, getMintLen, ExtensionType,
  getOrCreateAssociatedTokenAccount, mintToChecked, setAuthority, AuthorityType,
} = require('@solana/spl-token');
const { createInitializeInstruction } = require('@solana/spl-token-metadata');

const RPC = process.argv[2] || 'http://127.0.0.1:8899';
const METADATA_URI = process.argv[3] || '';
const DECIMALS = 18;
const TOTAL_SUPPLY = 1000000000n; // 10億
const REWARD_RATIO = 500000000n;  // 50%
const OPS_RATIO = 200000000n;     // 20%
const AIRDROP_RATIO = 300000000n; // 30%

const NAME = 'Hikamani Coin';
const SYMBOL = 'HMC';

function loadKeypair(role) {
  const secret = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'keys', `${role}.json`), 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const conn = new Connection(RPC, 'confirmed');
  const treasury = loadKeypair('treasury');
  const reward = loadKeypair('reward');
  const ops = loadKeypair('ops');
  const airdrop = loadKeypair('airdrop');

  console.log('RPC:', RPC);
  console.log('treasury:', treasury.publicKey.toBase58());
  console.log('reward  :', reward.publicKey.toBase58());
  console.log('ops     :', ops.publicKey.toBase58());
  console.log('airdrop :', airdrop.publicKey.toBase58());

  // 残高確認
  const bal = await conn.getBalance(treasury.publicKey);
  console.log('treasury SOL:', bal / LAMPORTS_PER_SOL);
  if (bal < 0.01 * LAMPORTS_PER_SOL) {
    throw new Error('treasury SOL不足 (0.01 SOL以上必要)');
  }

  // 1. ミントアカウント作成(Token-2022・MetadataPointer拡張)
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const metadataAddress = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), mint.toBuffer()],
    TOKEN_2022_PROGRAM_ID
  )[0];
  console.log('mint:', mint.toBase58());
  console.log('metadata PDA:', metadataAddress.toBase58());

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const lamports = await conn.getMinimumBalanceForRentExemption(mintLen);

  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: treasury.publicKey,
    newAccountPubkey: mint,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  });
  const initMetadataPointerIx = createInitializeMetadataPointerInstruction(
    mint, treasury.publicKey, metadataAddress, TOKEN_2022_PROGRAM_ID
  );
  const initMintIx = createInitializeMintInstruction(
    mint, DECIMALS, treasury.publicKey, null, TOKEN_2022_PROGRAM_ID
  );
  const initMetadataIx = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    metadata: metadataAddress,
    updateAuthority: treasury.publicKey,
    mint,
    mintAuthority: treasury.publicKey,
    name: NAME,
    symbol: SYMBOL,
    uri: METADATA_URI,
  });

  const tx1 = new Transaction().add(createAccountIx, initMetadataPointerIx, initMintIx, initMetadataIx);
  const sig1 = await sendAndConfirmTransaction(conn, tx1, [treasury, mintKeypair]);
  console.log('mint作成+初期化:', sig1);

  // 2. 全供給をtreasuryのATAへミント
  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    conn, treasury, mint, treasury.publicKey, false, TOKEN_2022_PROGRAM_ID
  );
  const totalRaw = TOTAL_SUPPLY * (10n ** BigInt(DECIMALS));
  const sig2 = await mintToChecked(
    conn, treasury, mint, treasuryAta.address, treasury, totalRaw, DECIMALS, [],
    undefined, TOKEN_2022_PROGRAM_ID
  );
  console.log('全供給ミント:', sig2);

  // 3. 配分送付 (reward 50%, ops 20%, airdrop 30%)
  const rewardAta = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, reward.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const opsAta = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, ops.publicKey, false, TOKEN_2022_PROGRAM_ID);
  const airdropAta = await getOrCreateAssociatedTokenAccount(conn, treasury, mint, airdrop.publicKey, false, TOKEN_2022_PROGRAM_ID);

  const unit = 10n ** BigInt(DECIMALS);
  const rewardAmt = REWARD_RATIO * unit;
  const opsAmt = OPS_RATIO * unit;
  const airdropAmt = AIRDROP_RATIO * unit;

  const { createTransferCheckedInstruction } = require('@solana/spl-token');
  const tx3 = new Transaction().add(
    createTransferCheckedInstruction(treasuryAta.address, mint, rewardAta.address, treasury.publicKey, rewardAmt, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
    createTransferCheckedInstruction(treasuryAta.address, mint, opsAta.address, treasury.publicKey, opsAmt, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
    createTransferCheckedInstruction(treasuryAta.address, mint, airdropAta.address, treasury.publicKey, airdropAmt, DECIMALS, [], TOKEN_2022_PROGRAM_ID)
  );
  const sig3 = await sendAndConfirmTransaction(conn, tx3, [treasury]);
  console.log('配分送付:', sig3);

  // 4. renounce (ミント権限・メタデータ更新権限を放棄)
  const sig4 = await setAuthority(conn, treasury, mint, treasury.publicKey, AuthorityType.MintTokens, null, [], undefined, TOKEN_2022_PROGRAM_ID);
  console.log('ミント権限 renounce:', sig4);

  // 5. 検証
  const supply = await conn.getTokenSupply(mint);
  const mintInfo = await conn.getParsedAccountInfo(mint);
  console.log('=== 検証 ===');
  console.log('供給量:', supply.value.uiAmountString, 'HMC');
  console.log('mint権限:', mintInfo.value.data.parsed.info.mintAuthority || 'NULL (renounce済み)');
  console.log('freeze権限:', mintInfo.value.data.parsed.info.freezeAuthority || 'NULL');
  const rAta = await conn.getTokenAccountBalance(rewardAta.address);
  const oAta = await conn.getTokenAccountBalance(opsAta.address);
  const aAta = await conn.getTokenAccountBalance(airdropAta.address);
  const tAta = await conn.getTokenAccountBalance(treasuryAta.address);
  console.log('reward  :', rAta.value.uiAmountString, 'HMC');
  console.log('ops     :', oAta.value.uiAmountString, 'HMC');
  console.log('airdrop :', aAta.value.uiAmountString, 'HMC');
  console.log('treasury:', tAta.value.uiAmountString, 'HMC');
  console.log('=== DONE ===');
  console.log('MINT ADDRESS:', mint.toBase58());
}
main().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
