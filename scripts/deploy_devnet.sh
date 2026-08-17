#!/bin/bash
# HMC devnet発行ワンショットスクリプト
set -e
cd "$(dirname "$0")/.."
export PATH="/c/Users/maeba/solana-cli/solana-v2.1.0/bin:$PATH"
RPC="https://api.devnet.solana.com"
TKEY="C:/Users/maeba/Downloads/crypto_create_research/hikamani-coin/devnet-keys/treasury.json"
URI="https://raw.githubusercontent.com/maebahesioru/hikamani-token/main/assets/metadata.json"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a deploy_devnet.log; }

# 1. devnet SOL確認+airdrop
TADDR=$(python -c "import json;print(json.load(open('devnet_addresses.json'))['treasury'])")
BAL=$(curl -s $RPC -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$TADDR\"]}" | python -c "import sys,json;print(json.load(sys.stdin)['result']['value'])")
if [ "$BAL" -lt "1000000" ]; then
  log "airdrop試行(2 SOL)..."
  RES=$(curl -s $RPC -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"requestAirdrop\",\"params\":[\"$TADDR\", 2000000000]}")
  log "airdrop応答: $RES"
  sleep 3
  BAL=$(curl -s $RPC -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$TADDR\"]}" | python -c "import sys,json;print(json.load(sys.stdin)['result']['value'])")
  if [ "$BAL" -lt "1000000" ]; then log "airdrop失敗(残高 $BAL)"; exit 1; fi
fi
log "treasury devnet SOL: $((BAL / 1000000000)) SOL"

# 2. ミント作成(Token-2022・9 decimals)
out=$(spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --enable-metadata --decimals 9 --url $RPC --fee-payer "$TKEY" 2>&1)
MINT=$(echo "$out" | grep -oP 'Address:\s+\K\w+' | head -1)
if [ -z "$MINT" ]; then log "ミント作成失敗: $out"; exit 1; fi
log "MINT=$MINT"
echo "$MINT" > devnet_mint.txt

# 3. メタデータ初期化
log "メタデータ初期化..."
spl-token initialize-metadata "$MINT" "Hikamani Coin" "HMC" "$URI" --url $RPC --fee-payer "$TKEY" 2>&1 | tail -1 >> deploy_devnet.log

# 4. ATA作成
for role in treasury reward ops airdrop; do
  addr=$(python -c "import json;print(json.load(open('devnet_addresses.json'))['$role'])")
  spl-token create-account "$MINT" --owner "$addr" --fee-payer "$TKEY" --url $RPC 2>&1 | tail -1 >> deploy_devnet.log
done
log "ATA作成完了"

# 5. ミント+配分+renounce (node・正確な金額)
node scripts/mint-distribute.js $RPC "$MINT" devnet-keys devnet_addresses.json 2>&1 | tee -a deploy_devnet.log

log "DONE MINT=$MINT"
