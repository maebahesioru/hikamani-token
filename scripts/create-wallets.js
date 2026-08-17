const fs = require('fs');
const path = require('path');
const { Keypair } = require('@solana/web3.js');

const roles = ['treasury', 'reward', 'ops', 'airdrop'];
const dir = path.join(__dirname, '..', 'keys');
fs.mkdirSync(dir, { recursive: true });

const addresses = {};
for (const role of roles) {
  const kp = Keypair.generate();
  fs.writeFileSync(path.join(dir, `${role}.json`), JSON.stringify(Array.from(kp.secretKey)));
  addresses[role] = kp.publicKey.toBase58();
}
fs.writeFileSync(path.join(__dirname, '..', 'addresses.json'), JSON.stringify(addresses, null, 2));
console.log('=== WALLETS CREATED ===');
console.log(JSON.stringify(addresses, null, 2));
