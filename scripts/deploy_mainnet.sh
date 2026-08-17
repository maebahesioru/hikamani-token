#!/bin/bash
# HMC mainnet発行スクリプト(実行前にSOL調達ガイドを読むこと)
set -e
cd "$(dirname "$0")/.."
export PATH="/c/Users/maeba/solana-cli/solana-v2.1.0/bin:$PATH"
RPC="https://api.mainnet-beta.solana.com"
TKEY="C:/Users/maeba/Downloads/crypto_create_research/hikamani-coin/mainnet-keys/treasury.json"
URI="https://raw.githubusercontent.com/maebahesioru/hikamani-token/main/assets/metadata.json"

if [ ! -f "$TKEY" ]; then
  echo "mainnet-keys/treasury.json がありません。先に node scripts/create-mainnet-wallets.js を実行してください。"
  exit 1
fi

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a deploy_mainnet.log; }

TADDR=$(python -c "import json;print(json.load(open('mainnet_addresses.json'))['treasury'])")
BAL=$(curl -s $RPC -H "Content-Type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$TADDR\"]}" | python -c "import sys,json;print(json.load(sys.stdin)['result']['value'])")
log "treasury mainnet SOL: $((BAL / 1000000000)) SOL"
if [ "$BAL" -lt "10000000" ]; then
  log "SOL不足(0.01 SOL未満)。SOL_ACQUISITION_GUIDE.mdを参照して入金してください"
  exit 1
fi

# ミント作成
out=$(spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --enable-metadata --decimals 9 --url $RPC --fee-payer "$TKEY" 2>&1)
MINT=$(echo "$out" | grep -oP 'Address:\s+\K\w+' | head -1)
if [ -z "$MINT" ]; then log "ミント作成失敗: $out"; exit 1; fi
log "MINT=$MINT"
echo "$MINT" > mainnet_mint.txt

# メタデータ
spl-token initialize-metadata "$MINT" "Hikamani Coin" "HMC" "$URI" --url $RPC --fee-payer "$TKEY" 2>&1 | tail -1 >> deploy_mainnet.log

# ATA作成
for role in treasury reward ops airdrop; do
  addr=$(python -c "import json;print(json.load(open('mainnet_addresses.json'))['$role'])")
  spl-token create-account "$MINT" --owner "$addr" --fee-payer "$TKEY" --url $RPC 2>&1 | tail -1 >> deploy_mainnet.log
done
log "ATA作成完了"

# ミント+配分+renounce
# 注意: パイプにするとset -eが効かずエラーを飲み込む。nodeの終了コードを直接判定する
node scripts/mint-distribute.js $RPC "$MINT" mainnet-keys mainnet_addresses.json || { log "mint-distribute失敗"; exit 1; }

log "DONE MINT=$MINT"