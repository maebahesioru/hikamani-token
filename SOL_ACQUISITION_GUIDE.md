# HMC mainnet発行までの道のり(SOL調達ガイド)

**最終更新:** 2026-08-17

## 必要な量

| 項目 | 費用目安 |
|---|---|
| ミント作成+メタデータ+ATA×4+ミント+送金×3+renounce | 計6〜7トランザクション × 手数料0.000005 SOL ≈ **0.0001 SOL** |
| ATAレント(4アカウント) | ≈ 0.008 SOL |
| 余裕分 | 0.05〜0.1 SOL |
| **合計** | **0.1 SOL程度(数千円)** |

※1 SOL相場: **約$75.5 / 約¥12,012(2026-08-17 CoinGecko)**。**0.1 SOL ≈ 約1,200円**で足りる。

## 供給量・配分(確定済み)

10億HMC固定・reward 50% / ops 20% / airdrop 30%・renounce済み(ローカル検証完了)

## 調達ルート(未成年・取引所KYCなし)

### ルート1: RoboSats P2P(推奨)
- 国内取引所のKYC不要・LN(Bitcoin Lightning)で匿名度高い
- 手順:
  1. Phoenixウォレット(Android/iOS)インストール
  2. RoboSats(robosats.com)でBTC購入(JPY支払いのmakerを探す。maker注文推奨)
  3. BTCをPhantomウォレット内スワップ(またはKYCなしのDEX)でSOL化
  4. devnetキーと同じ要領でmainnetキーに入金
- 手数料: 0.2%(RoboSats)

### ルート2: MEXC(KYCなし取引所)
- 2026年時点でKYCなしで暗号資産の売買・出金可(出金制限あり)
- 日本円の直接入金はできないことが多いため、P2PでUSDT等を買ってMEXCに送る形

### ルート3: エアドロップ・テストネット報酬
- 放置系DePIN(携帯自動販売機プロジェクト等)やテストネットのタップ報酬でSOLを少しずつ貯める

### ルート4: 現物を家族経由で
- 親権者の同意があれば、家族の口座経由でPhantom等のウォレットに入金するのが最も確実・低リスク

## 発行手順(mainnet)

```bash
# SOLがdevnet_equivalent walletに入ったら
cd C:/Users/maeba/Downloads/crypto_create_research/hikamani-coin
# mainnet用キーを生成(devnetと別キーが安全)
node scripts/create-devnet-wallets.js  # → mainnet版はキー名変える
# 発行(RPCをmainnet-betaに)
bash scripts/deploy_mainnet.sh
```

※deploy_mainnet.shはdevnet版とほぼ同じ(URLを`https://api.mainnet-beta.solana.com`に変更)

## 注意

- シードフレーズ・秘密鍵はチャットで送らない・紙/オフライン保管
- 公開repoにキーを絶対に上げない(devnet-keys/・keys/はgit管理外)
- 本番発行前には必ずdevnetで動作確認済みのスクリプトを使う
- 購入したSOLを送る前に、宛先アドレスを必ず二重確認(誤送金は取り戻せない)