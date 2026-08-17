// devnet専用ウォレット生成(ローカル検証とは別キー)
const fs = require('fs');
const path = require('path');
const { Keypair } = require('@solana/web3.js');

const roles = ['treasury', 'reward', 'ops', 'airdrop'];
const dir = path.join(__dirname, '..', 'devnet-keys');
fs.mkdirSync(dir, { recursive: true });
const addresses = {};
for (const role of roles) {
  const kp = Keypair.generate();
  fs.writeFileSync(path.join(dir, `${role}.json`), JSON.stringify(Array.from(kp.secretKey)));
  addresses[role] = kp.publicKey.toBase58();
}
fs.writeFileSync(path.join(__dirname, '..', 'devnet_addresses.json'), JSON.stringify(addresses, null, 2));
console.log(JSON.stringify(addresses, null, 2));
